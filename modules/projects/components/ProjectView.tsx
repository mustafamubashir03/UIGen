"use client"
import { ResizableHandle,ResizablePanel,ResizablePanelGroup } from "@/components/ui/resizable"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import ProjectHeader from "./ProjectHeader"
import { useState } from "react"
import MessageContainer from "./MessageContainer"
import { JsonValue } from "@prisma/client/runtime/client"
import { CodeIcon, CrownIcon, EyeIcon } from "lucide-react"
import Link from "next/link"
import FragmentWeb from "./FragmentWeb"
import FileExplorer from "./FileExplorer"


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
    const [tabState,setTabsState] = useState("preview")

  
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
            <Tabs className="h-full flex  flex-col " defaultValue="preview" value={tabState} onValueChange={(value)=>setTabsState(value)}>
                <div className="w-full flex items-center p-2 border-b gap-x-2">
                  <TabsList className="h-8 border rounded-md">
                    <TabsTrigger value="preview" className="rounded-md cursor-pointer px-3 flex items-center gap-x-2">
                      <EyeIcon className="size-4"/>
                      <span>Preview</span>
                    </TabsTrigger>
                    <TabsTrigger value="code" className="rounded-md cursor-pointer px-3 flex items-center gap-x-2">
                      <CodeIcon className="size-4"/>
                      <span>Demo</span>
                    </TabsTrigger>
                  </TabsList>
            <div className="ml-auto flex items-center gap-x-2">
              <Button asChild size={"sm"} variant={"outline"}>
                <Link href={"/pricing"}>
                <CrownIcon className="size-4 text-yellow-300 mr-2"/>
                Upgrade
                </Link>
              </Button>
            </div>
                </div>
              <TabsContent value="preview" className="flex-1 h-[calc(100%-4rem) overflow-hidden">
                {
                  activeFragment ? (<FragmentWeb data={activeFragment}/>):(<div className="flex items-center justify-center h-full text-muted-foreground">Select a fragment to Preview</div>)
                }
              </TabsContent>
            <TabsContent value="code" className="flex-1 h-[calc(100%-4rem) overflow-hidden">
              {
                activeFragment?.files ? (<FileExplorer files={activeFragment?.files}/>):(<div className="flex items-center justify-center h-full text-muted-foreground">
                  Select a fragment to view code
                </div>)
              }
            </TabsContent>
            </Tabs>

          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    );
  };

export default ProjectView