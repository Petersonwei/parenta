'use client' // Marks this as a client-side component in Next.js

// Import necessary hooks, components and types
import { useCallback, useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { RetellWebClient } from "retell-client-js-sdk"
import { v4 as uuidv4 } from 'uuid'
import { retellConfig } from '@/lib/retell-config'
import '../types/retell-client'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { Phone, PhoneOff } from "lucide-react"

// Interface for chat messages between user and assistant
interface Message {
  id: string
  type: 'response' | 'transcription' // Whether it's a direct response or transcribed speech
  role?: string // 'user' or 'assistant'
  content: string
  timestamp: Date
  isComplete?: boolean // Whether the message is complete
}

// Main state interface for the VoiceBot component
interface VoiceBotState {
  isCallActive: boolean // Whether a call is currently in progress
  isLoading: boolean // Loading state for API calls
  error: string | null // Error message if something goes wrong
  callStatus: 'idle' | 'connecting' | 'ongoing' | 'ended' | 'error' // Current status of the call
  messages: Message[] // Array of chat messages
  connectionAttempts: number // Track connection attempts
}

// Export interface for the ref
export interface VoiceBotRef {
  startCall: () => Promise<void>;
  endCall: () => Promise<void>;
}

interface VoiceBotProps {
  onCallStatusChange?: (status: string) => void;
  onMessagesUpdate?: (messages: Message[]) => void;
}

const VoiceBot = forwardRef<VoiceBotRef, VoiceBotProps>(({ onCallStatusChange, onMessagesUpdate }, ref) => {
  const { toast } = useToast()
  const clientRef = useRef<RetellWebClient | null>(null) // Ref to store Retell client instance
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null) // Ref for connection timeout
  const isEndingCallRef = useRef<boolean>(false)
  
  const [state, setState] = useState<VoiceBotState>({
    isCallActive: false,
    isLoading: false,
    error: null,
    callStatus: 'idle',
    messages: [],
    connectionAttempts: 0
  })

  // Initialize Retell client on component mount
  useEffect(() => {
    // Only initialize if not already initialized
    if (!clientRef.current) {
      try {
        clientRef.current = new RetellWebClient()
        console.log('[VoiceBot] Client initialized')
      } catch (err) {
        console.error('[VoiceBot] Error initializing client:', err)
      }
    }

    // Cleanup on unmount
    return () => {
      if (clientRef.current) {
        console.log('[VoiceBot] Cleaning up client')
        try {
          clientRef.current.removeAllListeners()
          clientRef.current.stopCall()
        } catch (err) {
          console.error('[VoiceBot] Error during cleanup:', err)
        }
        clientRef.current = null
      }
      
      // Clear any pending timeouts
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current)
        connectionTimeoutRef.current = null
      }
    }
  }, [])

  // Helper function to update state partially
  const updateState = useCallback((update: Partial<VoiceBotState>) => {
    setState(prev => {
      const newState = { ...prev, ...update };
      return newState;
    });
  }, []);
  
  // Use an effect to notify about call status changes
  useEffect(() => {
    if (onCallStatusChange) {
      onCallStatusChange(state.callStatus);
    }
  }, [state.callStatus, onCallStatusChange]);

  // Update the messages state effect to notify parent
  useEffect(() => {
    if (onMessagesUpdate) {
      onMessagesUpdate(state.messages);
    }
  }, [state.messages, onMessagesUpdate]);
  
  // Function to safely initialize the client if needed
  const ensureClientInitialized = useCallback(() => {
    if (!clientRef.current) {
      try {
        clientRef.current = new RetellWebClient()
        console.log('[VoiceBot] Client re-initialized')
        return true
      } catch (err) {
        console.error('[VoiceBot] Error re-initializing client:', err)
        return false
      }
    }
    return true
  }, [])

  // Handler to end an active call
  const endCall = useCallback(async () => {
    if (!clientRef.current || isEndingCallRef.current) {
      console.log('[VoiceBot] No active call or call already ending');
      return;
    }

    isEndingCallRef.current = true;
    console.log('[VoiceBot] Starting call end process');
    
    try {
      // First update state to reflect call ended
      updateState({ 
        isCallActive: false,
        callStatus: 'ended'
      })
      
      // Stop the call
      console.log('[VoiceBot] Stopping call...');
      await clientRef.current.stopCall()
      
      // Reset client to ensure clean state for next call
      console.log('[VoiceBot] Removing all listeners...');
      clientRef.current.removeAllListeners()
      
      // Wait a moment before reinitializing to ensure complete cleanup
      setTimeout(() => {
        console.log('[VoiceBot] Reinitializing client after call end...');
        clientRef.current = null
        ensureClientInitialized()
      }, 1000);
    } catch (err) {
      console.error('[VoiceBot] Error ending call:', err)
      
      // Even if there's an error, consider the call ended
      updateState({
        isCallActive: false,
        error: err instanceof Error ? err.message : 'Failed to end call',
        callStatus: 'ended'
      })
      
      // Reset client to ensure clean state
      if (clientRef.current) {
        try {
          clientRef.current.removeAllListeners()
        } catch (e) {
          console.error('[VoiceBot] Error removing listeners:', e)
        }
        
        // Wait a moment before reinitializing
        setTimeout(() => {
          clientRef.current = null
          ensureClientInitialized()
        }, 1000);
      }
    } finally {
      // Always reset the ending flag
      isEndingCallRef.current = false;
    }
  }, [updateState, ensureClientInitialized])
  
  // Effect to handle cleanup when component unmounts
  useEffect(() => {
    return () => {
      // Call endCall on unmount to ensure proper cleanup
      if (state.isCallActive) {
        endCall();
      }
    };
  }, [endCall, state.isCallActive]);

  // Handler to start a new call
  const startCall = useCallback(async () => {
    // Don't start if we're ending a call
    if (isEndingCallRef.current) {
      console.log('[VoiceBot] Cannot start call while ending another call');
      return;
    }

    // Ensure client is initialized
    if (!ensureClientInitialized()) {
      updateState({
        error: 'Failed to initialize client',
        callStatus: 'error'
      })
      return
    }
    
    // If a call is already active, stop it first
    if (state.isCallActive) {
      try {
        await clientRef.current!.stopCall();
        // Wait a moment for the call to fully end
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        console.error('[VoiceBot] Error stopping existing call:', err);
      }
    }
    
    try {
      // First update state to connecting so the WakeWordDetector knows we're starting a call
      updateState({ 
        isLoading: true, 
        error: null, 
        callStatus: 'connecting',
        connectionAttempts: state.connectionAttempts + 1
      })
      
      // Create a new call via API
      const response = await fetch('/api/retell/create-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: retellConfig.agentId,
          apiKey: retellConfig.apiKey
        }),
      })

      if (!response.ok) throw new Error('Failed to create call')
      
      const { access_token } = await response.json()
      
      // Set a connection timeout
      connectionTimeoutRef.current = setTimeout(() => {
        if (state.callStatus === 'connecting') {
          console.error('[VoiceBot] Connection timeout')
          updateState({
            error: 'Connection timeout. Please try again.',
            isLoading: false,
            callStatus: 'error'
          })
          
          // Try to clean up
          try {
            if (clientRef.current) {
              clientRef.current.stopCall()
            }
          } catch (err) {
            console.error('[VoiceBot] Error stopping call after timeout:', err)
          }
        }
      }, 15000) // 15 second timeout
      
      // Initialize call with Retell client
      await clientRef.current!.startCall({ 
        accessToken: access_token,
        sampleRate: 24000,
        captureDeviceId: 'default',
        emitRawAudioSamples: false
      })
      
      // Clear the timeout since we connected successfully
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current)
        connectionTimeoutRef.current = null
      }
      
      // Update state to ongoing
      updateState({ 
        isCallActive: true, 
        isLoading: false,
        callStatus: 'ongoing' 
      })
      
      console.log('[VoiceBot] Call started successfully');
    } catch (err) {
      console.error('[VoiceBot] Error starting call:', err)
      
      // Clear the timeout
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current)
        connectionTimeoutRef.current = null
      }
      
      // If we've tried too many times, suggest refreshing
      const errorMessage = state.connectionAttempts >= 2
        ? 'Connection issues persist. Please refresh the page and try again.'
        : err instanceof Error ? err.message : 'Failed to start call'
      
      updateState({
        error: errorMessage,
        isLoading: false,
        callStatus: 'error'
      })
      
      // Show toast with error
      toast({
        title: "Call Error",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }, [updateState, ensureClientInitialized, state.connectionAttempts, state.isCallActive, state.callStatus, toast])

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    startCall,
    endCall
  }), [startCall, endCall]);

  // Set up event listeners for the Retell client
  useEffect(() => {
    if (!clientRef.current) return

    console.log('[VoiceBot] Setting up event listeners');

    // Handle real-time updates from the call
    clientRef.current.on("update", (update: { 
      transcript?: { role: string; content: string }[];
      llmResponse?: string;
      response?: string | { content?: string; text?: string }
    }) => {
      console.log('[VoiceBot] Received update:', update)
      
      // If we're receiving updates, we're definitely connected
      if (state.callStatus === 'connecting') {
        updateState({ callStatus: 'ongoing' })
        
        // Clear connection timeout
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current)
          connectionTimeoutRef.current = null
        }
      }
      
      // Handle new speech transcriptions
      if (update.transcript && Array.isArray(update.transcript)) {
        const latestTranscript = update.transcript[update.transcript.length - 1]
        if (!latestTranscript) return

        const role = latestTranscript.role.toLowerCase() === 'agent' ? 'assistant' : 'user'
        const content = latestTranscript.content.trim()

        if (!content) return

        // Check for "Byebye Anna" to end the call
        if (role === 'user' && content.toLowerCase().includes('byebye Anna')) {
          console.log('[VoiceBot] End call phrase detected:', content);
          toast({
            title: "End Call Detected",
            description: "Byebye Anna detected! Ending call...",
          });
          
          // End the call with a slight delay to allow the message to be added
          setTimeout(() => {
            endCall();
          }, 500);
        }

        setState(prev => {
          // Find the last message from the same role that isn't complete
          const lastIncompleteMessageIndex = [...prev.messages].reverse()
            .findIndex(m => m.role === role && !m.isComplete)
          
          if (lastIncompleteMessageIndex === -1) {
            // No incomplete message found, create new one
            return {
              ...prev,
              messages: [...prev.messages, {
                id: uuidv4(),
                type: 'transcription',
                role: role,
                content: content,
                timestamp: new Date(),
                isComplete: false
              }]
            }
          } else {
            // Update the existing incomplete message
            const actualIndex = prev.messages.length - 1 - lastIncompleteMessageIndex
            const updatedMessages = [...prev.messages]
            updatedMessages[actualIndex] = {
              ...updatedMessages[actualIndex],
              content: content
            }
            return {
              ...prev,
              messages: updatedMessages
            }
          }
        })
      }

      // Handle bot responses - mark them as complete immediately
      if (update.response) {
        const responseContent = typeof update.response === 'object'
          ? update.response.content || update.response.text || JSON.stringify(update.response)
          : update.response

        setState(prev => ({
          ...prev,
          messages: [...prev.messages, {
            id: uuidv4(),
            type: 'response',
            role: 'assistant',
            content: responseContent,
            timestamp: new Date(),
            isComplete: true
          }]
        }))
      }
    })

    // When a sentence is complete, mark the last incomplete message as complete
    clientRef.current.on("sentence_complete", () => {
      setState(prev => {
        const lastIncompleteMessageIndex = prev.messages.findIndex(m => !m.isComplete)
        if (lastIncompleteMessageIndex === -1) return prev

        const updatedMessages = [...prev.messages]
        updatedMessages[lastIncompleteMessageIndex] = {
          ...updatedMessages[lastIncompleteMessageIndex],
          isComplete: true
        }
        return {
          ...prev,
          messages: updatedMessages
        }
      })
    })

    // Handle errors during the call
    clientRef.current.on("error", (error) => {
      console.error('[VoiceBot] Error:', error)
      
      // Clear connection timeout if it exists
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current)
        connectionTimeoutRef.current = null
      }
      
      // Check for LiveKit connection errors
      const isLiveKitError = error.message?.includes('cannot publish track') || 
                            error.message?.includes('LiveKit') ||
                            error.message?.includes('not connected')
      
      // Handle LiveKit errors specially
      if (isLiveKitError) {
        // End the call and reset the client
        try {
          clientRef.current?.stopCall()
          clientRef.current?.removeAllListeners()
          
          // Wait a moment before reinitializing
          setTimeout(() => {
            clientRef.current = null
            ensureClientInitialized()
            
            updateState({ 
              isCallActive: false,
              error: 'Connection error. The call has been ended.',
              callStatus: 'error'
            })
          }, 1000);
        } catch (e) {
          console.error('[VoiceBot] Error cleaning up after LiveKit error:', e)
          
          updateState({ 
            isCallActive: false,
            error: 'Connection error. The call has been ended.',
            callStatus: 'error'
          })
        }
      } else {
        // For other errors, just update the state
        updateState({ 
          error: error.message || 'An error occurred',
          callStatus: 'error'
        })
      }
      
      toast({
        title: "Call Error",
        description: error.message || 'An error occurred',
        variant: "destructive"
      })
    })

    // Handle call ending
    clientRef.current.on("call_ended", () => {
      console.log('[VoiceBot] Call ended event received')
      
      // Clear connection timeout if it exists
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current)
        connectionTimeoutRef.current = null
      }
      
      // First update state to reflect call ended
      updateState({ 
        isCallActive: false,
        callStatus: 'ended'
      })
      
      // Reset client to ensure clean state for next call
      console.log('[VoiceBot] Cleaning up client after call ended event');
      
      try {
        if (clientRef.current) {
          clientRef.current.removeAllListeners()
        }
      } catch (e) {
        console.error('[VoiceBot] Error removing listeners after call end:', e)
      }
      
      // Wait a moment before reinitializing to ensure complete cleanup
      setTimeout(() => {
        console.log('[VoiceBot] Reinitializing client after call end event');
        clientRef.current = null
        ensureClientInitialized()
      }, 2000)
    })

    // Cleanup event listeners
    return () => {
      console.log('[VoiceBot] Cleaning up event listeners');
      if (clientRef.current) {
        try {
          clientRef.current.removeAllListeners()
        } catch (e) {
          console.error('[VoiceBot] Error removing listeners during cleanup:', e)
        }
      }
    }
  }, [updateState, toast, state.callStatus, ensureClientInitialized, endCall])

  // Render UI
  return (
    <Card className="w-full max-w-3xl mx-auto border-2 shadow-md">
      <CardContent className="p-3 sm:p-6">
        {/* Call control button and status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
          <Button
            onClick={state.isCallActive ? endCall : startCall}
            disabled={state.isLoading}
            variant={state.isCallActive ? "destructive" : "default"}
            className="px-4 sm:px-6 py-2 sm:py-5 text-sm sm:text-base font-medium"
            size="default"
          >
            {state.isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                <span>Initializing...</span>
              </div>
            ) : state.isCallActive ? (
              <>
                <PhoneOff className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                End Call
              </>
            ) : (
              <>
                <Phone className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Start Chat
              </>
            )}
          </Button>
          
          <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-muted self-end sm:self-auto">
            <div className={`h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full ${
              state.callStatus === 'ongoing' ? 'bg-green-500' : 
              state.callStatus === 'connecting' ? 'bg-amber-500' :
              state.callStatus === 'error' ? 'bg-red-500' : 'bg-blue-500'
            }`}></div>
            <span className="text-xs sm:text-sm font-medium capitalize">
              {state.callStatus}
            </span>
          </div>
        </div>

        {/* Error display */}
        {state.error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-destructive/10 text-destructive rounded-md border border-destructive/20 flex items-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 mt-0.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <div className="text-sm">{state.error}</div>
          </div>
        )}

        {/* Chat message display */}
        <ScrollArea className="min-h-[200px] max-h-[600px] h-auto rounded-md border p-3 sm:p-4 bg-muted/20">
          <div className="space-y-3 sm:space-y-4">
            {state.messages.length === 0 && (
              <div className="h-full flex items-center justify-center py-16 sm:py-20">
                <div className="text-center text-muted-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto h-10 sm:h-12 w-10 sm:w-12 mb-3 sm:mb-4 opacity-50">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  <h3 className="text-base sm:text-lg font-medium mb-1">No conversations yet</h3>
                  <p className="text-xs sm:text-sm">Say <strong>Hi Anna</strong> or click the Start Call button to begin</p>
                </div>
              </div>
            )}
            {state.messages.map((message) => (
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
                  <CardContent className="p-2 sm:p-3">
                    <p className="text-xs font-medium mb-1 opacity-70">
                      {message.role === 'user' ? 'You' : 'Anna'}
                    </p>
                    <p className="text-sm sm:text-base leading-relaxed">{message.content}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
})

VoiceBot.displayName = 'VoiceBot';

export default VoiceBot;