import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { PhoneOff, Mic, MessageSquare } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useEffect, useState, useRef } from "react"

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

  if (!isCallActive) return null;

  // Get the latest message
  const latestMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const isPeterSpeaking = latestMessage?.role === 'assistant' && !latestMessage?.isComplete;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-auto">
      <Card className="w-full max-w-lg bg-background/95 backdrop-blur-sm shadow-lg border-2 flex flex-col h-auto max-h-[90vh] landscape-mode">
        <CardContent className="p-3 sm:p-6 flex flex-col flex-grow landscape:p-2 landscape:sm:p-3 overflow-hidden landscape-content">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2 landscape:flex-row landscape:items-center landscape:gap-1 landscape:mb-2">
            <div className="flex items-center gap-2 landscape:gap-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary flex items-center justify-center landscape:w-6 landscape:h-6">
                {isPeterSpeaking ? (
                  <MessageSquare className="w-4 h-4 sm:w-6 sm:h-6 text-primary-foreground landscape:w-3 landscape:h-3" />
                ) : (
                  <Mic className="w-4 h-4 sm:w-6 sm:h-6 text-primary-foreground landscape:w-3 landscape:h-3" />
                )}
              </div>
              <div>
                <h2 className="text-sm sm:text-xl font-semibold landscape:text-xs landscape:sm:text-sm landscape-text">
                  {isPeterSpeaking ? "Anna is speaking..." : "Anna"}
                </h2>
                {isPeterSpeaking && (
                  <p className="text-muted-foreground text-xs landscape:text-[10px] landscape-text">
                    Please wait until the response is complete
                  </p>
                )}
              </div>
            </div>
            <Button
              onClick={onEndCall}
              variant="destructive"
              size="sm"
              className="rounded-full px-3 sm:px-6 py-1 sm:py-2 self-end sm:self-auto landscape:px-2 landscape:py-0.5"
              disabled={!canEndCall}
            >
              <PhoneOff className="mr-1 h-4 w-4 landscape:h-3 landscape:w-3" />
              <span className="text-xs sm:text-base landscape:text-[10px] landscape-text">End Call</span>
            </Button>
          </div>

          <ScrollArea 
            ref={scrollAreaRef}
            className="flex-grow rounded-xl bg-muted/50 backdrop-blur-sm p-2 sm:p-4 min-h-[10vh] landscape:min-h-[10vh] landscape:h-auto landscape:p-2 overflow-y-auto landscape-scrollarea"
          >
            <div className="space-y-2 sm:space-y-4 landscape:space-y-1.5">
              {messages.length > 0 ? (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <Card className={`max-w-[85%] sm:max-w-[80%] shadow-sm ${
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-background border-muted'
                    }`}>
                      <CardContent className="p-2 sm:p-3 landscape:p-1.5">
                        <p className="text-xs font-medium mb-1 opacity-70 landscape:text-[10px] landscape:mb-0.5 landscape-text">
                          {message.role === 'user' ? 'You' : 'Anna'}
                        </p>
                        <p className="text-xs sm:text-base leading-relaxed landscape:leading-snug landscape:text-xs landscape-text">{message.content}</p>
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
        </CardContent>
      </Card>
    </div>
  );
} 