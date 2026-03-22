import { cn } from "@/lib/utils"
import { ChevronRightIcon, Code2Icon } from "lucide-react"
import { Fragment } from "./ProjectView"

export const FragmentCard = ({fragments ,isActiveFragment, onFragmentClick}: {fragments?: Fragment | null,isActiveFragment:boolean,onFragmentClick:(fragments:Fragment | null | undefined)=>void})=>{
    return (
        <button className={cn("flex items-start cursor-pointer text-start gap-2 border rounded-lg bg-muted w-fit p-2 hover:bg-secondary transition-colors", isActiveFragment && "bg-primary text-primary-foreground border-primary hover:bg-primary")}
        onClick={()=>onFragmentClick(fragments)}>
             <Code2Icon className='size-4 mt-0.5'/>
             <div className='flex flex-col flex-1'>
                <span className='text-sm font-medium line-clamp-1'>
                    {fragments?.title}
                </span>
                <span className='text-sm'>
                    Preview
                </span>
             </div>
             <div className='flex items-center justify-center mt-0.5'>
                <span className='text-sm'>
                    <ChevronRightIcon className='size-4'/>
                </span>

             </div>
        </button>
    )
}