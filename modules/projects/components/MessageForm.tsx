"use client"
import { useForm } from "react-hook-form"
import TextareaAutosize from "react-textarea-autosize"
import { ArrowUpIcon } from "lucide-react"
import { toast } from "sonner"
import { useState } from "react"
import z from "zod"
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Kbd } from "@/components/ui/kbd"
import { useCreateMessage } from "@/modules/messages/hooks"
import { Spinner } from "@/components/ui/spinner"
import { useStatus } from "@/modules/usage/hooks/usage"
import Usage from "@/modules/usage/components/Usage"

const formSchema = z.object({
    content:z.string().min(1, "Message description is required").max(1000,"Message is too long")

})

const MessageForm = ({projectId}:{projectId:string}) => {
    const [isFocused,setIsFocused] = useState(false)
    const {mutateAsync: createMessageMutation, isPending} = useCreateMessage({projectId})
    const {data:usage} = useStatus()
    const showUsage = !!usage;
    const form = useForm({
        resolver:zodResolver(formSchema),
        defaultValues:{
            content:""
        },
        mode:"onChange"
    })
    const onSubmit = async(values:{content:string})=>{
        try{
            await createMessageMutation({value:values.content})
            form.reset()
        }catch(err){
            console.log(err)
            toast.error("Failed to create Message")
        }
    }

  return (
<div className=" w-full">
<Form {...form}>
  {
    showUsage && (
      <Usage/>
    )
  }
  <form
    onSubmit={form.handleSubmit(onSubmit)}
    className={cn(
      "relative border rounded-xl border-border/30 bg-background/60 backdrop-blur-xl p-4 transition-all duration-300",
      isFocused && "shadow-lg ring-2 ring-primary/40 border-primary/40"
    )}
  >
    <FormField
      control={form.control}
      name="content"
      render={({ field }) => (
        <FormItem className="space-y-2">
          <FormControl>
            <TextareaAutosize
              {...field}
              minRows={3}
              maxRows={8}
              placeholder="Describe your project in a few words..."
              className="w-full resize-none border-none bg-transparent outline-none text-sm pt-1"
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  form.handleSubmit(onSubmit)()
                }
              }}
            />
          </FormControl>
        </FormItem>
      )}
    />
    <div className="flex gap-x-2 items-end justify-between pt-2">
    <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground font-mono">
  <Kbd className="inline-flex items-center gap-1 rounded-md border bg-muted px-2 py-0.5 text-[11px] font-medium">
    <span className="text-[10px]">⌘</span>
    <span>Enter</span>
  </Kbd>
  <span>to submit</span>
</div>
      <Button className={cn("size-8 cursor-pointer rounded-full")} disabled={isPending} type={"submit"}>
        {isPending ? (<Spinner/>): (<ArrowUpIcon className="size-4"/>)}
      </Button>
    </div>
  </form>
</Form>
  </div>
  )
}

export default MessageForm