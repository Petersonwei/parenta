'use client'

import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react'
import { useToast } from "@/hooks/use-toast"
import VoiceBot from './VoiceBot'

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

interface Message {
  id: string
  type: 'response' | 'transcription'
  role?: string
  content: string
  timestamp: Date
  isComplete?: boolean
}

interface WakeWordDetectorProps {
  onCallStatusChange?: (status: string) => void;
  onMessagesUpdate?: (messages: Message[]) => void;
  onEndCall?: () => void;
}

export interface WakeWordDetectorRef {
  endCall: () => Promise<void>;
}

const WakeWordDetector = forwardRef<WakeWordDetectorRef, WakeWordDetectorProps>(
  ({ onCallStatusChange, onMessagesUpdate, onEndCall }, ref) => {
    const { toast } = useToast()
    
    // Main state to track what the detector is doing
    const [detectorState, setDetectorState] = useState<DetectorState>('initializing');
    
    // Refs for speech recognition and VoiceBot
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const voiceBotRef = useRef<{ startCall: () => Promise<void>; endCall: () => Promise<void> } | null>(null);
    const noSpeechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const callEndedTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isTransitioningRef = useRef<boolean>(false);
    const isListeningRef = useRef<boolean>(false);
    const isCallEndingRef = useRef<boolean>(false);
    const startCallRef = useRef<() => Promise<void>>(() => Promise.resolve());
    
    // Clear all timeouts to prevent memory leaks
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
    
    // Function to stop recognition safely
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
    
    // Check for browser support and request permissions once on mount
    useEffect(() => {
      if (typeof window === 'undefined') return;
      
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
        
      // Cleanup on unmount
      return () => {
        stopRecognition();
        clearAllTimeouts();
      };
    }, [toast, stopRecognition, clearAllTimeouts]);
    
    // Start/stop recognition based on detector state
    useEffect(() => {
      if (typeof window === 'undefined') return;
      
      console.log('[WakeWordDetector] State changed to:', detectorState);
      
      // Only start recognition when in listening state
      if (detectorState === 'listening' && !isTransitioningRef.current) {
        // Add a small delay before starting to avoid rapid restarts
        restartTimeoutRef.current = setTimeout(() => {
          if (!isListeningRef.current) {
            console.log('[WakeWordDetector] Starting wake word detection from state change');
            startWakeWordDetection();
          } else {
            console.log('[WakeWordDetector] Already listening, not restarting');
          }
        }, 1000);
      } else {
        // For any other state, stop recognition and clear timeouts
        stopRecognition();
        
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
      
      return () => {
        // Only stop recognition and clear restart timeout on cleanup
        // Don't clear callEndedTimeout here
        if (detectorState !== 'listening') {
          stopRecognition();
        }
        
        if (restartTimeoutRef.current) {
          clearTimeout(restartTimeoutRef.current);
          restartTimeoutRef.current = null;
        }
        
        if (noSpeechTimeoutRef.current) {
          clearTimeout(noSpeechTimeoutRef.current);
          noSpeechTimeoutRef.current = null;
        }
      };
    }, [detectorState, clearAllTimeouts, stopRecognition]);
    
    // Function to start a call
    const startCall = useCallback(async () => {
      // Don't start if we're ending a call
      if (isCallEndingRef.current) {
        console.log('[WakeWordDetector] Cannot start call while ending another call');
        return;
      }

      setDetectorState('calling');
      
      if (voiceBotRef.current) {
        try {
          await voiceBotRef.current.startCall();
        } catch (err) {
          console.error('[WakeWordDetector] Error starting call:', err);
          toast({
            title: "Call Error",
            description: "Failed to start call. Please try again.",
            variant: "destructive"
          });
          
          // Go back to listening mode after a delay
          isTransitioningRef.current = true;
          setTimeout(() => {
            setDetectorState('listening');
            setTimeout(() => {
              isTransitioningRef.current = false;
            }, 1000);
          }, 2000);
        }
      }
    }, [toast]);

    // Keep startCallRef current
    useEffect(() => {
      startCallRef.current = startCall;
    }, [startCall]);
    
    // Function to start wake word detection
    const startWakeWordDetection = useCallback(() => {
      if (typeof window === 'undefined') return;
      
      // Don't start if already listening or transitioning
      if (isListeningRef.current || isTransitioningRef.current) {
        console.log('[WakeWordDetector] Already listening or transitioning, not starting');
        return;
      }
      
      // Don't start if we're in a call
      if (detectorState !== 'listening') {
        console.log('[WakeWordDetector] Not in listening state, not starting');
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
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        // Clear the no-speech timeout since we got a result
        if (noSpeechTimeoutRef.current) {
          clearTimeout(noSpeechTimeoutRef.current);
          noSpeechTimeoutRef.current = null;
        }
        
        // Don't process results if we're transitioning states
        if (isTransitioningRef.current) return;
        
        const transcript = Array.from(event.results)
          .map((result: SpeechRecognitionResult) => result[0].transcript.toLowerCase())
          .join(' ');
        
        // Only log if there's meaningful content to reduce console spam
        if (transcript.trim().length > 0) {
          console.log('[WakeWordDetector] Heard:', transcript);
        }
        
        // More lenient wake word detection - check for partial matches
        const detectWakeWord = (text: string) => {
          // Check for exact matches first
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
    
    // Function to handle call end
    const handleCallEnd = () => {
      console.log('[WakeWordDetector] Call ended, resuming wake word detection');
      
      // Set transitioning flag to prevent premature restart
      isTransitioningRef.current = true;
      
      // Clear any existing timeouts
      clearAllTimeouts();

      // Notify parent about call end
      onCallStatusChange?.('ended');
      onEndCall?.();
      
      // Wait a moment before resuming detection
      callEndedTimeoutRef.current = setTimeout(() => {
        console.log('[WakeWordDetector] Resuming wake word detection after call');
        setDetectorState('listening');
        
        // Force restart the recognition after a delay
        setTimeout(() => {
          isTransitioningRef.current = false;
          
          // Ensure we're not already listening
          if (!isListeningRef.current) {
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

    // Function to end call
    const endCall = useCallback(async () => {
      if (isCallEndingRef.current) {
        console.log('[WakeWordDetector] Call is already ending, ignoring request');
        return;
      }

      isCallEndingRef.current = true;
      console.log('[WakeWordDetector] Starting call end process');

      try {
        // Stop recognition first
        stopRecognition();
        clearAllTimeouts();

        // Update state to reflect we're ending the call
        setDetectorState('listening');

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

        // Reset all states
        isCallEndingRef.current = false;
        isTransitioningRef.current = false;
        isListeningRef.current = false;

        // Start wake word detection again after a delay
        setTimeout(() => {
          if (!isTransitioningRef.current && !isListeningRef.current) {
            console.log('[WakeWordDetector] Restarting wake word detection after call end');
            startWakeWordDetection();
          }
        }, 2000);

      } catch (err) {
        console.error('[WakeWordDetector] Error during call end:', err);
        // Even if there's an error, try to reset states and notify parent
        isCallEndingRef.current = false;
        isTransitioningRef.current = false;
        isListeningRef.current = false;
        setDetectorState('listening');
        onCallStatusChange?.('ended');
        onEndCall?.();
      }
    }, [onCallStatusChange, onEndCall, stopRecognition, clearAllTimeouts, startWakeWordDetection]);

    // Expose endCall via ref
    useImperativeHandle(ref, () => ({
      endCall
    }), [endCall]);

    // Helper function to render status text based on detector state
    const getStatusText = (state: DetectorState): string => {
      switch (state) {
        case 'initializing': return 'Initializing...';
        case 'listening': return 'Listening for Hi Anna';
        case 'detected': return 'Wake word detected!';
        case 'calling': return 'In call';
        case 'error': return 'Error';
      }
    };
    
    // Render different UI based on detector state
    return (
      <div className="wake-word-detector">
        <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-white border border-gray-200 rounded-md shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-blue-700">Wake Word Status</h2>
            <p className="text-xs sm:text-sm text-gray-600">
              {getStatusText(detectorState)}
            </p>
          </div>
          <div className="flex items-center justify-end">
            {detectorState === 'error' ? (
              <span className="text-xs sm:text-sm text-red-500">Microphone access denied</span>
            ) : (
              <>
                <div 
                  className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full mr-2 ${
                    detectorState === 'listening' && isListeningRef.current
                      ? 'bg-green-500' 
                      : detectorState === 'listening' && !isListeningRef.current
                        ? 'bg-yellow-500'
                        : detectorState === 'calling'
                          ? 'bg-blue-500'
                          : detectorState === 'detected'
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                  }`} 
                />
                <span className="text-xs sm:text-sm font-medium text-gray-700">
                  {detectorState === 'listening' && isListeningRef.current
                    ? 'Active' 
                    : detectorState === 'listening' && !isListeningRef.current
                      ? 'Reconnecting...'
                      : detectorState === 'calling'
                        ? 'In Call'
                        : detectorState === 'detected'
                          ? 'Detected!'
                          : 'Initializing...'}
                </span>
              </>
            )}
            {/* Restart button shown when there's an error */}
            {detectorState === 'error' && (
              <button
                className="ml-3 sm:ml-4 px-2 sm:px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                onClick={() => {
                  setDetectorState('listening');
                  startWakeWordDetection();
                }}
              >
                Restart
              </button>
            )}
          </div>
        </div>
        
        <VoiceBot 
          ref={voiceBotRef}
          onCallStatusChange={(status) => {
            console.log('[WakeWordDetector] Call status changed:', status);
            if (status === 'ended' || status === 'error') {
              handleCallEnd();
            } else if (status === 'ongoing' || status === 'connecting') {
              // If a call is started manually, update our state
              if (detectorState !== 'calling') {
                console.log('[WakeWordDetector] Manual call detected, updating state');
                stopRecognition();
                clearAllTimeouts();
                setDetectorState('calling');
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