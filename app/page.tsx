'use client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from "@/hooks/use-toast"

{/* 
  TEMPLATE PAGE: Home
  This is a template home page.
  Replace all content with content that suits the users request.
*/}
export default function Home() {
  const { toast } = useToast()
  return (
    <div className="min-h-full">

      <section className="container mx-auto px-4 pt-24 pb-20">
        <div className="max-w-[800px] mx-auto text-center">
          <h1 className="text-5xl font-bold tracking-tight lg:text-6xl">
            Template Starter
          </h1>
          <p className="mt-6 text-xl text-muted-foreground max-w-[600px] mx-auto">
            This is a customizable template. Replace all content with your own using the chat interface.
          </p>
        </div>
      </section>
    </div>
  )
}