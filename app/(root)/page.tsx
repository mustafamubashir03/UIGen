"use client"

import { Button } from "@/components/ui/button"
import { inngest } from "@/inngest/client"
import ProjectForm from "@/modules/home/components/ProjectForm"
import UIGenLogo from "@/modules/home/components/UIGenLogo"
import { toast } from "sonner"


const page = () => {
  const onInvoke = async()=>{
    await inngest.send({
      name:"agent/hello.world",
    }
  )
  toast.success("Done")
  }
  return (
    <div className="flex items-center justify-between w-full px-4 py-8">
      <div className="max-w-5xl  mt-10 w-full mx-auto">
        <section className="space-y-4 flex justify-center flex-col items-center">
          <div className="flex  flex-col items-center">
            <UIGenLogo className="hidden md:block  w-32 h-32 md:w-48 md:h-48"/>

          </div>
          <h1 className="text-2xl md:text-5xl font-normal text-center">Build Modern Aesthetic UI</h1>
          <p className="text-lg md:text-xl text-muted-foreground text-center">Create modern websites by chatting with AI</p>
          <div className="max-w-5xl w-full mt-10">
              <ProjectForm/>
          </div>
          <Button onClick={onInvoke}>Invoke AI Agent</Button>
        </section>

      </div>
    </div>
  )
}

export default page