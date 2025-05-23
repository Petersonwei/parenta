import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { PhoneOff, Mic, MessageSquare } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useEffect, useState, useRef } from "react"
import Image from "next/image"

interface Message {
  id: string
  type: 'response' | 'transcription'
  role?: string
  content: string
  timestamp: Date
  isComplete?: boolean
}

interface TranscriptOverlayProps {
  messages: Message[]
  onEndCall: () => void
  isCallActive: boolean
}

// Enhanced voice wave animation component
function VoiceWave() {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {[1, 2, 3, 4, 5, 6, 7].map((i) => {
        // Calculate a height based on position (taller in middle)
        const baseHeight = i === 1 || i === 7 ? 6 : i === 2 || i === 6 ? 10 : i === 3 || i === 5 ? 14 : 16;
        return (
          <div 
            key={i}
            className="bg-white rounded-full"
            style={{ 
              height: `${baseHeight}px`,
              width: '3px',
              animationName: 'voiceWave',
              animationDuration: `${0.8 + (i * 0.1)}s`,
              animationIterationCount: 'infinite',
              animationDirection: 'alternate',
              animationTimingFunction: 'ease-in-out',
              animationDelay: `${i * 0.05}s`,
              opacity: '0.9'
            }}
          />
        );
      })}
    </div>
  );
}

export default function TranscriptOverlay({ messages, onEndCall, isCallActive }: TranscriptOverlayProps) {
  const { toast } = useToast()
  const [canEndCall, setCanEndCall] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current && messages.length > 0) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  useEffect(() => {
    if (isCallActive) {
      // Reset canEndCall to false when call starts
      setCanEndCall(false)
      
      // Show toast when call starts
      toast({
        title: "Anna is joining the chat",
        description: "Please wait while the connection is established",
      })

      // Set delay for end call button
      const timer = setTimeout(() => {
        setCanEndCall(true)
      }, 4000)

      return () => clearTimeout(timer)
    } else {
      // Reset canEndCall when call ends
      setCanEndCall(false)
    }
  }, [isCallActive, toast])

  // Add keyframe animation for voice wave
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes voiceWave {
        0% { transform: scaleY(0.4); }
        50% { transform: scaleY(1); }
        100% { transform: scaleY(0.4); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (!isCallActive) return null;

  // Get the latest message
  const latestMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const isPeterSpeaking = latestMessage?.role === 'assistant' && !latestMessage?.isComplete;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-stretch z-50 overflow-hidden">
      <div className="w-full h-full flex flex-col">
        {/* Header with end call button */}
        <div className="bg-background/95 backdrop-blur-sm p-2 sm:p-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-primary-foreground" />
            </div>
            <h2 className="text-sm sm:text-lg font-semibold">
              {isPeterSpeaking ? "Anna is speaking..." : "Anna"}
            </h2>
          </div>
          <Button
            onClick={onEndCall}
            variant="destructive"
            size="sm"
            className="rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-xs"
            disabled={!canEndCall}
          >
            <PhoneOff className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="sm:inline hidden">End Call</span>
          </Button>
        </div>
        
        <div className="flex flex-grow overflow-hidden h-[calc(100%-48px)]">
          {/* Left side - Anna's avatar */}
          <div className="w-1/4 sm:w-1/3 max-w-[200px] border-r bg-muted/10 backdrop-blur-sm flex flex-col items-center justify-center p-2 sm:p-4">
            <div className="relative w-16 h-16 xs:w-20 xs:h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 mb-2 sm:mb-4">
              <div className="rounded-full overflow-hidden w-full h-full relative">
                <Image
                  src="/Anna.png"
                  alt="Anna"
                  fill
                  style={{ objectFit: "cover" }}
                  className="rounded-full"
                />
                {isPeterSpeaking && (
                  <>
                    <div className="absolute inset-0 rounded-full border-2 border-primary/20"></div>
                    <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-40"></div>
                  </>
                )}
              </div>
            </div>
            
            <div className="text-center w-full">
              {isPeterSpeaking && (
                <div className="py-2 px-1 mb-1 sm:mb-2 bg-black/20 backdrop-blur-sm rounded-full">
                  <VoiceWave />
                </div>
              )}
            </div>
          </div>
          
          {/* Right side - Messages */}
          <div className="flex-grow flex flex-col overflow-hidden">
            <ScrollArea 
              ref={scrollAreaRef}
              className="flex-grow p-2 sm:p-4 overflow-y-auto"
            >
              <div className="space-y-2 sm:space-y-3 max-w-3xl mx-auto">
                {messages.length > 0 ? (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <Card className={`max-w-[85%] shadow-sm ${
                        message.role === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-background border-muted'
                      }`}>
                        <CardContent className="p-2 sm:p-3">
                          <p className="text-xs font-medium mb-1 opacity-70">
                            {message.role === 'user' ? 'You' : 'Anna'}
                          </p>
                          <p className="text-xs sm:text-sm leading-relaxed">{message.content}</p>
                        </CardContent>
                      </Card>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-center items-center h-full py-4">
                    <Card className="bg-background border-muted max-w-[90%]">
                      <CardContent className="p-3">
                        <p className="text-center text-muted-foreground">Connecting to Anna...</p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Styles for landscape orientation on mobile */}
      <style jsx global>{`
        @media (max-height: 500px) and (orientation: landscape) {
          .w-1\/4 {
            width: 80px !important;
            min-width: 80px !important;
          }
          h2 {
            font-size: 0.875rem !important;
          }
          p {
            font-size: 0.75rem !important;
          }
        }
      `}</style>
    </div>
  );
} 