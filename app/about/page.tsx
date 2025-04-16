'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { HelpCircleIcon, MessageSquare } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function FAQPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center text-center space-y-4 py-12">
          <h1 className="text-4xl md:text-5xl font-bold">Frequently Asked Questions</h1>
          <p className="text-xl text-muted-foreground max-w-3xl">
            Find answers to common questions about Triple P and positive parenting
          </p>
        </div>

        {/* Main FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <HelpCircleIcon className="h-6 w-6" />
              Parenting Questions
            </CardTitle>
            <CardDescription>
              Common questions about Triple P and how to implement positive parenting strategies
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>What is Triple P?</AccordionTrigger>
                <AccordionContent>
                  Triple P (Positive Parenting Program) is a parenting and family support system designed 
                  to prevent and treat behavioral and emotional problems in children and teenagers. 
                  It aims to prevent problems in the family, school and community before they arise and 
                  to create family environments that encourage children to realize their potential.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-2">
                <AccordionTrigger>How does Triple P work?</AccordionTrigger>
                <AccordionContent>
                  Triple P gives parents simple and practical strategies to help them build strong, 
                  healthy relationships, confidently manage their children behavior and prevent problems 
                  from developing. The program is built on a foundation of five core positive parenting principles that 
                  focus on creating a safe, interesting environment, positive learning environment, assertive 
                  discipline, realistic expectations, and parental self-care.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-3">
                <AccordionTrigger>What age groups does Triple P work with?</AccordionTrigger>
                <AccordionContent>
                  Triple P has programs for parents of children from birth to 16 years. There are specialized 
                  programs for parents of babies, toddlers, primary schoolers, and teenagers. Each program is 
                  tailored to the developmental needs of children in those age ranges.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-4">
                <AccordionTrigger>Is Triple P evidence-based?</AccordionTrigger>
                <AccordionContent>
                  Yes, Triple P is one of the most extensively researched parenting programs in the world. 
                  The program is backed by over 35 years of ongoing research with proven results in many different 
                  cultures, countries, and family situations. Hundreds of trials and studies have shown that 
                  Triple P can help families and reduce behavioral and emotional problems in children.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-5">
                <AccordionTrigger>How long does it take to see results?</AccordionTrigger>
                <AccordionContent>
                  Many parents report seeing positive changes in their child behavior within a few weeks 
                  of implementing Triple P strategies consistently. However, the timeframe can vary depending 
                  on the specific challenges, the consistency of implementation, and individual family factors. 
                  The key is consistent application of the strategies over time.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
        
        {/* Using the AI Assistant */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <MessageSquare className="h-6 w-6" />
              About the AI Assistant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="assistant-1">
                <AccordionTrigger>How does the AI Assistant work?</AccordionTrigger>
                <AccordionContent>
                  Our AI Assistant uses voice recognition to listen to your parenting questions and 
                  provides evidence-based answers based on Triple P principles. Simply activate the 
                  assistant by speaking to it, and it will provide helpful advice tailored to your situation.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="assistant-2">
                <AccordionTrigger>Is my conversation with the AI Assistant private?</AccordionTrigger>
                <AccordionContent>
                  Yes, your privacy is important to us. Conversations with the AI Assistant are not stored 
                  permanently, and your personal information is not shared with third parties. The system 
                  uses anonymized data only to improve the quality of responses.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="assistant-3">
                <AccordionTrigger>Can the AI Assistant replace professional help?</AccordionTrigger>
                <AccordionContent>
                  The AI Assistant provides general guidance based on Triple P principles, but it is not 
                  a replacement for professional support. For serious concerns about your child behavior 
                  or mental health, please consult with a qualified healthcare provider or therapist.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
        
      </div>
    </div>
  )
} 