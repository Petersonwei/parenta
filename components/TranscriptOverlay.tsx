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

// Circular wave animation component
function CircularWaves({ isActive }: { isActive: boolean }) {
  return (
    <>
      <div 
        className={`absolute inset-0 rounded-full border-2 border-primary/40 ${isActive ? 'animate-[circleWave_2s_infinite]' : 'animate-[circleWave_3s_infinite]'}`}
        style={{ animationDelay: '0s' }}
      />
      <div 
        className={`absolute inset-0 rounded-full border-2 border-primary/40 ${isActive ? 'animate-[circleWave_2s_infinite]' : 'animate-[circleWave_3s_infinite]'}`}
        style={{ animationDelay: '0.5s' }}
      />
      <div 
        className={`absolute inset-0 rounded-full border-2 border-primary/40 ${isActive ? 'animate-[circleWave_2s_infinite]' : 'animate-[circleWave_3s_infinite]'}`}
        style={{ animationDelay: '1s' }}
      />
    </>
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

  // Add keyframe animations
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes voiceWave {
        0% { transform: scaleY(0.4); }
        50% { transform: scaleY(1); }
        100% { transform: scaleY(0.4); }
      }
      @keyframes circleWave {
        0% { transform: scale(1); opacity: 0.4; }
        100% { transform: scale(1.3); opacity: 0; }
      }
      @keyframes glowPulse {
        0% { box-shadow: 0 0 10px 2px rgba(255, 255, 255, 0.2); }
        50% { box-shadow: 0 0 20px 4px rgba(255, 255, 255, 0.4); }
        100% { box-shadow: 0 0 10px 2px rgba(255, 255, 255, 0.2); }
      }
      @keyframes softGlowPulse {
        0% { box-shadow: 0 0 8px 1px rgba(255, 255, 255, 0.1); }
        50% { box-shadow: 0 0 15px 2px rgba(255, 255, 255, 0.2); }
        100% { box-shadow: 0 0 8px 1px rgba(255, 255, 255, 0.1); }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      if (style && document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  if (!isCallActive) return null;

  const latestMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const isPeterSpeaking = latestMessage?.role === 'assistant' && !latestMessage?.isComplete;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-stretch z-50 overflow-hidden">
      <div className="w-full h-full flex flex-col">
        {/* Header */}
        <div className="bg-background/95 backdrop-blur-sm px-2 py-1.5 sm:p-3 border-b flex items-center justify-between min-h-[40px] sm:min-h-[48px]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary flex items-center justify-center">
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-foreground" />
            </div>
            <h2 className="text-sm sm:text-base font-semibold truncate">
              {isPeterSpeaking ? "Anna is speaking..." : "Anna"}
            </h2>
          </div>
          <Button
            onClick={onEndCall}
            variant="destructive"
            size="sm"
            className="h-7 sm:h-8 rounded-full px-2 sm:px-3 text-xs"
            disabled={!canEndCall}
          >
            <PhoneOff className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="ml-1 hidden sm:inline">End Call</span>
          </Button>
        </div>
        
        <div className="flex flex-grow overflow-hidden h-[calc(100%-40px)] sm:h-[calc(100%-48px)]">
          {/* Left side - Anna's avatar */}
          <div className="w-20 sm:w-[120px] md:w-[200px] border-r bg-muted/10 backdrop-blur-sm flex flex-col items-center justify-center p-2 sm:p-4">
            <div className="relative">
              {/* Circular waves - always active but different speed when speaking */}
              <CircularWaves isActive={isPeterSpeaking} />
              
              {/* Avatar */}
              <div className={`relative w-14 h-14 sm:w-20 sm:h-20 md:w-28 md:h-28 rounded-full overflow-hidden 
                             ${isPeterSpeaking ? 'animate-[glowPulse_2s_ease-in-out_infinite]' : 'animate-[softGlowPulse_3s_ease-in-out_infinite]'}`}>
                <Image
                  src="/Anna.png"
                  alt="Anna"
                  fill
                  style={{ objectFit: "cover" }}
                  className="rounded-full"
                />
              </div>
            </div>
            
            {/* Voice wave - always visible but different style when speaking */}
            <div className={`w-full mt-2 py-1.5 px-1 rounded-full ${
              isPeterSpeaking ? 'bg-black/20' : 'bg-black/10'
            } backdrop-blur-sm`}>
              <VoiceWave />
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
                          <p className="text-[10px] sm:text-xs font-medium mb-0.5 sm:mb-1 opacity-70">
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
                      <CardContent className="p-2 sm:p-3">
                        <p className="text-center text-xs sm:text-sm text-muted-foreground">
                          Connecting to Anna...
                        </p>
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