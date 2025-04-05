import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Mic } from 'lucide-react'

export default function ChatHeader() {
  return (
    <Card className="border-none shadow-none bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
      <CardHeader className="pb-2 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
        <CardTitle className="text-xl sm:text-3xl font-bold text-center flex items-center justify-center gap-2">
          <Mic className="h-5 w-5 sm:h-6 sm:w-6" />
          Lets Chat Together!
        </CardTitle>
        <CardDescription className="text-center text-primary-foreground/90 font-medium text-base sm:text-lg">
          Just say <strong>Hey Peter</strong> and I will be here to know more about you
        </CardDescription>
      </CardHeader>
    </Card>
  )
} 