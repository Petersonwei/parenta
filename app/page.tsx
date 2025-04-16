'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MessageSquare } from 'lucide-react'
import WakeWordDetector from '@/components/WakeWordDetector'
import TranscriptOverlay from '@/components/TranscriptOverlay'
import { useState, useRef } from 'react'
import { Message } from '@/components/chat/types'

export default function Home() {
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

  const startConversation = () => {
    console.log('Start Conversation button clicked');
    
    // Manually trigger a call by simulating the wake word detection
    setIsCallActive(true);
    console.log('isCallActive set to true');
    
    // Add an initial message to show in the overlay
    const initialMessage: Message = {
      id: Date.now().toString(),
      type: 'transcription',
      role: 'user',
      content: "Starting conversation with Anna...",
      timestamp: new Date()
    };
    setMessages([initialMessage]);
    console.log('Initial message added');
    
    // Dispatch a custom event that can be listened for by WakeWordDetector
    const event = new CustomEvent('startConversation');
    window.dispatchEvent(event);
    console.log('startConversation event dispatched');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Hero Banner */}
      <div className="bg-blue-500 text-white text-center py-12 px-4">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to Parenta</h1>
        <p className="text-xl">Your personal parenting counselor powered by AI</p>
      </div>

      <div className="max-w-5xl mx-auto w-full p-4 md:p-6 flex-1">
        <div className="mt-10 mb-16">
          <Card className="shadow-lg border rounded-lg overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col items-center py-12 px-6 text-center">
                <div className="bg-blue-100 p-5 rounded-full mb-6">
                  <MessageSquare className="h-10 w-10 text-blue-500" />
                </div>
                <h2 className="text-2xl font-bold mb-4">Voice Assistant</h2>
                <p className="text-gray-600 mb-8 max-w-md">
                  Talk to your AI assistant using voice commands. Just say Hi Anna to get started.
                </p>
                <Button 
                  size="lg" 
                  className="bg-black text-white hover:bg-gray-800"
                  onClick={startConversation}
                >
                  Start Conversation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Getting Started</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center mr-3">
                    <span className="font-semibold">1</span>
                  </div>
                  <h3 className="font-semibold text-lg">Allow microphone access</h3>
                </div>
                <p className="text-gray-600">
                  When prompted, allow the browser to access your microphone.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center mr-3">
                    <span className="font-semibold">2</span>
                  </div>
                  <h3 className="font-semibold text-lg">Say the wake word</h3>
                </div>
                <p className="text-gray-600">
                  Activate the assistant by saying Hi Anna clearly.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center mr-3">
                    <span className="font-semibold">3</span>
                  </div>
                  <h3 className="font-semibold text-lg">Have a conversation</h3>
                </div>
                <p className="text-gray-600">
                  Once connected, speak naturally with your AI assistant.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Keep the functionality components hidden */}
      <div>
        <WakeWordDetector 
          ref={wakeWordDetectorRef}
          onCallStatusChange={handleCallStatusChange}
          onMessagesUpdate={handleMessagesUpdate}
          onEndCall={() => setIsCallActive(false)}
        />
      </div>
      
      <TranscriptOverlay 
        messages={messages}
        isCallActive={isCallActive}
        onEndCall={handleEndCall}
      />
    </div>
  )
}