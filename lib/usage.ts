import {RateLimiterPrisma} from "rate-limiter-flexible"
import { prisma} from "./db"
import { auth } from "@clerk/nextjs/server"

export const FREE_POINTS = 5;
export const PRO_POINTS = 100;
export const DURATION = 30 * 24 * 60 * 60;
export const GENERATION_COST = 1;


export async function getUsage