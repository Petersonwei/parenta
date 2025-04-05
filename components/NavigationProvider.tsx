'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface NavigationContextType {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

interface NavigationProviderProps {
  children: ReactNode
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const [activeTab, setActiveTab] = useState('home')
  const router = useRouter()
  const pathname = usePathname()
  
  // Update active tab based on current route
  useEffect(() => {
    if (pathname === '/') {
      setActiveTab('home')
    } else if (pathname === '/chat') {
      setActiveTab('assistant')
    }
  }, [pathname])
  
  // Navigate to the appropriate route when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    
    if (tab === 'home') {
      router.push('/')
    } else if (tab === 'assistant') {
      router.push('/chat')
    }
  }
  
  return (
    <NavigationContext.Provider value={{ activeTab, setActiveTab: handleTabChange }}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
} 