import { openai, createAgent, createTool, createNetwork, createState, Message } from "@inngest/agent-kit";
import Sandbox from "@e2b/code-interpreter";
import z from "zod";
import { FRAGMENT_TITLE_PROMPT, PROMPT, RESPONSE_PROMPT } from "@/prompt";
import { inngest } from "@/inngest/client";
import { lastAssistantTextMessageContent } from "@/inngest/utils";
import { prisma } from "@/lib/db";
import { MessageRole, MessageType } from "@/generated/prisma/enums";
import { DesignSystemGenerator } from "@/lib/design/designSystem";

const E2B_SANDBOX_TEMPLATE = process.env.E2B_SANDBOX_TEMPLATE ?? "uigen-nextjs-build";

type AgentState = {
  summary: string;
  files: Record<string, string>;
};
type MessageForState = {
  type: "text";
  role: "assistant" | "user";
  content: string;
};

// Safe helper for extracting text content
function getMessageContent(msg: Message | undefined): string {
  if (!msg) return "";
  // Only text messages have content
  if (msg.type === "text") {
    if (Array.isArray(msg.content)) return msg.content.join("");
    if (typeof msg.content === "string") return msg.content;
  }
  return "";
}

export const codeAgentFunction = inngest.createFunction(
  { 
    id: "code-agent", 
    retries: 2,
    triggers: [{ event: "code-agent/run" }] 
  },
  async ({ event, step }) => {
    // 1️⃣ Connect to sandbox
    const previousMessages = await step.run("get-previous-messages", async () => {
      const formattedMessages: Message[] = [];
      const messages = await prisma.message.findMany({
        where: { projectId: event.data.projectId },
        orderBy: { createdAt: "desc" },
      });
    
      for (const message of messages) {
        formattedMessages.push({
          type: "text",
          role: message.role === "ASSISTANT" ? "assistant" : "user",
          content: message.content,
        });
      }
      return formattedMessages;
    });
    
    const state = createState<AgentState>({
      summary: "",
      files: {},
    }, {
      messages: previousMessages,
    });
    const sandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create(E2B_SANDBOX_TEMPLATE);

      try { await sandbox.files.read("app/page.tsx"); } 
      catch { await sandbox.files.write("app/page.tsx", `"use client";\nexport default function Home(){ return <div>Loading...</div>; }`); }

      try { await sandbox.files.read("lib/utils.ts"); } 
      catch { await sandbox.files.write("lib/utils.ts", `export function cn(...classes: (string | boolean | undefined | null)[]) { return classes.filter(Boolean).join(" "); }`); }

      return sandbox.sandboxId;
    });


    const dsGen = new DesignSystemGenerator();
    const baseDesignSystem = dsGen.generate(event.data.value);
    console.log("[DEBUG] BASE DESIGN SYSTEM:", JSON.stringify(baseDesignSystem, null, 2));

    // 3️⃣ Create designAgent → enhance JSON and produce designGuide
    const designAgent = createAgent({
      name: "design-agent",
      description: "Enhances design system JSON and outputs a full design guide prompt for code agent",
      system: `
You are a senior UI/UX architect. 
You receive a base design system JSON and must:
1️⃣ Enhance the JSON: improve colors, spacing, typography, sections, components, interactions.
2️⃣ Convert the enhanced JSON into a single high-quality textual DESIGN_GUIDE prompt.
- Include UI layout guidance, section/component hierarchy, UX rules, Tailwind/Next.js constraints.
- Include small illustrative code snippets only if needed.
- Whenever a visual illustration, hero section, banner, or background is mentioned, suggest a relevant Unsplash image URL, with alt text and short description of why it fits the design context.
- This prompt will be the ONLY input for the code agent.

Input JSON:
${JSON.stringify(baseDesignSystem, null, 2)}
`,
      model: openai({ model: "gpt-4o-mini" }),
    });

    const { output: designOutput } = await designAgent.run("Enhance and convert design system");
    console.log("[DEBUG] DESIGN AGENT OUTPUT:", JSON.stringify(designOutput, null, 2));

    // Ensure codeAgent uses designAgent output
    const designGuide = getMessageContent(designOutput[0]);
    if (!designGuide) console.warn("[WARN] DesignAgent did not return content! CodeAgent will fallback.");
    console.log("[DEBUG] DESIGN GUIDE CONTENT:", designGuide);
    const SHADCN_AWARE_CONSTRAINTS = `
        You are working inside a Next.js sandbox that ALREADY has:
        - Tailwind CSS installed
        - shadcn/ui installed with ALL components

        🚨 CRITICAL RULES:

        1. VERIFY BEFORE IMPORT
        - Before importing ANY component, you MUST confirm it exists.
        - Use readFiles to inspect:
          - components/ui/*
          - lib/utils.ts

        2. SHADCN USAGE RULE
        - You MAY use shadcn components like:
          - Button, Card, Input, etc.
        - BUT ONLY if they exist in /components/ui/

        - NEVER assume uncommon components exist:
          ❌ Video
          ❌ Player
          ❌ MusicCard

        3. IF COMPONENT DOES NOT EXIST:
        - You MUST create it using createOrUpdateFiles
        - OR inline it inside the page

        4. IMPORT RULE (STRICT)
        - Every import MUST resolve to a real file
        - If unsure → DO NOT import → inline instead

        5. ITERATIVE DEVELOPMENT (MANDATORY)
        - Step 1: readFiles to inspect project
        - Step 2: create/update page.tsx
        - Step 3: create missing components
        - Step 4: fix imports
        - Step 5: repeat until complete

        6. COMPLETION CHECK
        Before finishing:
        - All imports valid
        - No missing files
        - App runs without errors

        7. FALLBACK STRATEGY
        If anything is unclear:
        - Use simple Tailwind divs instead of importing

        🚫 NEVER:
        - Import non-existent components (like Video)
        - Assume a component exists without checking
        - Stop after one file

        ✅ ALWAYS:
        - Read → Build → Verify → Fix → Repeat
        `;

    // 4️⃣ Create codeAgent using the enriched designGuide
    const codeAgent = createAgent({
      name: "code-agent",
      description: "An expert coding agent",
      system:
  (designGuide || "Fallback: sensible defaults") +
      "\n\n" +
      PROMPT +
      "\n\n" +
      SHADCN_AWARE_CONSTRAINTS,
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
                  onStdout: (d) => {
                    buffers.stdout += d;
                  },
                  onStderr: (d) => {
                    buffers.stderr += d;
                  },

                });
                console.log(`[DEBUG] Terminal command executed: ${command}, exitCode: ${result.exitCode}`);
                return result.exitCode === 0 ? (buffers.stdout || result.stdout) : `Command failed with exit code ${result.exitCode}\nstdout:${buffers.stdout}\nstderr:${buffers.stderr}`;
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
            files: z.array(z.object({ path: z.string(), content: z.string() })),
          }),
          handler: async ({ files }, { step, network }) => {
            const newFiles = await step?.run("createOrUpdateFiles", async () => {
              const sandbox = await Sandbox.connect(sandboxId);
              const updatedFiles: Record<string, string> = network?.state?.data?.files ?? {};
              for (const file of files) {
                await sandbox.files.write(file.path, file.content);
                updatedFiles[file.path] = file.content;
              }
              return updatedFiles;
            });
            if (typeof newFiles === "object" && network?.state?.data) network.state.data.files = newFiles;
            console.log("[DEBUG] Updated files:", JSON.stringify(newFiles, null, 2));
            return newFiles;
          },
        }),
        createTool({
          name: "readFiles",
          description: "Read files from sandbox",
          parameters: z.object({ files: z.array(z.string()) }),
          handler: async ({ files }, { step }) => {
            return await step?.run("readFiles", async () => {
              const sandbox = await Sandbox.connect(sandboxId);
              const contents: { path: string; content: string }[] = [];
              for (const file of files) {
                try { contents.push({ path: file, content: await sandbox.files.read(file) }); }
                catch { contents.push({ path: file, content: "" }); }
              }
              return JSON.stringify(contents);
            });
          },
        }),
      ],
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastText = lastAssistantTextMessageContent(result);
          if (lastText?.includes("<task_summary>") && network?.state?.data) {
            network.state.data.summary = lastText;
          }
          return result;
        },
      }
    });

    const codeReviewAgent = createAgent({
      name: "code-review-agent",
      description: "Evaluates if the code/files produced are good enough to stop looping",
      system: `
    You are a pragmatic senior engineer.

    Your job is NOT perfection.
    Your job is to decide if the code/files are GOOD ENOUGH to ship.

    Evaluate the following:
    1. Core functionality implemented?
    2. App runs without errors?
    3. UI components present and correctly structured?

    Ignore:
    - Minor styling issues
    - Animations or micro-polish

    Return JSON:

    {
      "score": number (0-10),
      "severity": "major" | "minor",
      "should_continue": boolean,
      "reason": string
    }

    Rules:
    - score < 6 → major → should_continue = true
    - score 6–7.5 → minor → should_continue = optional
    - score > 7.5 → STOP → should_continue = false

    Be practical, not perfectionist.
    `,
      model: openai({ model: "gpt-4o-mini" }),
    });

    // 5️⃣ Network execution
    const network = createNetwork({
      name: "coding-agent-network",
      agents: [codeAgent],
      maxIter: 10,
      router: async ({ network }) => {
        // Get last state files
        const currentFiles = network?.state?.data?.files || {};
        const prevFiles = network?.state?.data?.prevFiles || {};
        
        // Check if files changed meaningfully
        const filesUnchanged = JSON.stringify(currentFiles) === JSON.stringify(prevFiles);
        network.state.data.prevFiles = currentFiles;
    
        if (filesUnchanged) {
          // No meaningful changes, stop to prevent infinite loop
          return undefined;
        }
    
        const reviewPrompt = `
        Please review the following code/files and summary:

          FILES:
          ${JSON.stringify(currentFiles, null, 2)}

          SUMMARY:
          ${network.state.data.summary || ""}
          `;

          const { output: reviewOutput } = await codeReviewAgent.run(reviewPrompt);
          const reviewJsonText = getMessageContent(reviewOutput[0]);
          const reviewJson = reviewJsonText ? JSON.parse(reviewJsonText) : null;
    
        if (!reviewJson) return codeAgent; // fallback to continue
    
        if (reviewJson.should_continue && reviewJson.severity === "major") {
          return codeAgent; // loop again for major fixes
        }
    
        if (reviewJson.score < 7.5 && reviewJson.severity === "minor") {
          return codeAgent; // optional iteration for minor improvements
        }
    
        // Otherwise stop looping
        return undefined;
      },
    });

    const result = await network.run(event.data.value, { state });
    console.log("[DEBUG] Network result:", JSON.stringify(result.state.data, null, 2));

    // 6️⃣ Fragment title and response generation
    const fragmentTitleGenerator = createAgent({
      name: "fragment-title-generator",
      description: "Generates a title for the fragment",
      system: FRAGMENT_TITLE_PROMPT,
      model: openai({ model: "gpt-4o-mini" }),
    });
    const responseGenerator = createAgent({
      name: "response-generator",
      description: "Generate a response for the fragment",
      system: RESPONSE_PROMPT,
      model: openai({ model: "gpt-4o-mini" }),
    });

    const { output: fragmentTitleOutput } = await fragmentTitleGenerator.run(result.state.data.summary);
    const { output: responseOutput } = await responseGenerator.run(result.state.data.summary);

    const generateFragmentTitle = () => getMessageContent(fragmentTitleOutput[0]) || "Untitled";
    const generateResponse = () => getMessageContent(responseOutput[0]) || "Untitled";

    const isError = !result.state.data.summary || Object.keys(result.state.data.files || {}).length === 0;

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await Sandbox.connect(sandboxId);
      return `https://${sandbox.getHost(3000)}`;
    });

    await step.run("save-result", async () => {
      if (isError) {
        return prisma.message.create({
          data: {
            projectId: event.data.projectId,
            content: "Something went wrong. Please try again.",
            role: MessageRole.ASSISTANT,
            type: MessageType.ERROR,
          },
        });
      }

      return prisma.message.create({
        data: {
          projectId: event.data.projectId,
          content: generateResponse(),
          role: MessageRole.ASSISTANT,
          type: MessageType.RESULT,
          fragments: {
            create: {
              sandboxUrl,
              title: generateFragmentTitle(),
              files: result.state.data.files,
            },
          },
        },
      });
    });

    return {
      url: sandboxUrl,
      title: generateFragmentTitle(),
      files: result.state.data.files,
      summary: result.state.data.summary,
    };
  }
);