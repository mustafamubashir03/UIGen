"use server"

import { prisma } from "@/lib/db"
import { currentUser } from "@clerk/nextjs/server"



export const onBoardUser = async()=>{
    try{
        const user = await currentUser()
        if(!user){
            return {
                success:false,
                error:"No authenticated user found"
            }
        }

        const {id,firstName,lastName, imageUrl, emailAddresses} = user
        const newUser = await prisma.user.upsert({
            where:{
              clerkId:id
            },
            update:{
                name: firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || null,
                image:imageUrl || null,
                email: emailAddresses[0].emailAddress || "",
            },
            create:{
                clerkId:id,
                name: firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || null,
                image:imageUrl || null,
                email: emailAddresses[0].emailAddress || "",
            }
        })

        return {
            success:true,
            user:newUser,
            message:"User onboarded successfully"
        }
    }catch(err){
        console.log("error has occured while onboarding user",err)
        return {
            success:false,
            error:"Error has occured while onboarding"
        }
        
    }
}


export const getCurrentUser = async()=>{
    try{
        const user = await currentUser()
        if(!user){
            return {
                success:false,
                error:"No authenticated current user found"
            }
        }
        const {id} = user
        const currentUserFound = await prisma.user.findUnique({
            where:{
                clerkId: id
            },
            select:{
                email:true,
                image:true,
                name:true,
                clerkId:true,
            }
    
        })
        return {
            success:true,
            currentUserFound
        }

    }catch(err){
        console.log("error occured while getting current user",err)
        return null;

    }
}