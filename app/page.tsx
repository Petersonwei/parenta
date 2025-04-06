'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare, Heart, Check, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { TypeAnimation } from 'react-type-animation'

export default function Home() {
  const router = useRouter()
  
  const navigateToChat = () => {
    router.push('/chat')
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-12">
        {/* Hero Section */}
        <Card className="border-none shadow-none bg-transparent text-foreground max-w-4xl w-full">
          <CardHeader className="text-center space-y-4">
            <CardTitle className="text-4xl sm:text-6xl font-bold">
              <TypeAnimation
                sequence={[
                  'Time flies.',
                  1000,
                  'Make every parenting moment count.',
                  1500,
                  'Positive parenting that works.',
                  1000,
                  'Support for every family.',
                  1000,
                ]}
                wrapper="span"
                speed={50}
                repeat={Infinity}
              />
            </CardTitle>
            <CardDescription className="text-lg sm:text-2xl mt-4">
              Proven, positive tips that can help every family
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-8">
            <p className="text-center text-muted-foreground max-w-3xl text-lg">
              You can support your child development, grow closer and solve problems – positively. 
              There are many simple strategies you can start using right now, to make every moment count!
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                onClick={navigateToChat}
                className="group"
              >
                <MessageSquare className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                Talk to AI Assistant
              </Button>
              <Button 
                size="lg" 
                onClick={() => window.open('https://www.triplep-parenting.net.au/qld-en/triple-p/', '_blank')}
                variant="outline"
                className="group"
              >
                <ArrowRight className="mr-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                Visit Triple P Website
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Benefits Section */}
        <div className="w-full max-w-4xl">
          <h2 className="text-2xl font-semibold mb-6 text-center">How Triple P Can Help</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Heart className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Boost emotional wellbeing</h3>
                    <p className="text-muted-foreground">
                      Maintain a good relationship with your child – now, and in the years to come.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Check className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Less stress, more joy</h3>
                    <p className="text-muted-foreground">
                      Make family life less stressful and more enjoyable – even in tough times.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}