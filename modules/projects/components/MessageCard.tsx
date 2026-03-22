import { MessageRole} from '@/generated/prisma/enums'
import { Fragment } from './ProjectView'
import { AssistantMessage } from './AssistantMessage'
import { UserMessage } from './UserMessage'
export type Message = {
    content: string
    role: MessageRole
    type?: string
    isActiveFragment:boolean
    onFragmentClick:(fragments:Fragment | null | undefined)=>void
    fragments?: Fragment | null
    createdAt: Date
  }



const MessageCard = ({content,role,type,isActiveFragment,onFragmentClick,fragments,createdAt}:Message) => {
  if(role === MessageRole.ASSISTANT){
    return (
        <AssistantMessage
        content={content}
        role={role}
        type={type}
        isActiveFragment={isActiveFragment}
        onFragmentClick={onFragmentClick}
        fragments={fragments}
        createdAt={createdAt}
        />
    )
  }

    return <UserMessage content={content}/>
  
}

export default MessageCard