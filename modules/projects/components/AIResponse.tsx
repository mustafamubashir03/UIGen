"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface AIResponseProps {
  content: string
}

export default function AIResponse({ content }: AIResponseProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => (
          <p className="text-foreground leading-relaxed">
            {children}
          </p>
        ),
        ul: ({ children }) => (
          <ul className="ml-4 list-disc space-y-1">{children}</ul>
        ),
        li: ({ children }) => (
          <li className=" leading-relaxed">{children}</li>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        code: ({ children, className }) => {
          const isBlock = !!className
          return (
            <code
              className={`${
                isBlock
                  ? "block bg-muted p-2 rounded my-2  font-mono overflow-x-auto"
                  : "bg-muted px-1 py-0.5 rounded text-xs"
              }`}
            >
              {children}
            </code>
          )
        },
      }}
    >
      {content}
    </ReactMarkdown>
  )
}