import { MessageType } from "@/generated/prisma/enums"
import { cn } from "@/lib/utils"
import UIGenLogo from "@/modules/home/components/UIGenLogo"
import { FragmentCard } from "./FragmentCard"
import { Message } from "./MessageCard"
import { format } from "date-fns"
import AIResponse from "./AIResponse"

export const AssistantMessage = ({content,role,type,isActiveFragment,onFragmentClick,fragments,createdAt}:Message)=>{
    return (
        <div className={cn("flex flex-col group px-2 pb-4 rounded-lg bg-muted max-w-[80%] p-2", type===MessageType.ERROR && "text-red-700 dark:text-red-500" )}>
            <div className='flex items-center gap-2 mb-2'>
                <UIGenLogo className='size-10'/>
                <span className='text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100'>{format(new Date(createdAt), "HH:mm 'on' MMM dd, yyyy")}</span>
            </div>
            <div className=' flex flex-col gap-y-4'>
                <AIResponse content={content}/>
                {fragments && type === MessageType.RESULT && (
                    <FragmentCard
                    fragments={fragments}
                    isActiveFragment={isActiveFragment}
                    onFragmentClick={onFragmentClick}
                    />
                )}
            </div>

        </div>
    )
}