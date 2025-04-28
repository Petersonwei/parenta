import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Mic, Users } from 'lucide-react'

export default function ChatHeader() {
  return (
    <Card className="border-none shadow-none bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
      <CardHeader className="pb-2 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
        <CardTitle className="text-xl sm:text-3xl font-bold text-center flex items-center justify-center gap-2">
          <Mic className="h-5 w-5 sm:h-6 sm:w-6 animate-pulse" />
          Parenta Voice Assistant
        </CardTitle>
        <CardDescription className="text-center text-primary-foreground/90 font-medium text-base sm:text-lg">
          <span className="block mb-1">For parents seeking practical solutions</span>
          Say <strong>Hi Anna</strong> to discover proven parenting strategies that work
        </CardDescription>
        <div className="mt-2 text-center text-primary-foreground/80 text-sm">
          <Users className="inline h-4 w-4 mr-1" /> Trusted by over 1 million families worldwide
        </div>
      </CardHeader>
    </Card>
  )
} 