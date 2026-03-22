import { Card } from "@/components/ui/card"

export const UserMessage = ({content}:{content:string})=>{
    return (
        <div className='flex justify-end pb-4 pr-2 pl-10'>
            <Card className={"rounded-lg bg-primary text-white dark:text-black p-2 shadow-none border-none max-w-[80%] wrap-break-word"}>{content}</Card>
        </div>
    )

}