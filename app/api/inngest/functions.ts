import { openai, createAgent, createTool, createNetwork, createState } from "@inngest/agent-kit";
import Sandbox from "@e2b/code-interpreter";
import z from "zod";
import { PROMPT } from "@/prompt";
import { inngest } from "@/inngest/client";
import { lastAssistantTextMessageContent } from "@/inngest/utils";

const E2B_SANDBOX_TEMPLATE = process.env.E2B_SANDBOX_TEMPLATE ?? "uigen-nextjs-build";

export const codeAgentFunction = inngest.createFunction(
  { id: "code-agent" },
  { event: "code-agent/run" },
  async ({ event, step }) => {

    // 1️⃣ Connect to prebuilt sandbox
    const sandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create(E2B_SANDBOX_TEMPLATE);

      // Ensure page.tsx exists
      try {
        await sandbox.files.read("app/page.tsx");
      } catch {
        await sandbox.files.write(
          "app/page.tsx",
          `"use client";\nexport default function Home(){ return <div>Loading...</div>; }`
        );
      }

      return sandbox.sandboxId;
    });
    // Ensure shadcn cn utility exists
    await step.run("ensure-cn-utility", async () => {
      const sandbox = await Sandbox.connect(sandboxId);
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
    });

    // 2️⃣ Initial state
    const state = createState({ summary: "", files: {} });

    // 3️⃣ Create code agent
    const codeAgent = createAgent({
      name: "code-agent",
      description: "An expert coding agent",
      system: PROMPT,
      model: openai({ model: "gpt-4o" }),
      tools: [
        // Terminal tool
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

        // Create/Update files
        createTool({
          name: "createOrUpdateFiles",
          description: "Write files to sandbox",
          parameters: z.object({ files: z.array(z.object({ path: z.string(), content: z.string() })) }),
          handler: async ({ files }, { step, network }) =>
            await step?.run("createOrUpdateFiles", async () => {
              const updatedFiles = network?.state?.data?.files || {};
              try {
                const sandbox = await Sandbox.connect(sandboxId);
                for (const file of files) {
                  await sandbox.files.write(file.path, file.content);
                  updatedFiles[file.path] = file.content;
                }
                if (network?.state?.data) network.state.data.files = updatedFiles;
                return updatedFiles;
              } catch (err) {
                return `Error: ${err instanceof Error ? err.message : String(err)}`;
              }
            }),
        }),

        // Read files
        createTool({
          name: "readFiles",
          description: "Read files from sandbox",
          parameters: z.object({ files: z.array(z.string()) }),
          handler: async ({ files }, { step }) =>
            await step?.run("readFiles", async () => {
              try {
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
              } catch (err) {
                return `Error: ${err instanceof Error ? err.message : String(err)}`;
              }
            }),
        }),
      ],

      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastText = lastAssistantTextMessageContent(result);
          if (lastText && network?.state?.data && lastText.includes("<task_summary>")) {
            network.state.data.summary = lastText;
          }
          return result;
        },
      },
    });

    // 4️⃣ Network
    const network = createNetwork({
      name: "coding-agent-network",
      agents: [codeAgent],
      maxIter: 2,
      router: async ({ network }) => network?.state?.data?.summary ? undefined : codeAgent,
    });

    // 5️⃣ Run network
    const result = await network.run(event.data.value, { state });

    // 6️⃣ Sandbox URL (prebuilt sandbox dev server)
    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await Sandbox.connect(sandboxId);
      return `http://${sandbox.getHost(3000)}`; // Port 3000 should now reliably work
    });

    return {
      url: sandboxUrl,
      title: "Untitled",
      files: result?.state?.data?.files,
      summary: result?.state?.data?.summary,
    };
  }
);