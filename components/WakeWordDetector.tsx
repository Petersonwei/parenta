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
  maxAlternatives?: number;
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
    
    // Add a flag to track if microphone permission has already been requested
    const hasMicPermissionRef = useRef<boolean>(false);
    
    // Add a flag to track if an API call is in progress
    const isApiCallingRef = useRef<boolean>(false);
    
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
     * Safe wrapper for API calls to prevent rapid multiple requests
     * This helps prevent crashes especially on mobile browsers
     */
    const safeApiCall = useCallback(async <T,>(
      apiCall: () => Promise<T>, 
      errorMessage: string
    ): Promise<T | null> => {
      // Don't start if already calling
      if (isApiCallingRef.current) {
        console.log('[WakeWordDetector] API call already in progress, skipping');
        return null;
      }
      
      try {
        isApiCallingRef.current = true;
        return await apiCall();
      } catch (err) {
        console.error(`[WakeWordDetector] ${errorMessage}:`, err);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
        return null;
      } finally {
        // Set a small delay before allowing the next call
        setTimeout(() => {
          isApiCallingRef.current = false;
        }, 1000);
      }
    }, [toast]);
    
    /**
     * Starts the wake word detection process
     * - Creates a new SpeechRecognition instance
     * - Sets up event handlers for speech recognition
     * - Handles wake word detection logic
     */
    const startWakeWordDetection = useCallback(() => {
      if (typeof window === 'undefined') return;
      
      // Don't start if already listening or transitioning
      if (isListeningRef.current || isTransitioningRef.current || isApiCallingRef.current) {
        console.log('[WakeWordDetector] Already listening, transitioning, or API calling - not starting');
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
      
      // Detect mobile device - these need special handling
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      try {
        // Create a new recognition instance
        const recognition = new SpeechRecognition();
        recognition.continuous = false; // Keep false to reduce lag
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        // Use shorter recognition times on mobile to prevent resource issues
        if (isMobile) {
          recognition.maxAlternatives = 1; // Reduce processing on mobile
        }
        
        // Store reference
        recognitionRef.current = recognition;
        
        // Set up event handlers
        recognition.onstart = () => {
          console.log('[WakeWordDetector] Started listening for wake word');
          isListeningRef.current = true;
          
          // Set a shorter timeout for mobile devices
          const timeoutDuration = isMobile ? 8000 : 15000; // Increased from 5000/10000 to make listening time longer
          
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
              }, 200); // Decreased from 500ms to make refetching gap shorter
            }
          }, timeoutDuration);
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
              }, 200); // Decreased from 500ms to make refetching gap shorter
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
              }, 300); // Decreased from 1000ms to make refetching gap shorter
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
            }, 200); // Decreased from 500ms to make refetching gap shorter
          }
        };
        
        // Process speech recognition results
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
        
        // Start listening with error handling
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
            }, isMobile ? 1000 : 300); // Decreased from 2000/1000 to make refetching gap shorter
          }
        }
      } catch (err) {
        console.error('[WakeWordDetector] Error setting up recognition:', err);
        recognitionRef.current = null;
        isListeningRef.current = false;
        
        // On critical errors, try a few times and then give up to prevent crashes
        if (!isTransitioningRef.current) {
          restartTimeoutRef.current = setTimeout(() => {
            if (detectorState === 'listening' && !isTransitioningRef.current && !isListeningRef.current) {
              startWakeWordDetection();
            }
          }, isMobile ? 1500 : 300); // Decreased from 3000/1000 to make refetching gap shorter
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
      
      // Only request permission once to avoid multiple permission prompts
      if (hasMicPermissionRef.current) {
        console.log('[WakeWordDetector] Microphone permission already granted, skipping request');
        setDetectorState('listening');
        return;
      }
      
      // Request microphone permission with specific constraints
      // Some mobile browsers need exact constraints
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };
      
      // Use try-catch to handle permission request failures
      try {
        navigator.mediaDevices.getUserMedia(constraints)
          .then(() => {
            console.log('[WakeWordDetector] Microphone permission granted');
            // Mark that permission has been granted
            hasMicPermissionRef.current = true;
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
      } catch (err) {
        console.error('[WakeWordDetector] Error requesting microphone:', err);
        toast({
          title: "Microphone Error",
          description: "There was an issue accessing your microphone. Please try again.",
          variant: "destructive"
        });
        setDetectorState('error');
      }
        
      // Cleanup on unmount
      return () => {
        stopRecognition();
        clearAllTimeouts();
      };
    }, [toast, stopRecognition, clearAllTimeouts, detectorState]);
    
    /**
     * Set up event listener for manual start via the Start Conversation button
     */
    useEffect(() => {
      if (typeof window === 'undefined') return;
      
      // Add event listener for manual start
      const handleStartConversation = () => {
        console.log('[WakeWordDetector] Received startConversation event');
        // Always handle the event regardless of current state
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
      };
      
      console.log('[WakeWordDetector] Adding startConversation event listener');
      window.addEventListener('startConversation', handleStartConversation);
      
      // Cleanup on unmount
      return () => {
        console.log('[WakeWordDetector] Removing startConversation event listener');
        window.removeEventListener('startConversation', handleStartConversation);
      };
    }, [stopRecognition, clearAllTimeouts]);
    
    /**
     * Manages speech recognition based on detector state
     * - Starts recognition when in 'listening' state
     * - Stops recognition in other states
     */
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [detectorState, clearAllTimeouts, stopRecognition]);
    
    /**
     * Initiates a call using the VoiceBot component
     * Called when wake word is detected
     */
    const startCall = useCallback(async () => {
      // Don't start if we're ending a call
      if (isCallEndingRef.current) {
        console.log('[WakeWordDetector] Cannot start call while ending another call');
        return;
      }

      setDetectorState('calling');
      
      // Release speech recognition resources before starting call
      // This is important on mobile to prevent resource conflicts
      stopRecognition();
      clearAllTimeouts();
      
      // Check if VoiceBot ref is available
      if (!voiceBotRef.current) {
        console.error('[WakeWordDetector] VoiceBot reference not available');
        toast({
          title: "Call Error",
          description: "Voice system not initialized. Please try again.",
          variant: "destructive"
        });
        isTransitioningRef.current = true;
        setTimeout(() => {
          setDetectorState('listening');
          setTimeout(() => {
            isTransitioningRef.current = false;
          }, 1000);
        }, 2000);
        return;
      }
      
      // Use safeApiCall to prevent multiple rapid API calls
      const result = await safeApiCall(
        async () => {
          // Start the call with timeout protection
          const callPromise = voiceBotRef.current!.startCall();
          
          // Add a timeout to prevent hanging if startCall never resolves
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Call start timeout')), 10000);
          });
          
          // Race the call start against the timeout
          return await Promise.race([callPromise, timeoutPromise]);
        },
        "Failed to start call. Please try again."
      );
      
      // If the API call failed, go back to listening
      if (result === null) {
        isTransitioningRef.current = true;
        setTimeout(() => {
          setDetectorState('listening');
          setTimeout(() => {
            isTransitioningRef.current = false;
          }, 1000);
        }, 2000);
      }
    }, [toast, stopRecognition, clearAllTimeouts, safeApiCall]);

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
            }, 200); // Decreased from 500ms to make refetching gap shorter
          }
        }, 500); // Reduced from 1000ms for faster response after call
      }, 1000); // Reduced from 2000ms for faster recovery after call ends
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
        }, 500); // Adjusted from previously changed 200ms to 500ms to allow for state cleanup

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

    // Expose endCall method via ref for parent components to use
    useImperativeHandle(ref, () => ({
      endCall
    }), [endCall]);

    /**
     * Helper function to render status text based on detector state
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const getStatusText = (state: DetectorState): string => {
      switch (state) {
        case 'initializing': return 'Initializing...';
        case 'listening': return 'Listening for "Hey Anna"';
        case 'detected': return 'Wake word detected!';
        case 'calling': return 'In call';
        case 'error': return 'Error';
      }
    };
    
    /**
     * Button click handler for Try Again
     * Handle this more carefully to prevent rapid restarting on mobile
     */
    const handleTryAgainClick = useCallback(() => {
      // Prevent multiple rapid clicks
      if (isApiCallingRef.current) {
        console.log('[WakeWordDetector] API call in progress, ignoring click');
        return;
      }
      
      // Reset permission flag to try again
      hasMicPermissionRef.current = false;
      
      // Set state to initializing to re-trigger permission flow
      setDetectorState('initializing');
      
      // After a delay, check if we're still in initializing and move to listening
      // This is a fallback in case the permission flow doesn't trigger
      setTimeout(() => {
        if (detectorState === 'initializing') {
          setDetectorState('listening');
        }
      }, 3000);
    }, [detectorState]);
    
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
                  onClick={handleTryAgainClick}
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