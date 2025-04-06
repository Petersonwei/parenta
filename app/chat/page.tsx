'use client'

import WakeWordDetector from '@/components/WakeWordDetector'
import TranscriptOverlay from '@/components/TranscriptOverlay'
import ChatHeader from '@/components/chat/ChatHeader'
import InstructionsCard from '@/components/chat/InstructionsCard'
import { useState, useRef } from 'react'
import { Message } from '@/components/chat/types'

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isCallActive, setIsCallActive] = useState(false)
  const wakeWordDetectorRef = useRef<{ endCall: () => Promise<void> } | null>(null)

  const handleCallStatusChange = (status: string) => {
    setIsCallActive(status === 'ongoing' || status === 'connecting')
  }

  const handleMessagesUpdate = (newMessages: Message[]) => {
    setMessages(newMessages)
  }

  const handleEndCall = async () => {
    if (wakeWordDetectorRef.current) {
      await wakeWordDetectorRef.current.endCall()
      setIsCallActive(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      
      
      <div className="flex-1 p-3 sm:p-6 max-w-3xl mx-auto w-full">
        
        <ChatHeader />
        
        <WakeWordDetector 
          ref={wakeWordDetectorRef}
          onCallStatusChange={handleCallStatusChange}
          onMessagesUpdate={handleMessagesUpdate}
          onEndCall={() => setIsCallActive(false)}
        />
        <InstructionsCard />
      </div>

      <TranscriptOverlay 
        messages={messages}
        isCallActive={isCallActive}
        onEndCall={handleEndCall}
      />
    </div>
  )
} 