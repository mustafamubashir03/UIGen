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

// Safe helper for extracting text content
function getMessageContent(msg: Message | undefined): string {
  if (!msg) return "";
  if ("content" in msg) {
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
    
      // 1️⃣ Fetch the latest RESULT message with files
      const lastResult = await prisma.message.findFirst({
        where: { projectId: event.data.projectId, type: MessageType.RESULT },
        orderBy: { createdAt: "desc" },
        include: { fragments: true },
      });
    
      // 2️⃣ If previous files exist, write them into the new sandbox
      if (lastResult?.fragments?.files && typeof lastResult.fragments.files === "object") {
        const files = lastResult.fragments.files as Record<string, string>;
        for (const [path, content] of Object.entries(files)) {
          await sandbox.files.write(path, content);
        }
        console.log(`[DEBUG] Re-hydrated sandbox with ${Object.keys(files).length} files.`);
      } else {
        // 3️⃣ Default initial files if brand-new project
        await sandbox.files.write("app/page.tsx", `"use client";\nexport default function Home(){ return <div>Loading...</div>; }`);
        await sandbox.files.write("lib/utils.ts", `export function cn(...classes: (string | boolean | undefined | null)[]) { return classes.filter(Boolean).join(" "); }`);
      }
    
      return sandbox.sandboxId;
    });


    const dsGen = new DesignSystemGenerator();
    const baseDesignSystem = dsGen.generate(event.data.value);
    console.log("[DEBUG] BASE DESIGN SYSTEM:", JSON.stringify(baseDesignSystem, null, 2));

    // 3️⃣ Create designAgent → enhance JSON and produce designGuide
    const finalPrompt = `
### ROLE
You are a Senior UI/UX Systems Architect. Your goal is to generate a deterministic, production-grade design system and a structured UI plan that a coding agent can execute without guessing.

### STEP 0: INTENT DETECTION
Analyze the user request:
- PATH A (FIX/MODIFY): Minor changes or bug fixes.
- PATH B (NEW BUILD): Full page or feature.

### STEP 1: DESIGN TOKENS (HSL SHADCN BRIDGE)
- Typography: Two Google Fonts (Heading + Body)
- Colors: Provide HSL for --primary, --secondary, --background, --foreground, --muted, --accent, --border
- Layout: Base spacing unit (4px/8px), --radius, padding, card radius

### STEP 2: COMPONENT & SECTION HIERARCHY
- Atoms: List all Shadcn/UI components required
- Sections: Composition instructions for Hero, Features, Grid, Footer
- Page: Vertical assembly

### FEW-SHOT EXAMPLES
#### PATH A
User: "Fix button overlap"
Architect Output: INTENT: FIX, Analysis + Corrections + Coder Steps

#### PATH B
User: "Build dark-mode landing page for a gym"
Architect Output: INTENT: NEW BUILD, HSL Tokens Table, Fonts, Components, Section Layouts, Execution Plan

### HARD RULES
- NO RAW HEX, only HSL
- NO FAKE CLASSES
- LUCIDE React icons only
- SHADCN first, always verify component exists
- Provide skeleton JSX if component does not exist
- Iterative build: Read → Build → Verify → Fix → Repeat

### OUTPUT FORMAT
1. INTENT TYPE
2. DESIGN TOKENS (HSL & Fonts)
3. COMPONENT INVENTORY
4. SECTION ARCHITECTURE
5. EXECUTION STEPS FOR CODER

Strictly follow this guide.
`;


    const designAgent = createAgent({
      name: "design-agent",
      description: "Generates a complete high-fidelity design guide and sample code snippets for a Next.js + Tailwind project",
      system: finalPrompt,
      model: openai({ model: "gpt-4o" }),
    });

    const { output: designOutput } = await designAgent.run(
      event.data.value
    );
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
                    const SHADCN_AWARE_CONSTRAINTS = 
            You are working in a Next.js 15+ App Router environment. 

            🚨 ANTI-CONFLICT RULES (CRITICAL):
            1. NEVER create or use a "pages/" directory. This project uses the APP ROUTER.
            2. The main entry point is "app/page.tsx".
            3. If you see a "pages/" directory, you MUST delete it immediately: terminal({ command: "rm -rf pages" }).
            4. Do not attempt to use "pages/api" or "pages/index.tsx".

            🚨 TERMINAL & ENVIRONMENT RULES:
            1. DO NOT check ports or use "lsof", "fuser", or "netstat". These commands are NOT available.
            2. The environment automatically handles the dev server; you only need to focus on FILE CHANGES.
            3. If you need to "restart" or "kill" something, do not. Just move to the next file operation.

            🚨 SHADCN & IMPORTS:
            1. Use "readFiles" to verify "components/ui/*" exists before importing.
            2. If a component is missing, create it or inline it.
            3. Use the "@/" alias for all internal imports.

✅ WORKFLOW:
Read Files → Create/Update Files → Verify → Final Summary.


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
        const codeSystemPrompt = `
            ${SHADCN_AWARE_CONSTRAINTS}

            ### 🏗️ ARCHITECT'S TECHNICAL SPECIFICATION
            Everything inside <design_guide> is the single source of truth. Follow exactly.
            🚨 SANDBOX LIMITATIONS:
              - No 'lsof', 'fuser', 'sudo'.
              - Do NOT try to kill processes or ports.
              - Focus only on file edits.

            <design_guide>
            ${designGuide}
            </design_guide>

            ### 👤 USER REQUEST
            ${event.data.value}

            ### 🛠️ CODER EXECUTION PLAN
            - Phase 0: Detect intent (fix vs new build)
            - Phase 1: Apply HSL Tokens and Typography
            - Phase 2: Build Atoms and Sections (Shadcn verified)
            - Phase 3: Assemble Page.tsx
            - Phase 4: Iteratively verify imports, skeletons, and run app
            `;
    // 4️⃣ Create codeAgent using the enriched designGuide
    const codeAgent = createAgent({
      name: "code-agent",
      description: "An expert coding agent",
      system:codeSystemPrompt,
      model: openai({ model: "gpt-4o-mini" }),
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
          if (lastText && network?.state?.data) network.state.data.summary = lastText;
          return result;
        },
      },
    });

    // 5️⃣ Network execution
    const network = createNetwork({
      name: "coding-agent-network",
      agents: [codeAgent],
      maxIter: 10,
      router: async ({ network }) => {
        // Only stop if we have a summary AND at least one file exists
        if (network?.state?.data?.summary && Object.keys(network?.state?.data?.files || {}).length > 0) {
          return undefined;
        }
        return codeAgent;
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