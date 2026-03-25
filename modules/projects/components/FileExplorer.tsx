"use client"

import { CopyCheckIcon, CopyIcon } from "lucide-react"
import { useState, useMemo, useCallback } from "react"

import { Button } from "@/components/ui/button"
import {
  ResizablePanel,
  ResizableHandle,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

import { Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip"

import { convertFilesToTreeItems, getLanguageFromExtension } from "@/lib/utils"
import { TreeView } from "./TreeView"
import CodeView from "./Code View/CodeView"
import { JsonValue } from "@prisma/client/runtime/client"



type Props = {
  files: JsonValue
}
type FileMap = Record<string, string>
const FileExplorer = ({ files }: Props) => {
  const [copied, setCopied] = useState(false)
  
  const safeFiles: FileMap = useMemo(() => {
    if (files && typeof files === "object" && !Array.isArray(files)) {
      return files as FileMap
    }
    return {}
  }, [files])
  const [selectedFile, setSelectedFile] = useState<string | null>(() => {
    const keys = Object.keys(safeFiles)
    return keys.length ? keys[0] : null
  })
  
 
  const treeData = useMemo(() => {
    return convertFilesToTreeItems(safeFiles)
  }, [safeFiles])


  const handleSelect = useCallback(
    (path: string) => {
      if (safeFiles[path]) {
        setSelectedFile(path)
      }
    },
    [safeFiles]
  )


  const handleCopy = useCallback(() => {
    if (!selectedFile || !safeFiles[selectedFile]) return

    navigator.clipboard.writeText(safeFiles[selectedFile]).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [selectedFile,safeFiles])

  const fileContent = selectedFile ? safeFiles[selectedFile] : null

  return (

      <ResizablePanelGroup
        orientation="horizontal"
        className="h-full w-full overflow-hidden"
      >

        <ResizablePanel
            defaultSize={30}
            minSize={20}
            className="bg-sidebar border-r flex flex-col"
          >
          <div className="flex-1  bg-blend-screen overflow-auto">
            <TreeView
              data={treeData}
              value={selectedFile ?? undefined}
              onSelect={handleSelect}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="w-[2px] bg-border hover:bg-primary/30 transition-colors" />

        <ResizablePanel
          defaultSize={70} minSize={50}
          className="flex flex-col"
        >
          {!fileContent ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <p className="text-sm">Select a file to view its content</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b bg-sidebar/50 px-4 py-2">
                
                <Breadcrumb>
                  <BreadcrumbList>
                    {selectedFile?.split("/").map((part, i, arr) => {
                      const isLast = i === arr.length - 1

                      return (
                        <span key={i} className="flex items-center">
                          <BreadcrumbItem>
                            {isLast ? (
                              <BreadcrumbPage>{part}</BreadcrumbPage>
                            ) : (
                              <span className="text-muted-foreground">
                                {part}
                              </span>
                            )}
                          </BreadcrumbItem>
                          {!isLast && <BreadcrumbSeparator />}
                        </span>
                      )
                    })}
                  </BreadcrumbList>
                </Breadcrumb>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleCopy}
                      className="h-8 w-8 cursor-pointer"
                    >
                      {copied ? (
                        <CopyCheckIcon className="h-4 w-4 text-green-500" />
                      ) : (
                        <CopyIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {copied ? "Copied!" : "Copy file"}
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="flex-1 overflow-auto p-4">
                <CodeView code={safeFiles[selectedFile!]}
                 lang={getLanguageFromExtension(selectedFile!)}
                />
              </div>
            </>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
  )
}

export default FileExplorer