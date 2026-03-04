import { inngest } from "../../../inngest/client";
import { gemini, createAgent } from "@inngest/agent-kit";
import Sandbox from "@e2b/code-interpreter"


export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "agent/hello.world" },
  async ({ event, step }) => {
    const sandboxId = await step.run("get-sandbox-id", async()=>{
      const sandbox = await Sandbox.create("mustafamubashir87/uigen-nextjs-build")
      return sandbox.sandboxId
    })
    const helloAgent = createAgent({
        name:"hello-agent",
        description:"A simple agent that says hello to the world",
        system:"You are a helpful assistant that says hello to the world",
        tools:[],
        model: gemini({ model: "gemini-2.5-flash" }),
    })
    const result = await helloAgent.run('say hello to  the world')
    const sandboxUrl = await step.run("get-sandbox-url",async()=>{
      const sandbox = await Sandbox.connect(sandboxId)
      const host = sandbox.getHost(3000);
      return `http://${host}`
    })
    return {
        message: result.output
    }
  },

);