'use client'

import Image from 'next/image'
import { Home, MessageSquare, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  
  return (
    <div className="md:hidden">
      {/* Top Bar */}
      <Card className="m-4 p-4 border-none shadow-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Image 
              src="/Triple P Logo.png" 
              alt="Triple P Logo" 
              width={40} 
              height={40} 
              className="mr-2"
              priority
            />
            <h1 className="text-lg font-bold text-primary">Voice AI</h1>
          </div>
          
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu size={24} />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <nav className="space-y-2">
                  <Button
                    onClick={() => {
                      onTabChange('home')
                      setOpen(false)
                    }}
                    variant={activeTab === 'home' ? 'secondary' : 'ghost'}
                    className={cn(
                      "w-full justify-start",
                      activeTab === 'home' && "bg-secondary"
                    )}
                  >
                    <Home size={18} className="mr-2" />
                    <span>Home</span>
                  </Button>
                  <Button
                    onClick={() => {
                      onTabChange('assistant')
                      setOpen(false)
                    }}
                    variant={activeTab === 'assistant' ? 'secondary' : 'ghost'}
                    className={cn(
                      "w-full justify-start",
                      activeTab === 'assistant' && "bg-secondary"
                    )}
                  >
                    <MessageSquare size={18} className="mr-2" />
                    <span>Voice Assistant</span>
                  </Button>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </Card>
    </div>
  )
} 