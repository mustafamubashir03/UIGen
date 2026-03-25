"use client"
import { useGetMessages, prefetchMessages } from "@/modules/messages/hooks"
import { useEffect, useRef} from "react"
import { useQueryClient } from "@tanstack/react-query"
import { MessageRole } from "@/generated/prisma/enums"
import { Spinner } from "@/components/ui/spinner"
import MessageCard from "./MessageCard"
import { Fragment } from "./ProjectView"
import MessageForm from "./MessageForm"
import MessageLoader from "./MessageLoader"

const MessageContainer = ({projectId,activeFragment,setActiveFragment}:{projectId:string, activeFragment:Fragment | null, setActiveFragment:(fragment:Fragment | null)=>void}) => {
    const queryClient = useQueryClient()
    const bottomRef = useRef<HTMLDivElement | null>(null)
    const lastAssistantMessageIdRef = useRef<string | null>(null)
    const {data:messages, isPending, isError, error} = useGetMessages({projectId})
    useEffect(()=>{
        if(projectId){
            prefetchMessages({queryClient,projectId})
        }
    },[projectId,queryClient])

    useEffect(()=>{
        const lastAssistantMessage = messages?.findLast(
            (message)=>message.role === MessageRole.ASSISTANT
        )
        if(lastAssistantMessage?.fragments && lastAssistantMessage.id !== lastAssistantMessageIdRef.current){
            setActiveFragment(lastAssistantMessage?.fragments)
            lastAssistantMessageIdRef.current = lastAssistantMessage.id
        }

    },[messages, setActiveFragment])

    useEffect(()=>{
        bottomRef?.current?.scrollIntoView({behavior:"smooth"})

    },[messages?.length])
    if(isPending){
        return (
            <div className="flex items-center justify-center h-full">
                <Spinner className="text-primary"/>
            </div>
        )
    }
    if(isError){
        return (
            <div className="flex items-center justify-center h-full text-red-300">
                Error:{error?.message || "Failed to load messages"}
            </div>
        )
    }
    if(!messages || messages.length === 0){
        return (
            <div className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    No Messages yet. Start a conversation!
                </div>
                <div className="relative p-3 pt-1">
                    <div className="absolute -top-6 left-0 right-0 h-6 bg-linear-to-b from-transparent to-background pointer-events-none">
                        <MessageForm projectId={projectId}/>
                    </div>

                </div>
            </div>
        )
    }

    const lastMessage = messages[messages.length - 1]
    const isLastMessageUser = lastMessage.role === MessageRole.USER

    return (
        <div className="flex flex-col px-2 flex-1 min-h-0">
      
          {/* SCROLLABLE AREA */}
          <div className="flex-1 min-h-0 pt-6 overflow-y-auto">
            {messages.map((message) => {
              return (
                <MessageCard
                  key={message?.id}
                  content={message.content}
                  role={message.role}
                  fragments={message.fragments}
                  createdAt={message.createdAt}
                  isActiveFragment={activeFragment?.id === message.fragments?.id}
                  onFragmentClick={() => setActiveFragment(message.fragments)}
                  type={message.type}
                />
              )
            })}
            {isLastMessageUser && <MessageLoader/>}
      
            <div ref={bottomRef} />
          </div>
      
          <div className="p-3 border-t border-border/40 bg-background/60 backdrop-blur-xl supports-backdrop-filter:bg-background/50">
            <MessageForm projectId={projectId} />
          </div>
      
        </div>
      )
}

export default MessageContainer