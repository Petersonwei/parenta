'use client'

import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react'
import { useToast } from "@/hooks/use-toast"
import VoiceBot from './VoiceBot'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare } from 'lucide-react'

// Define SpeechRecognition types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  error: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal?: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: (event: Event) => void;
  onend: (event: Event) => void;
  onerror: (event: SpeechRecognitionEvent) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
}

// Define possible states for the wake word detector
type DetectorState = 'initializing' | 'listening' | 'detected' | 'calling' | 'error';

// Message interface for communication with parent components
interface Message {
  id: string
  type: 'response' | 'transcription'
  role?: string
  content: string
  timestamp: Date
  isComplete?: boolean
}

// Props for the WakeWordDetector component
interface WakeWordDetectorProps {
  onCallStatusChange?: (status: string) => void;  // Callback when call status changes
  onMessagesUpdate?: (messages: Message[]) => void;  // Callback to update messages in parent
  onEndCall?: () => void;  // Callback when call ends
}

// Methods exposed via ref to parent components
export interface WakeWordDetectorRef {
  endCall: () => Promise<void>;  // Method to programmatically end a call
}

/**
 * WakeWordDetector - A component that listens for a wake word ("Hey Anna" or "Hi Anna")
 * and initiates a voice call when detected.
 * 
 * This component handles:
 * - Microphone permission requests
 * - Speech recognition to detect wake words
 * - State management for the detection and calling process
 * - Integration with VoiceBot for handling the actual call
 */
const WakeWordDetector = forwardRef<WakeWordDetectorRef, WakeWordDetectorProps>(
  ({ onCallStatusChange, onMessagesUpdate, onEndCall }, ref) => {
    const { toast } = useToast()
    
    // Main state to track what the detector is doing
    const [detectorState, setDetectorState] = useState<DetectorState>('initializing');
    
    // Refs for speech recognition and VoiceBot
    const recognitionRef = useRef<SpeechRecognition | null>(null);  // Holds the speech recognition instance
    const voiceBotRef = useRef<{ startCall: () => Promise<void>; endCall: () => Promise<void> } | null>(null);  // Reference to VoiceBot component
    const noSpeechTimeoutRef = useRef<NodeJS.Timeout | null>(null);  // Timeout for when no speech is detected
    const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);  // Timeout for restarting recognition
    const callEndedTimeoutRef = useRef<NodeJS.Timeout | null>(null);  // Timeout after call ends
    const isTransitioningRef = useRef<boolean>(false);  // Flag to prevent multiple state transitions
    const isListeningRef = useRef<boolean>(false);  // Flag to track if recognition is active
    const isCallEndingRef = useRef<boolean>(false);  // Flag to prevent multiple call end attempts
    const startCallRef = useRef<() => Promise<void>>(() => Promise.resolve());  // Reference to startCall function
    
    /**
     * Clears all timeouts to prevent memory leaks and unexpected behavior
     */
    const clearAllTimeouts = useCallback(() => {
      if (noSpeechTimeoutRef.current) {
        clearTimeout(noSpeechTimeoutRef.current);
        noSpeechTimeoutRef.current = null;
      }
      
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      
      if (callEndedTimeoutRef.current) {
        clearTimeout(callEndedTimeoutRef.current);
        callEndedTimeoutRef.current = null;
      }
    }, []);
    
    /**
     * Safely stops the speech recognition process
     */
    const stopRecognition = useCallback(() => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          // Ignore errors during cleanup
          console.log('[WakeWordDetector] Error stopping recognition:', err);
        }
        recognitionRef.current = null;
      }
      isListeningRef.current = false;
    }, []);
    
    /**
     * Starts the wake word detection process
     * - Creates a new SpeechRecognition instance
     * - Sets up event handlers for speech recognition
     * - Handles wake word detection logic
     */
    const startWakeWordDetection = useCallback(() => {
      if (typeof window === 'undefined') return;
      
      // Don't start if already listening or transitioning
      if (isListeningRef.current || isTransitioningRef.current) {
        console.log('[WakeWordDetector] Already listening or transitioning, not starting');
        return;
      }
      
      // Don't start if we're not in listening state or if we're in a call
      if (detectorState !== 'listening') {
        console.log('[WakeWordDetector] Not in proper state for wake word detection:', detectorState);
        return;
      }
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.error('[WakeWordDetector] SpeechRecognition not available');
        return;
      }
      
      console.log('[WakeWordDetector] Starting wake word detection');
      
      // Create a new recognition instance
      const recognition = new SpeechRecognition();
      recognition.continuous = false; // Changed to false to reduce lag
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      // Store reference
      recognitionRef.current = recognition;
      
      // Set up event handlers
      recognition.onstart = () => {
        console.log('[WakeWordDetector] Started listening for wake word');
        isListeningRef.current = true;
        
        // Set a timeout to handle the "no-speech" error
        // This will restart recognition if no speech is detected for a while
        noSpeechTimeoutRef.current = setTimeout(() => {
          if (detectorState === 'listening' && recognitionRef.current === recognition && !isTransitioningRef.current) {
            console.log('[WakeWordDetector] No speech detected for a while, restarting recognition');
            stopRecognition();
            
            // Restart after a short delay
            restartTimeoutRef.current = setTimeout(() => {
              if (detectorState === 'listening' && !isTransitioningRef.current && !isListeningRef.current) {
                startWakeWordDetection();
              }
            }, 500);
          }
        }, 10000); // 10 seconds timeout
      };
      
      // Handle recognition errors
      recognition.onerror = (event: SpeechRecognitionEvent) => {
        // Handle different types of errors
        if (event.error === 'no-speech') {
          // This is common and expected - just restart recognition
          console.log('[WakeWordDetector] No speech detected, restarting recognition');
          
          if (detectorState === 'listening' && !isTransitioningRef.current) {
            stopRecognition();
            
            // Restart after a short delay
            restartTimeoutRef.current = setTimeout(() => {
              if (detectorState === 'listening' && !isTransitioningRef.current && !isListeningRef.current) {
                startWakeWordDetection();
              }
            }, 500);
          }
        } else if (event.error === 'aborted') {
          // Ignore aborted errors - these happen when we stop recognition intentionally
          console.log('[WakeWordDetector] Recognition aborted');
          isListeningRef.current = false;
        } else if (event.error === 'not-allowed') {
          console.error('[WakeWordDetector] Microphone access denied:', event.error);
          setDetectorState('error');
          toast({
            title: "Microphone Access Error",
            description: "Please allow microphone access in your browser settings.",
            variant: "destructive"
          });
        } else {
          // For other errors, log and restart if needed
          console.error('[WakeWordDetector] Recognition error:', event.error);
          
          if (detectorState === 'listening' && !isTransitioningRef.current) {
            stopRecognition();
            
            // Restart after a delay
            restartTimeoutRef.current = setTimeout(() => {
              if (detectorState === 'listening' && !isTransitioningRef.current && !isListeningRef.current) {
                startWakeWordDetection();
              }
            }, 1000);
          }
        }
      };
      
      // Handle recognition end event
      recognition.onend = () => {
        console.log('[WakeWordDetector] Wake word detection ended');
        isListeningRef.current = false;
        
        // Clear the no-speech timeout
        if (noSpeechTimeoutRef.current) {
          clearTimeout(noSpeechTimeoutRef.current);
          noSpeechTimeoutRef.current = null;
        }
        
        // If we're still in listening state and this is the current recognition instance,
        // restart after a short delay
        if (detectorState === 'listening' && recognitionRef.current === recognition && !isTransitioningRef.current) {
          recognitionRef.current = null;
          
          restartTimeoutRef.current = setTimeout(() => {
            if (detectorState === 'listening' && !isTransitioningRef.current && !isListeningRef.current) {
              startWakeWordDetection();
            }
          }, 500);
        }
      };
      
      // Process speech recognition results
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        // Clear the no-speech timeout since we got a result
        if (noSpeechTimeoutRef.current) {
          clearTimeout(noSpeechTimeoutRef.current);
          noSpeechTimeoutRef.current = null;
        }
        
        // Don't process results if we're transitioning states or in a call
        if (isTransitioningRef.current || detectorState !== 'listening') {
          console.log('[WakeWordDetector] Ignoring speech recognition results - currently transitioning or not in listening state:', detectorState);
          return;
        }

        const transcript = Array.from(event.results)
          .map((result: SpeechRecognitionResult) => result[0].transcript.toLowerCase())
          .join(' ');
        
        // Only log if there's meaningful content to reduce console spam
        if (transcript.trim().length > 0) {
          console.log('[WakeWordDetector] Heard:', transcript, 'Current state:', detectorState);
        }
        
        // More lenient wake word detection - check for partial matches
        const detectWakeWord = (text: string) => {
          // Check for exact matches first
          if (text.includes('hey anna') || text.includes('hi anna')) {
            return true;
          }
          
          // Check for close variations (more permissive)
          const annaVariations = ['anna', 'ana', 'enna', 'enna', 'hannah', 'hanna', 'onna', 'ahna', 'anah', 'annuh'];
          const heyVariations = ['hey', 'hi', 'hay', 'hei', 'ay', 'hello', 'helo', 'heya', 'hiya', 'eh', 'ey'];
          
          // Check for any combination of hey/hi + anna variations
          for (const hey of heyVariations) {
            for (const anna of annaVariations) {
              const phrase = `${hey} ${anna}`;
              // Use a more lenient matching approach - if the text contains any parts of the wake phrase
              if (text.includes(phrase) || 
                  (text.includes(hey) && text.includes(anna)) || 
                  text.includes(anna)) {
                return true;
              }
            }
          }
          
          return false;
        };

        // Check for wake word using the more lenient detection
        if (detectWakeWord(transcript)) {
          console.log('[WakeWordDetector] Wake word detected:', transcript);
          
          // Set transitioning flag to prevent multiple detections
          isTransitioningRef.current = true;
          
          // Stop recognition and clear timeouts
          stopRecognition();
          clearAllTimeouts();
          
          // Update state to detected
          setDetectorState('detected');
          
          // Show toast
          toast({
            title: "Wake Word Detected",
            description: "Hey Anna detected! Starting call...",
          });
          
          // Start call after a short delay to ensure clean state transition
          setTimeout(() => {
            startCallRef.current();
            // Reset transitioning flag after call starts
            setTimeout(() => {
              isTransitioningRef.current = false;
            }, 1000);
          }, 500);
        }
      };
      
      // Start listening
      try {
        recognition.start();
      } catch (err) {
        console.error('[WakeWordDetector] Error starting recognition:', err);
        recognitionRef.current = null;
        isListeningRef.current = false;
        
        // Try again after a short delay
        if (!isTransitioningRef.current) {
          restartTimeoutRef.current = setTimeout(() => {
            if (detectorState === 'listening' && !isTransitioningRef.current && !isListeningRef.current) {
              startWakeWordDetection();
            }
          }, 1000);
        }
      }
    }, [detectorState, stopRecognition, clearAllTimeouts, toast]);
    
    /**
     * Initialize the detector on mount:
     * - Check browser support for speech recognition
     * - Request microphone permissions
     * - Set up initial state
     */
    useEffect(() => {
      if (typeof window === 'undefined') return;
      
      // Reset all state flags on mount to ensure clean state
      console.log('[WakeWordDetector] Initializing component, resetting flags');
      isTransitioningRef.current = false;
      isListeningRef.current = false;
      isCallEndingRef.current = false;
      
      // Check browser support
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        toast({
          title: "Browser not supported",
          description: "Your browser doesn't support speech recognition. Please try Chrome or Edge.",
          variant: "destructive"
        });
        setDetectorState('error');
        return;
      }
      
      // Request microphone permission
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => {
          console.log('[WakeWordDetector] Microphone permission granted');
          // Start in listening mode once permission is granted
          setDetectorState('listening');
        })
        .catch((err) => {
          console.error('[WakeWordDetector] Microphone permission denied:', err);
          toast({
            title: "Microphone Access Denied",
            description: "Please allow microphone access to use the wake word feature.",
            variant: "destructive"
          });
          setDetectorState('error');
        });
        
      // Add event listener for manual start
      const handleStartConversation = () => {
        console.log('[WakeWordDetector] Received startConversation event');
        if (detectorState === 'listening') {
          stopRecognition();
          clearAllTimeouts();
          isTransitioningRef.current = true;
          setDetectorState('detected');
          
          // Start call after a short delay
          setTimeout(() => {
            startCallRef.current();
            setTimeout(() => {
              isTransitioningRef.current = false;
            }, 1000);
          }, 500);
        }
      };
      
      // Add event listener for page unload to clean up resources
      const handleBeforeUnload = () => {
        console.log('[WakeWordDetector] Page unloading, cleaning up resources');
        stopRecognition();
        clearAllTimeouts();
      };
      
      window.addEventListener('startConversation', handleStartConversation);
      window.addEventListener('beforeunload', handleBeforeUnload);
        
      // Cleanup on unmount
      return () => {
        console.log('[WakeWordDetector] Component unmounting, cleaning up resources');
        stopRecognition();
        clearAllTimeouts();
        window.removeEventListener('startConversation', handleStartConversation);
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }, [toast, stopRecognition, clearAllTimeouts, detectorState, startWakeWordDetection]);
    
    /**
     * Manages speech recognition based on detector state
     * - Starts recognition when in 'listening' state
     * - Stops recognition in other states
     */
    useEffect(() => {
      if (typeof window === 'undefined') return;
      
      console.log('[WakeWordDetector] State changed to:', detectorState);
      
      // Important: Always stop recognition first when state changes
      // to prevent multiple overlapping instances
      stopRecognition();
      
      // Only start recognition when in listening state AND not transitioning
      if (detectorState === 'listening' && !isTransitioningRef.current) {
        console.log('[WakeWordDetector] Will start wake word detection after state change');
        
        // Add a delay before starting to avoid rapid restarts and ensure clean state
        restartTimeoutRef.current = setTimeout(() => {
          // Double-check state is still listening before starting
          if (detectorState === 'listening' && !isTransitioningRef.current && !isListeningRef.current) {
            console.log('[WakeWordDetector] Starting wake word detection from state change');
            startWakeWordDetection();
          } else {
            console.log('[WakeWordDetector] State changed during timeout, not starting recognition');
          }
        }, 2000); // Increased delay for stability
      } else {
        // For any other state, stop recognition and clear timeouts
        console.log('[WakeWordDetector] Not in listening state or transitioning, stopping recognition');
        
        // Don't clear callEndedTimeoutRef here, as we need it to persist
        // through state transitions to prevent premature restart
        if (noSpeechTimeoutRef.current) {
          clearTimeout(noSpeechTimeoutRef.current);
          noSpeechTimeoutRef.current = null;
        }
        
        if (restartTimeoutRef.current) {
          clearTimeout(restartTimeoutRef.current);
          restartTimeoutRef.current = null;
        }
      }
      
      // Cleanup function when state changes or component unmounts
      return () => {
        console.log('[WakeWordDetector] Cleanup on state change from', detectorState);
        
        // Always stop recognition when state changes to prevent leaks
        stopRecognition();
        
        if (restartTimeoutRef.current) {
          clearTimeout(restartTimeoutRef.current);
          restartTimeoutRef.current = null;
        }
        
        if (noSpeechTimeoutRef.current) {
          clearTimeout(noSpeechTimeoutRef.current);
          noSpeechTimeoutRef.current = null;
        }
      };
    }, [detectorState, clearAllTimeouts, stopRecognition, startWakeWordDetection]);
    
    /**
     * Initiates a call using the VoiceBot component
     * Called when wake word is detected
     */
    const startCall = useCallback(async () => {
      console.log('[WakeWordDetector] Starting call...');
      
      // Don't start if we're ending a call or already in a call
      if (isCallEndingRef.current) {
        console.log('[WakeWordDetector] Cannot start call while ending another call');
        return;
      }
      
      if (detectorState === 'calling' as DetectorState) {
        console.log('[WakeWordDetector] Already in a call, ignoring start request');
        return;
      }

      // First, forcibly stop any active recognition
      stopRecognition();
      
      // Set transition flags to prevent competing state changes
      isTransitioningRef.current = true;
      
      // Update state to calling
      setDetectorState('calling');
      
      if (voiceBotRef.current) {
        try {
          console.log('[WakeWordDetector] Starting call with VoiceBot');
          await voiceBotRef.current.startCall();
          console.log('[WakeWordDetector] Call started successfully');
          
          // Keep transitioning flag on for a moment to prevent immediate state changes
          setTimeout(() => {
            if (detectorState === 'calling' as DetectorState) {
              isTransitioningRef.current = false;
            }
          }, 2000);
          
        } catch (err) {
          console.error('[WakeWordDetector] Error starting call:', err);
          
          // Show error toast
          toast({
            title: "Call Error",
            description: "Failed to start call. Please try again.",
            variant: "destructive"
          });
          
          // Clear all timeouts before state change
          clearAllTimeouts();
          
          // Go back to listening mode after a delay
          setTimeout(() => {
            console.log('[WakeWordDetector] Resetting to listening state after call error');
            setDetectorState('listening');
            
            // Reset flags after another delay
            setTimeout(() => {
              isTransitioningRef.current = false;
              isCallEndingRef.current = false;
            }, 2000);
          }, 2000);
        }
      } else {
        console.error('[WakeWordDetector] VoiceBot reference not available');
        
        // Show error toast
        toast({
          title: "System Error",
          description: "Voice system not available. Please reload the page.",
          variant: "destructive"
        });
        
        // Reset state
        clearAllTimeouts();
        setTimeout(() => {
          setDetectorState('listening');
          setTimeout(() => {
            isTransitioningRef.current = false;
          }, 1000);
        }, 2000);
      }
    }, [toast, stopRecognition, clearAllTimeouts, detectorState]);

    // Keep startCallRef current to avoid stale closures
    useEffect(() => {
      startCallRef.current = startCall;
    }, [startCall]);
    
    /**
     * Handles the end of a call
     * - Resets state
     * - Notifies parent components
     * - Resumes wake word detection
     */
    const handleCallEnd = () => {
      console.log('[WakeWordDetector] Call ended, resuming wake word detection');
      
      // Set transitioning flag to prevent premature restart
      isTransitioningRef.current = true;
      
      // Clear any existing timeouts
      clearAllTimeouts();

      // Make sure recognition is stopped
      stopRecognition();

      // Notify parent about call end
      onCallStatusChange?.('ended');
      onEndCall?.();
      
      // Wait a moment before resuming detection
      callEndedTimeoutRef.current = setTimeout(() => {
        console.log('[WakeWordDetector] Resuming wake word detection after call');
        
        // Only change state if we're not already transitioning to another state
        if (detectorState === 'calling') {
          setDetectorState('listening');
        }
        
        // Force restart the recognition after a delay
        setTimeout(() => {
          // Only reset transition flag if we're still in the same flow
          if (detectorState === 'listening') {
            isTransitioningRef.current = false;
          }
          
          // Only restart if we're in listening state and not already listening
          if (detectorState === 'listening' && !isListeningRef.current && !isTransitioningRef.current) {
            console.log('[WakeWordDetector] Auto-restarting wake word detection');
            stopRecognition(); // Ensure it's stopped
            
            // Add a small delay before starting to ensure clean state
            setTimeout(() => {
              if (detectorState === 'listening' && !isTransitioningRef.current && !isListeningRef.current) {
                startWakeWordDetection();
              }
            }, 500);
          }
        }, 1000);
      }, 2000);
    };

    /**
     * Programmatically ends an active call
     * - Can be called by parent components via ref
     * - Resets state and resumes wake word detection
     */
    const endCall = useCallback(async () => {
      if (isCallEndingRef.current) {
        console.log('[WakeWordDetector] Call is already ending, ignoring request');
        return;
      }

      isCallEndingRef.current = true;
      isTransitioningRef.current = true;
      console.log('[WakeWordDetector] Starting call end process');

      try {
        // Stop recognition first
        stopRecognition();
        clearAllTimeouts();

        // End the call in VoiceBot
        if (voiceBotRef.current) {
          console.log('[WakeWordDetector] Ending call in VoiceBot');
          await voiceBotRef.current.endCall();
        }

        // Notify parent about call end
        onCallStatusChange?.('ended');
        onEndCall?.();

        // Wait a moment to ensure everything is cleaned up
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Only change state if we're still in calling
        if (detectorState === 'calling') {
          setDetectorState('listening');
        }

        // Keep transition flag on to prevent immediate restart
        // Add a longer delay before resetting flags and restarting detection
        setTimeout(() => {
          // Reset all states only if we're in listening state
          if (detectorState === 'listening') {
            isCallEndingRef.current = false;
            isTransitioningRef.current = false;
            isListeningRef.current = false;
            
            // Start wake word detection only if we're in listening state
            setTimeout(() => {
              if (detectorState === 'listening' && !isTransitioningRef.current && !isListeningRef.current) {
                console.log('[WakeWordDetector] Restarting wake word detection after call end');
                startWakeWordDetection();
              }
            }, 1000);
          } else {
            // Just reset the flags without starting detection
            isCallEndingRef.current = false;
            isTransitioningRef.current = false;
            isListeningRef.current = false;
          }
        }, 3000);

      } catch (err) {
        console.error('[WakeWordDetector] Error during call end:', err);
        // Even if there's an error, try to reset states and notify parent
        isCallEndingRef.current = false;
        isTransitioningRef.current = false;
        isListeningRef.current = false;
        
        // Only update state if we were in calling state
        if (detectorState === 'calling') {
          setDetectorState('listening');
        }
        
        onCallStatusChange?.('ended');
        onEndCall?.();
      }
    }, [onCallStatusChange, onEndCall, stopRecognition, clearAllTimeouts, startWakeWordDetection, detectorState]);

    // Expose endCall method via ref for parent components to use
    useImperativeHandle(ref, () => ({
      endCall
    }), [endCall]);
    
    /**
     * Render method updated to match new UI style
     */
    return (
      <div className="wake-word-detector">
        {/* The VoiceBot component is kept for functionality but hidden from view */}
        <div className="hidden">
          <VoiceBot 
            ref={voiceBotRef}
            onCallStatusChange={(status) => {
              console.log('[WakeWordDetector] Call status changed:', status);
              
              // First stop any active recognition to prevent conflicts
              stopRecognition();
              
              if (status === 'ended' || status === 'error') {
                handleCallEnd();
              } else if (status === 'ongoing' || status === 'connecting') {
                // If a call is active or starting, ensure we're in calling state
                if (detectorState !== 'calling') {
                  console.log('[WakeWordDetector] Call detected, updating state to calling');
                  // Clear all timeouts to prevent any pending operations
                  clearAllTimeouts();
                  // Set state to calling
                  setDetectorState('calling');
                  // Prevent wake word detection from starting
                  isTransitioningRef.current = true;
                  // Ensure recognition is stopped
                  stopRecognition();
                }
              }
              
              // Notify parent component about status change
              onCallStatusChange?.(status);
            }}
            onMessagesUpdate={(messages) => {
              // Pass messages to parent component
              onMessagesUpdate?.(messages);
            }}
          />
        </div>

        {detectorState === 'error' && (
          <Card className="mb-4 border-red-300">
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center">
                <div className="bg-red-100 p-3 rounded-full mb-4">
                  <MessageSquare className="h-6 w-6 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Microphone Access Denied</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Please allow microphone access to use the voice assistant features.
                </p>
                <Button 
                  onClick={() => {
                    setDetectorState('listening');
                    startWakeWordDetection();
                  }}
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }
);

WakeWordDetector.displayName = 'WakeWordDetector';

export default WakeWordDetector;

// Add TypeScript declarations for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: {
      new(): SpeechRecognition;
      prototype: SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new(): SpeechRecognition;
      prototype: SpeechRecognition;
    };
  }
} 