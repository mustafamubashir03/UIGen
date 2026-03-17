import { openai, createAgent, createTool, createNetwork, createState, Message } from "@inngest/agent-kit";
import Sandbox from "@e2b/code-interpreter";
import z from "zod";
import { PROMPT } from "@/prompt";
import { inngest } from "@/inngest/client";
import { lastAssistantTextMessageContent } from "@/inngest/utils";
import { prisma } from "@/lib/db";
import { MessageRole, MessageType } from "@/generated/prisma/enums";

const E2B_SANDBOX_TEMPLATE = process.env.E2B_SANDBOX_TEMPLATE ?? "uigen-nextjs-build";

type AgentState = {
  summary: string
  files: Record<string, string>
}

export const codeAgentFunction = inngest.createFunction(
  { id: "code-agent" },
  { event: "code-agent/run" },
  async ({ event, step }) => {

    // 1️⃣ Connect to sandbox
    const sandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create(E2B_SANDBOX_TEMPLATE);

      try {
        await sandbox.files.read("app/page.tsx");
      } catch {
        await sandbox.files.write(
          "app/page.tsx",
          `"use client";\nexport default function Home(){ return <div>Loading...</div>; }`
        );
      }

      try {
        await sandbox.files.read("lib/utils.ts");
      } catch {
        await sandbox.files.write(
          "lib/utils.ts",
          `export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}`
        );
      }

      return sandbox.sandboxId;
    });

    // 2️⃣ Load previous messages and create state (typesafe preserved)
    const previousMessages = await step.run("get-previous-messages", async () => {
      const messages = await prisma.message.findMany({
        where: { projectId: event.data.projectId },
        orderBy: { createdAt: "asc" },
      });

      return messages.map((msg) => ({
        type: "text" as const,
        role: msg.role === "ASSISTANT" ? "assistant" : "user",
        content: msg.content,
      }));
    });

    const state = createState<AgentState>(
      {
        summary: "",
        files: {},
      },
      {
        messages: previousMessages as Message[],
      }
    );

    // 3️⃣ Create code agent
    const codeAgent = createAgent({
      name: "code-agent",
      description: "An expert coding agent",
      system: PROMPT,
      model: openai({ model: "gpt-4o" }),
      tools: [
        createTool({
          name: "terminal",
          description: "Run commands in the sandbox",
          parameters: z.object({ command: z.string() }),
          handler: async ({ command }, { step }) => {
            return await step?.run("terminal", async () => {
              const buffers = { stdout: "", stderr: "" };
              try {
                const sandbox = await Sandbox.connect(sandboxId);
                const result = await sandbox.commands.run(command, {
                  timeoutMs: 60_000,
                  onStdout: (data) => { buffers.stdout += data; },
                  onStderr: (data) => { buffers.stderr += data; },
                });
                if (result.exitCode !== 0) {
                  return `Command exited ${result.exitCode}\nstdout:${buffers.stdout}\nstderr:${buffers.stderr}`;
                }
                return buffers.stdout || result.stdout;
              } catch (err) {
                return `Command failed: ${err instanceof Error ? err.message : String(err)}\nstdout:${buffers.stdout}\nstderr:${buffers.stderr}`;
              }
            });
          },
        }),


        createTool({
          name: "createOrUpdateFiles",
          description: "Create or update files in the sandbox",
          parameters: z.object({
            files: z.array(
              z.object({
                path: z.string(),
                content: z.string(),
              })
            ),
          }),
        
          handler: async ({ files }, { step, network }) => {
            const newFiles = await step?.run("createOrUpdateFiles", async () => {
              try {
                const sandbox = await Sandbox.connect(sandboxId)
        
                const updatedFiles: Record<string, string> =
                  network?.state?.data?.files ?? {}
        
                for (const file of files) {
                  await sandbox.files.write(file.path, file.content)
                  updatedFiles[file.path] = file.content
                }
        
                return updatedFiles
              } catch (err) {
                return `Error: ${err instanceof Error ? err.message : String(err)}`
              }
            })
        
            if (typeof newFiles === "object" && network?.state?.data) {
              network.state.data.files = newFiles
            }
        
            return newFiles
          },
        }),

        createTool({
          name: "readFiles",
          description: "Read files from sandbox",
          parameters: z.object({ files: z.array(z.string()) }),
          handler: async ({ files }, { step }) =>
            await step?.run("readFiles", async () => {
              const sandbox = await Sandbox.connect(sandboxId);
              const contents = [];
              for (const file of files) {
                try {
                  const content = await sandbox.files.read(file);
                  contents.push({ path: file, content });
                } catch {
                  contents.push({ path: file, content: "" });
                }
              }
              return JSON.stringify(contents);
            }),
        }),
      ],

      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastText = lastAssistantTextMessageContent(result);
          if (lastText && network?.state?.data) network.state.data.summary = lastText;
          return result;
        },
      },
    })

    // 4️⃣ Network
    const network = createNetwork({
      name: "coding-agent-network",
      agents: [codeAgent],
      maxIter: 10,
      router: async ({ network }) => network?.state?.data?.summary ? undefined : codeAgent,
    });

    const result = await network.run(event.data.value, { state });
    const isError =!result.state.data.summary || Object.keys(result.state.data.files || {}).length === 0;

    // Sandbox URL
    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await Sandbox.connect(sandboxId);
      return `http://${sandbox.getHost(3000)}`;
    });

    //  Save result in DB
    await step.run("save-result", async () => {
      if (isError) {
        return prisma.message.create({
          data: {
            projectId: event.data.projectId,
            content: "Something went wrong. Please try again.",
            role: MessageRole.ASSISTANT,
            type: MessageType.ERROR,
          },
        })
      }
    
      return prisma.message.create({
        data: {
          projectId: event.data.projectId,
          content: result.state.data.summary!,
          role: MessageRole.ASSISTANT,
          type: MessageType.RESULT,
          fragments: {
            create: {
              sandboxUrl,
              title: "Untitled",
              files: result.state.data.files,
            },
          },
        },
      })
    })

    return {
      url: sandboxUrl,
      title: "Untitled",
      files: result.state.data.files ?? {},
      summary: result.state.data.summary ?? "",
    }
  }
);