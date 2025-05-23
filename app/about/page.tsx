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
          <p className="text-xl text-foreground/90 max-w-3xl">
            Find answers to common questions about parenting strategies
          </p>
        </div>

        {/* Main FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <HelpCircleIcon className="h-6 w-6" />
              Parenting Questions
            </CardTitle>
            <CardDescription className="text-foreground/80 text-base">
              Common questions about implementing effective parenting strategies
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-foreground">What is Parenta?</AccordionTrigger>
                <AccordionContent className="text-foreground/90">
                  Parenta is a parenting and family support system designed 
                  to prevent and treat behavioral and emotional problems in children and teenagers. 
                  It aims to prevent problems in the family, school and community before they arise and 
                  to create family environments that encourage children to realize their potential.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-foreground">How does Parenta work?</AccordionTrigger>
                <AccordionContent className="text-foreground/90">
                  Parenta gives parents simple and practical strategies to help them build strong, 
                  healthy relationships, confidently manage their children behavior and prevent problems 
                  from developing. The program is built on a foundation of core positive parenting principles that 
                  focus on creating a safe, interesting environment, positive learning environment, assertive 
                  discipline, realistic expectations, and parental self-care.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-3">
                <AccordionTrigger className="text-foreground">What age groups does Parenta work with?</AccordionTrigger>
                <AccordionContent className="text-foreground/90">
                  Parenta has programs for parents of children from birth to 16 years. There are specialized 
                  programs for parents of babies, toddlers, primary schoolers, and teenagers. Each program is 
                  tailored to the developmental needs of children in those age ranges.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-4">
                <AccordionTrigger className="text-foreground">Is Parenta evidence-based?</AccordionTrigger>
                <AccordionContent className="text-foreground/90">
                  Yes, Parenta is one of the most extensively researched parenting programs in the world. 
                  The program is backed by over 35 years of ongoing research with proven results in many different 
                  cultures, countries, and family situations. Hundreds of trials and studies have shown that 
                  Parenta can help families and reduce behavioral and emotional problems in children.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-5">
                <AccordionTrigger className="text-foreground">How long does it take to see results?</AccordionTrigger>
                <AccordionContent className="text-foreground/90">
                  Many parents report seeing positive changes in their child behavior within a few weeks 
                  of implementing Parenta strategies consistently. However, the timeframe can vary depending 
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
                <AccordionTrigger className="text-foreground">How does the AI Assistant work?</AccordionTrigger>
                <AccordionContent className="text-foreground/90">
                  Our AI Assistant uses voice recognition to listen to your parenting questions and 
                  provides evidence-based answers based on parenting principles. Simply activate the 
                  assistant by speaking to it, and it will provide helpful advice tailored to your situation.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="assistant-2">
                <AccordionTrigger className="text-foreground">Is my conversation with the AI Assistant private?</AccordionTrigger>
                <AccordionContent className="text-foreground/90">
                  This website is part of a research project. All interactions with the AI Assistant are collected and may be analyzed for research purposes. By using this website, you consent to your data being used for academic research to improve AI systems.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="assistant-3">
                <AccordionTrigger className="text-foreground">Can the AI Assistant replace professional help?</AccordionTrigger>
                <AccordionContent className="text-foreground/90">
                  The AI Assistant provides general guidance based on parenting principles, but it is not 
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