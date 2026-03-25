import React from 'react'
import { useState } from 'react'
import { ExternalLink, ExternalLinkIcon, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'


const FragmentWeb = ({data}:{data:{sandboxUrl:string}}) => {
  const [fragmentKey,setFragmentKey] = useState(0)
  const [copied,setCopied] = useState(false)
  const onRefresh = ()=>{
    setFragmentKey((prev)=>prev-1)
  }
  const onCopy = ()=>{
    navigator.clipboard.writeText(data.sandboxUrl)
    setCopied(true)
    setTimeout(()=>{
        setCopied(false)
    },2000)
  }
  return (
    <div className='flex flex-col w-full h-full'>
        <div className='p-2 border-b bg-sidebar flex items-center gap-x-2'>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button className='cursor-pointer' size={"sm"} variant={"outline"} onClick={onRefresh}>
                    <RefreshCcw />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    Refresh preview
                </TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                <Button size={"sm"} variant={"outline"} onClick={onCopy} disabled={!data.sandboxUrl || copied} className='flex-1 cursor-pointer justify-start text-start font-normal'>
                    <span className='truncated'>{data.sandboxUrl}</span>
                </Button>

                </TooltipTrigger>
                <TooltipContent>
                    {copied?"Copied":"Click to Copy"}
                </TooltipContent>

            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button className='cursor-pointer' size={"sm"} variant={"outline"} onClick={()=>{
                        if(!data.sandboxUrl) return;
                        window.open(data.sandboxUrl ,"_blank")
                    }}>
                     <ExternalLinkIcon/>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    Open in new Tab
                </TooltipContent>
            </Tooltip>
        </div>
        <iframe
        key={fragmentKey}
        className='h-full w-full'
        sandbox='allow-scripts allow-same-origin'
        loading='lazy'
        src={data.sandboxUrl}
        />
    </div>
  )
}

export default FragmentWeb
