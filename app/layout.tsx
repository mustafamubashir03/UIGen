import { type Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Plus_Jakarta_Sans, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from 'sonner'
import { QueryProvider } from '@/modules/home/components/QueryProvider'
import { TooltipProvider } from '@/components/ui/tooltip'


const jakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  weight: ['400','500','600','700'], 
})

// Monospace font for code blocks
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: "UIGen — AI UI Generator & Code Builder",
  description:
    "UIGen is an AI-powered platform to generate modern UI components, full-stack apps, and production-ready code using intelligent agents. Build faster with Next.js, Tailwind, and AI automation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${jakarta.variable} ${geistMono.variable} antialiased`}>

          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
          <TooltipProvider>
          <QueryProvider>
          {children}
          <Toaster />
          </QueryProvider>
          </TooltipProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}