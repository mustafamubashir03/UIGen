"use client"
import { ResizableHandle,ResizablePanel,ResizablePanelGroup } from "@/components/ui/resizable"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useAuth } from "@clerk/nextjs"
import ProjectHeader from "./ProjectHeader"
import { useState } from "react"
import MessageContainer from "./MessageContainer"
import { JsonValue } from "@prisma/client/runtime/client"


export type Fragment = {
    id: string
    messageId: string
    sandboxUrl: string
    title: string
    files: JsonValue
    createdAt: Date
    updatedAt: Date
  }

const ProjectView = ({projectId}:{projectId:string}) => {
    const [activeFragment,setActiveFragment] = useState<Fragment | null>(null)

  
    return (
      <div className="h-screen w-full">
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel
            defaultSize={35}
            minSize={20}
            className="flex flex-col"
          >
            <ProjectHeader projectId={projectId} />
            <MessageContainer projectId={projectId}
            activeFragment={activeFragment}
            setActiveFragment={setActiveFragment}/>
  

          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={65} minSize={50}>
            <div>Hello world</div>

          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    );
  };

export default ProjectView