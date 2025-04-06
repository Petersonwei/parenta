'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InfoIcon, Heart, Users, GraduationCap, AwardIcon, Check } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function AboutTripleP() {
  return (
    <div className="container mx-auto py-8">
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center text-center space-y-4 py-12">
          <h1 className="text-4xl md:text-5xl font-bold">Triple P - Positive Parenting Program</h1>
          <p className="text-xl text-muted-foreground max-w-3xl">
            Proven, positive tips that can help every family. Make every parenting moment count.
          </p>
          <Button size="lg" className="mt-4" onClick={() => window.open('https://www.triplep-parenting.net.au/qld-en/triple-p/', '_blank')}>
            Start Free Course
          </Button>
        </div>

        {/* What is Triple P */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <InfoIcon className="h-6 w-6" />
              What is Triple P?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-lg">
              Triple P (Positive Parenting Program) is a parenting and family support system designed 
              to prevent and treat behavioral and emotional problems in children and teenagers. 
              It aims to prevent problems in the family, school and community before they arise and 
              to create family environments that encourage children to realize their potential.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="flex flex-col space-y-2">
                <h3 className="text-xl font-semibold flex items-center">
                  <Heart className="mr-2 h-5 w-5 text-primary" />
                  Positive Family Support
                </h3>
                <p>
                  Boost your child emotional wellbeing and maintain a good relationship – 
                  now, and in the years to come.
                </p>
              </div>
              
              <div className="flex flex-col space-y-2">
                <h3 className="text-xl font-semibold flex items-center">
                  <Users className="mr-2 h-5 w-5 text-primary" />
                  Less Stress, More Joy
                </h3>
                <p>
                  Make family life less stressful and more enjoyable – even in tough times.
                </p>
              </div>
              
              <div className="flex flex-col space-y-2">
                <h3 className="text-xl font-semibold flex items-center">
                  <Check className="mr-2 h-5 w-5 text-primary" />
                  Practical Strategies
                </h3>
                <p>
                  Set good habits early and prevent problems from getting worse with practical 
                  strategies you can start using straight away.
                </p>
              </div>
              
              <div className="flex flex-col space-y-2">
                <h3 className="text-xl font-semibold flex items-center">
                  <GraduationCap className="mr-2 h-5 w-5 text-primary" />
                  Research Backed
                </h3>
                <p>
                  Backed by 35+ years of research studies in Australia and around the world.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Our Courses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <AwardIcon className="h-6 w-6" />
              Free Courses
            </CardTitle>
            <CardDescription>
              Every family different, so we make it easy to choose the parenting support that fits your situation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Triple P Online for Baby</CardTitle>
                  <CardDescription>Create a positive foundation, right from the start</CardDescription>
                  <Badge>0 to 1 year</Badge>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ul className="space-y-1">
                    <li className="flex items-start">
                      <Check className="mr-2 h-4 w-4 text-primary mt-1" />
                      <span>Nurture your baby development</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="mr-2 h-4 w-4 text-primary mt-1" />
                      <span>Understand their cues and strengthen your bond</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="mr-2 h-4 w-4 text-primary mt-1" />
                      <span>Look after your emotional wellbeing</span>
                    </li>
                  </ul>
                  <Button className="w-full mt-4" variant="outline" onClick={() => window.open('https://www.triplep-parenting.net.au/qld-en/triple-p/', '_blank')}>Sign Up</Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Triple P Online</CardTitle>
                  <CardDescription>Confidently handle everyday parenting challenges</CardDescription>
                  <Badge>under 12 years</Badge>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ul className="space-y-1">
                    <li className="flex items-start">
                      <Check className="mr-2 h-4 w-4 text-primary mt-1" />
                      <span>Improve behaviour and grow closer</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="mr-2 h-4 w-4 text-primary mt-1" />
                      <span>Positively influence your child development</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="mr-2 h-4 w-4 text-primary mt-1" />
                      <span>Create a happier, calmer family life</span>
                    </li>
                  </ul>
                  <Button className="w-full mt-4" variant="outline" onClick={() => window.open('https://www.triplep-parenting.net.au/qld-en/triple-p/', '_blank')}>Sign Up</Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Fear-Less Triple P Online</CardTitle>
                  <CardDescription>Build resilience in children and help them manage anxiety</CardDescription>
                  <Badge>6+ years</Badge>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ul className="space-y-1">
                    <li className="flex items-start">
                      <Check className="mr-2 h-4 w-4 text-primary mt-1" />
                      <span>Get a better understanding of anxiety</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="mr-2 h-4 w-4 text-primary mt-1" />
                      <span>Learn what to do when your child is anxious</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="mr-2 h-4 w-4 text-primary mt-1" />
                      <span>Boost resilience and coping skills</span>
                    </li>
                  </ul>
                  <Button className="w-full mt-4" variant="outline" onClick={() => window.open('https://www.triplep-parenting.net.au/qld-en/triple-p/', '_blank')}>Sign Up</Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Testimonials */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">What Families Say About Triple P</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <p className="italic">
                    This time is going so fast. So now I am really glad that I did it [Triple P] when I did it… 
                    It is making me see things differently, which is really good.
                  </p>
                  <div className="mt-4 font-semibold">- Ang</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <p className="italic">
                    I want to be the kind of dad that uses a positive approach with my kids, 
                    and Triple P is all about that. It is just a really great program.
                  </p>
                  <div className="mt-4 font-semibold">- Timothy</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <p className="italic">
                    It would have been easy to parent on auto-pilot – doing what my parents had done. 
                    Instead I now pay attention, to see and understand what is going on in his mind.
                  </p>
                  <div className="mt-4 font-semibold">- Yoshie</div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Stats Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Backed by Research. Proven by Parents.</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg mb-6">
              We help parents and families right around the world, in more than 30 countries. 
              In fact, millions worldwide, including more than a million Australian families, 
              have been helped by Triple P. So we can help you, too!
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="p-6 rounded-lg bg-primary/10">
                <div className="text-4xl font-bold text-primary">35+</div>
                <div className="mt-2">Years of Research</div>
              </div>
              <div className="p-6 rounded-lg bg-primary/10">
                <div className="text-4xl font-bold text-primary">30+</div>
                <div className="mt-2">Countries</div>
              </div>
              <div className="p-6 rounded-lg bg-primary/10">
                <div className="text-4xl font-bold text-primary">1M+</div>
                <div className="mt-2">Australian Families</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 