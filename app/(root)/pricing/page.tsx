"use client"
import { PricingTable } from '@clerk/nextjs'
import { dark } from "@clerk/themes"
import UIGenLogo from '@/modules/home/components/UIGenLogo'
import { useCurrentTheme } from '@/hooks/use-currentTheme'

export default function PricingPage() {
  const currentTheme = useCurrentTheme()

  const isDark = currentTheme === "dark"

  return (
    <div className='flex items-center justify-center w-full px-4 py-16'>
      <div className='max-w-5xl w-full'>
        <section className='space-y-4 flex flex-col items-center justify-center'>
          
          <div className='flex flex-col items-center justify-center'>
            <UIGenLogo className='h-20 w-20 hidden md:block'/>
          </div>

          <h1 className='text-2xl md:text-4xl text-black font-medium text-center dark:text-white'>
            Pricing
          </h1>

          <p className='text-gray-400 text-center text-sm md:text-base'>
            Choose the plan that fits your needs
          </p>

          <PricingTable
            appearance={{
              baseTheme: isDark ? dark : undefined,

              variables: isDark ? {
                colorPrimary: "#14b8a6",
                colorText: "#e5e7eb",
                colorTextSecondary: "#94a3b8",
                colorBackground: "#0f1720",
                colorInputBackground: "#0b1215",
                colorBorder: "#1f2937",
                borderRadius: "0.75rem"
              } : {},

              elements: isDark ? {
                pricingTableCard:
                  "bg-[#0f1720]! border border-[#1f2937]! shadow-none! rounded-xl!",

                pricingTableCardHeader:
                  "bg-transparent! text-white!",

                pricingTableCardBody:
                  "text-gray-300!",

                pricingTableCardFooter:
                  "border-t border-[#1f2937]!",

                button:
                  "bg-[#14b8a6]! text-black! hover:bg-[#0d9488]! h-[40px] transition-all!",

                badge:
                  "bg-[#14b8a6]/20! text-[#14b8a6]! border border-[#14b8a6]/30!"
              } : {}
            }}
          />
        </section>
      </div>
    </div>
  )
}