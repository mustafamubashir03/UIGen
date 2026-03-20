"use client"
import { useGetProjects } from "@/modules/projects/hooks/project"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FolderKanban,Calendar, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"

export const ProjectList = () => {
   const {data:projects, isPending} =  useGetProjects()
   const formatDate = (date:Date)=>{
    return new Date(date).toLocaleDateString("en-US",{
        month:"short",
        day:"numeric",
        year:"numeric"
    })
   }
   if(isPending){
    return (
        <div className="w-full mt-28 ">
            <h2 className="text-2xl md:text-3xl  font-bold text-center mb-8">
                Your Projects
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
                {[1,2,3].map((i)=>(
                    <Skeleton key={i} className="h-36 rounded-xl"/>
                ))}
            </div>
        </div>
    )
   }
   if(!projects || projects.length === 0){
    return null
   }
  return (
    <div className="w-full">
        <h2 className="text-2xl md:text-3xl font-medium text-center mb-8">
                Your Projects
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-10 mx-auto">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="group"
          >
            <Card className="relative h-full rounded-2xl border border-border/30 bg-background/90 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-primary/40">

              {/* Header */}
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="px-0 rounded-lg bg-primary/10">
                  <FolderKanban className="w-5 h-5 text-primary" />
                </div>

                <ArrowRight className="w-5 h-5 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1" />
              </CardHeader>

              {/* Content */}
              <CardContent className="pt-0">
                <CardTitle className="text-lg font-semibold mb-3 line-clamp-2">
                  {project.name}
                </CardTitle>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {formatDate(project.createdAt)}
                </div>
              </CardContent>

              {/* Subtle glow on hover */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
