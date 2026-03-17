"use client"
import { useForm } from "react-hook-form"
import TextareaAutosize from "react-textarea-autosize"
import { ArrowUpIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useState } from "react"
import z from "zod"
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { trendingUIProjects } from "@/constants/ui-projects"
import { cn } from "@/lib/utils"
import { Kbd } from "@/components/ui/kbd"
import { useCreateProject } from "@/modules/projects/hooks/project"
import { Spinner } from "@/components/ui/spinner"

const formSchema = z.object({
    content:z.string().min(1, "Project description is required").max(1000,"Description is too long")

})

const ProjectForm = () => {
    const [isFocused,setIsFocused] = useState(false)
    const router = useRouter()
    const {mutateAsync: createProjectMutation, isPending} = useCreateProject()
    const form = useForm({
        resolver:zodResolver(formSchema),
        defaultValues:{
            content:""
        },
        mode:"onChange"
    })
    const handleTemplate = (prompt:string)=>{
        form.setValue("content",prompt)
    }
    const onSubmit = async(values:{content:string})=>{
        try{
            const res = await createProjectMutation(values.content)
            router.push(`/projects/${res.id}`)
            toast.success("Project created successfully")
            form.reset()
        }catch(err){
            console.log(err)
            toast.error("Failed to create project")
        }
    }
    const isButtonDisabled = isPending
  return (
<div className="space-y-8 w-full">
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
    {trendingUIProjects.map((template, index) => (
      <button
        key={index}
        type="button"
        onClick={() => handleTemplate(template.prompt)}
        className="
          group
          relative
          text-left
          p-4
          rounded-2xl
          border
          border-border/30
          bg-background/60
          backdrop-blur-xl
          transition-all
          duration-300
          hover:-translate-y-1
          hover:shadow-2xl
          cursor-pointer
          hover:rounded-b-none
          hover:border-primary/40
          focus:outline-none
          focus:ring-2
          focus:ring-primary/50
        "
      >
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-primary/5 pointer-events-none" />

        <div className="text-3xl mb-4 transition-transform duration-300 group-hover:scale-110">
          {template.emoji}
        </div>

        <h3 className="text-md font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
          {template.title}
        </h3>

        <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-primary rounded-b-2xl transition-all duration-300 group-hover:w-full" />
      </button>
    ))}
  </div>
  <div>
  <div className="relative my-8">
  <div className="absolute inset-0 flex items-center">
    <span className="w-full border-t border-border" />
  </div>

  <div className="relative flex justify-center text-sm">
    <span className="bg-background px-4 text-muted-foreground font-medium tracking-wide">
      or describe your own idea
    </span>
  </div>
</div>
<Form {...form}>
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
      <Button className={cn("size-8 cursor-pointer rounded-full")} disabled={isButtonDisabled} type={"submit"}>
        {isPending ? (<Spinner/>): (<ArrowUpIcon className="size-4"/>)}
      </Button>
    </div>
  </form>
</Form>
  </div>
</div>
  )
}

export default ProjectForm