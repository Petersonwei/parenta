'use client'


import { Home, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <div className="h-full w-[220px] bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <Card className="m-4 p-4 border-none shadow-none">
        <div className="flex flex-col items-center">
          <h1 className="text-xl font-bold text-primary">Voice AI</h1>
        </div>
      </Card>
      
      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <Button
              onClick={() => onTabChange('home')}
              variant={activeTab === 'home' ? 'secondary' : 'ghost'}
              className={cn(
                "w-full justify-start",
                activeTab === 'home' && "bg-secondary"
              )}
            >
              <Home size={18} className="mr-2" />
              <span>Home</span>
            </Button>
          </li>
          <li>
            <Button
              onClick={() => onTabChange('assistant')}
              variant={activeTab === 'assistant' ? 'secondary' : 'ghost'}
              className={cn(
                "w-full justify-start",
                activeTab === 'assistant' && "bg-secondary"
              )}
            >
              <MessageSquare size={18} className="mr-2" />
              <span>Voice Assistant</span>
            </Button>
          </li>
        </ul>
      </nav>
      
      {/* Footer */}
      <Card className="m-4 p-4 border-none shadow-none">
        <div className="text-xs text-muted-foreground text-center">
          <span>Voice AI Assistant v1.0</span>
        </div>
      </Card>
    </div>
  )
} 