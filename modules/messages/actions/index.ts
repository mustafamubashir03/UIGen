"use server"

import { MessageRole, MessageType } from "@/generated/prisma/enums"
import { prisma } from "@/lib/db"
import { inngest} from "@/inngest/client"
import { getCurrentUser } from "@/modules/auth/actions"
import { consumeCredits } from "@/lib/usage"
import { RateLimiterRes } from "rate-limiter-flexible"

export const createMessage = async({value,projectId}:{value:string, projectId:string})=>{
    const user = await getCurrentUser()
    if(!user || !user.currentUserFound){
        throw new Error("Unauthorized")
    }
    const project = await prisma.project.findUnique({
        where:{
            id:projectId,
            userId:user.currentUserFound.id
        }
    })
    if(!project){
        throw new Error("Project not found")
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
    const newMessage = await prisma.message.create({
        data:{
            projectId,
            content:value,
            role:MessageRole.USER,
            type:MessageType.RESULT
        }
    })
    await inngest.send({
        name:"code-agent/run",
        data:{
            value:value,
            projectId:projectId
        }
    })
    return newMessage

}

export const getMessages = async({projectId}:{projectId:string})=>{
    const user = await getCurrentUser()
    if(!user || !user.currentUserFound){
        throw new Error("Unauthorized")
    }
    const project = await prisma.project.findUnique({
        where:{
            id:projectId,
            userId:user.currentUserFound.id
        }
    })
    if(!project){
        throw new Error("Project not found")
    }
    const messages = await prisma.message.findMany({
        where:{
            projectId
        },
        orderBy:{
            updatedAt:"asc"
        },
        include:{
            fragments:true
        }
    })
    console.log("messages recieved from db", messages)
    return messages

}