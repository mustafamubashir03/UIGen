"use server"

import { inngest } from "@/inngest/client"
import { prisma } from "@/lib/db"
import { MessageRole, MessageType } from "@/generated/prisma/enums"
import { generateSlug } from "random-word-slugs";
import { getCurrentUser } from "@/modules/auth/actions";
import { consumeCredits } from "@/lib/usage";
import { RateLimiterRes } from "rate-limiter-flexible";


export const createProject = async(value:string)=>{
    const user = await getCurrentUser()
    if(!user || !user.currentUserFound){
        throw new Error("Unauthorized")
    }
    try{
        await consumeCredits()

    }catch (error: unknown) {
        if (
          typeof error === "object" &&
          error !== null &&
          "remainingPoints" in error
        ) {
          const rlError = error as RateLimiterRes;
      
          if (rlError.remainingPoints === 0) {
            throw new Error("TOO_MANY_REQUESTS: No credits left");
          }
        }
      
        throw new Error("BAD_REQUEST: Something went wrong");
      }
    
    const newProject = await prisma.project.create({
        data:{
            name: generateSlug(4, { format: "kebab" }),
            userId:user.currentUserFound?.id,
            messages:{
                create:{
                    content:value,
                    role:MessageRole.USER,
                    type:MessageType.RESULT
                }
            }

        }
    })
    await inngest.send({
        name:"code-agent/run",
        data:{
            value:value,
            projectId:newProject.id
        }
    })
    return newProject
}

export const getProjects = async()=>{
    const user = await getCurrentUser()
    if (!user){
        throw new Error("Unauthorized")
    }
    const projects = await prisma.project.findMany({
        where:{
            userId:user.currentUserFound?.id
        },
        orderBy:{
            createdAt:"desc"
        }
    })
    return projects

}
export const getProjectById = async(projectId:string)=>{
    const user = await getCurrentUser()
    if (!user){
        throw new Error("Unauthorized")
    }
    const project = await prisma.project.findUnique({
        where:{
            userId:user.currentUserFound?.id,
            id:projectId
        }
    })
    return project

}


