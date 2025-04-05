'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { TypeAnimation } from 'react-type-animation'

export default function Home() {
  const router = useRouter()
  
  const navigateToChat = () => {
    router.push('/chat')
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-8">
        {/* Hero Section */}
        <Card className="border-none shadow-none bg-transparent text-foreground max-w-3xl w-full">
          <CardHeader className="text-center space-y-4">
            <CardTitle className="text-4xl sm:text-5xl font-bold">
              <TypeAnimation
                sequence={[
                  'Hi, I am Peter Wei',
                  1000,
                  'I am a Full Stack Developer',
                  1000,
                  'I am an AI Enthusiast',
                  1000,
                  'Lets Chat!',
                  1000,
                ]}
                wrapper="span"
                speed={50}
                repeat={Infinity}
              />
            </CardTitle>
            <CardDescription className="text-lg sm:text-xl">
              Welcome to my interactive portfolio. I&apos;d love to chat with you!
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-6">
            <p className="text-center text-muted-foreground max-w-2xl">
              I&apos;ve built an AI-powered voice assistant that can help you learn more about me, 
              my work, and my experience. Click below to start a conversation!
            </p>
            <Button 
              size="lg" 
              onClick={navigateToChat}
              className="group"
            >
              <MessageSquare className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
              Start Chatting
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}