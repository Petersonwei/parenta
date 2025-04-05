'use client'

import { ReactNode } from 'react'
import { TopNav } from '@/components/TopNav'

interface AppLayoutProps {
  children: ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-background">
      <TopNav />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
} 