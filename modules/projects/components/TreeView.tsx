"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarProvider,
  SidebarRail,
} from "@/components/ui/sidebar"
import { ChevronRightIcon, FileIcon, FolderIcon } from "lucide-react"
import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible"


type TreeItem = string | [string, ...TreeItem[]]

type TreeViewProps = {
  data: TreeItem[]
  value?: string
  onSelect?: (path: string) => void
}

type TreeProps = {
  item: TreeItem
  selectedValue?: string
  onSelect?: (path: string) => void
  parentPath: string
}

export const TreeView = ({ data, value, onSelect }: TreeViewProps) => {
  return (
    <SidebarProvider>
      <Sidebar collapsible="none" className="w-full">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {data.map((item, index) => (
                  <Tree
                    key={index}
                    item={item}
                    selectedValue={value}
                    onSelect={onSelect}
                    parentPath=""
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
    </SidebarProvider>
  )
}


const Tree = ({ item, selectedValue, onSelect, parentPath }: TreeProps) => {
  const isFolder = Array.isArray(item)

  const name = isFolder ? item[0] : item
  const children = isFolder ? item.slice(1) : []

  const currentPath = parentPath ? `${parentPath}/${name}` : name


  if (!isFolder) {
    const isSelected = selectedValue === currentPath

    return (
      <SidebarMenuButton
        isActive={isSelected}
        className="data-[active=true]:bg-transparent cursor-pointer"
        onClick={() => onSelect?.(currentPath)}
      >
        <FileIcon className="size-4 text-muted-foreground" />
        <span className="truncate">{name}</span>
      </SidebarMenuButton>
    )
  }


  return (
    <SidebarMenuItem>
      <Collapsible
        defaultOpen
        className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton className="cursor-pointer">
            <ChevronRightIcon className="transition-transform size-4" />
            <FolderIcon className="size-4 text-primary/70" />
            <span className="truncate">{name}</span>
          </SidebarMenuButton>
        </CollapsibleTrigger>

        <SidebarMenuSub>
          {children.map((child, index) => (
            <Tree
              key={index}
              item={child}
              selectedValue={selectedValue}
              onSelect={onSelect}
              parentPath={currentPath}
            />
          ))}
        </SidebarMenuSub>
      </Collapsible>
    </SidebarMenuItem>
  )
}