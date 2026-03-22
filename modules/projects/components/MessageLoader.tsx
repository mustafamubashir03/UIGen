"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

const STATES = [
    "Thinking...",
    "Analyzing your prompt...",
    "Understanding your intent...",
    "Breaking down requirements...",
    "Exploring possible solutions...",
    "Planning response structure...",
    "Generating response...",
    "Drafting content...",
    "Processing data...",
    "Connecting ideas...",
    "Synthesizing information...",
    "Refining output...",
    "Improving clarity...",
    "Enhancing readability...",
    "Optimizing response...",
    "Double-checking details...",
    "Validating logic...",
    "Finalizing answer...",
    "Almost ready...",
    "Polishing final touches...",
  ]

const MessageLoader = () => {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
        setIndex((prev) => {
            let next = prev
            while (next === prev) {
              next = Math.floor(Math.random() * STATES.length)
            }
            return next
          })
    }, 1800)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full flex items-start gap-3 py-4 animate-fade-in">

      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
        <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
      </div>


      <div className="flex flex-col gap-2 w-full max-w-[80%]">


        <div className="text-sm text-muted-foreground font-medium">
          {STATES[index]}
        </div>

        <div className="space-y-2">
          <ShimmerLine className="w-[85%]" />
          <ShimmerLine className="w-[70%]" />
          <ShimmerLine className="w-[90%]" />
        </div>

      </div>
    </div>
  )
}

export default MessageLoader


const ShimmerLine = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        "h-3 rounded-md bg-muted/40 relative overflow-hidden",
        className
      )}
    >
      <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
    </div>
  )
}