import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Mic } from 'lucide-react'

export default function InstructionsCard() {
  return (
    <Card className="mb-4 sm:mb-6 border-2 border-muted shadow-md bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-2xl sm:text-4xl font-bold text-center flex flex-col items-center gap-4">
          <Mic className="h-8 w-8 sm:h-12 sm:w-12 text-primary animate-pulse" />
          <div className="space-y-2">
            <span className="block">Your AI Assistant,</span>
            <span className="block text-primary">Just a Hey Peter Away</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center pb-6">
        <p className="text-muted-foreground text-lg sm:text-xl">
          Experience natural conversations with an AI that understands you
        </p>
      </CardContent>
    </Card>
  )
} 