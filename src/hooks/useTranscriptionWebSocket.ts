import { useCallback, useEffect, useRef, useState } from 'react';
import { useSentenceProcessor } from './useSentenceProcessor';

// Connection status types
export type TranscriptionWSStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// Message from backend
interface BackendMessage {
  type: 'realtime' | 'fullSentence' | string;
  text?: string;
  [key: string]: any;
}

interface UseTranscriptionWebSocketResult {
  status: TranscriptionWSStatus;
  error: string | null;
  realtimeText: string;
  fullSentences: string[];
  fullTranscript: string;
  connect: () => void;
  disconnect: () => void;
  lastGeminiResponse: string | null;
}

/**
 * React hook for managing WebSocket connection for real-time word-by-word transcription.
 *
 * Usage:
 *   const ws = useTranscriptionWebSocket();
 *   ws.connect();
 *   ws.disconnect();
 *   // Use ws.status, ws.realtimeText, ws.fullSentences, ws.error in UI
 */
export function useTranscriptionWebSocket(): UseTranscriptionWebSocketResult {
  const [status, setStatus] = useState<TranscriptionWSStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [realtimeText, setRealtimeText] = useState('');
  const [fullSentences, setFullSentences] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSentenceRef = useRef<string | null>(null);
  
  // Initialize the sentence processor
  const { 
    processSentence, 
    lastResponse: lastGeminiResponse,
    error: geminiError,
    isProcessing
  } = useSentenceProcessor();

  // Keep track of the last sentence we processed to avoid duplicates when using realtime messages
  const lastProcessedSentenceRef = useRef<string | null>(null);

  // Log when the component initializes
  useEffect(() => {
    console.log('TranscriptionWebSocket: Initializing with SentenceProcessor available');
  }, []);

  // If there's an error with Gemini processing, add it to our errors
  useEffect(() => {
    if (geminiError) {
      console.warn('TranscriptionWebSocket: Gemini processing error:', geminiError);
      // Optionally set the error state if you want to display it in the UI
      // setError(prev => prev ? `${prev}; Gemini: ${geminiError}` : `Gemini: ${geminiError}`);
    }
  }, [geminiError]);

  // Log when we get a Gemini response
  useEffect(() => {
    if (lastGeminiResponse) {
      console.log('TranscriptionWebSocket: Received Gemini response:', lastGeminiResponse);
    }
  }, [lastGeminiResponse]);

  // Wraps the processSentence call to avoid duplicate processing
  const triggerProcessing = useCallback((sentence: string) => {
    // Basic check to prevent re-processing identical text
    if (sentence === lastProcessedSentenceRef.current) {
      console.log('TranscriptionWebSocket: Skipping identical sentence:', sentence);
      return;
    }
    console.log('TranscriptionWebSocket: Triggering processing for:', sentence);
    processSentence(sentence)
      .then(() => {
        console.log('TranscriptionWebSocket: Sentence processing initiated successfully for:', sentence);
        lastProcessedSentenceRef.current = sentence;
      })
      .catch(err => console.error('TranscriptionWebSocket: Error initiating sentence processing:', err));
  }, [processSentence]);

  // Compute full transcript from sentences
  const fullTranscript = fullSentences.join('\n');

  // Open WebSocket connection
  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }
    setStatus('connecting');
    setError(null);
    reconnectRef.current = true;
    try {
      console.log('TranscriptionWebSocket: Attempting to connect to WebSocket server at ws://localhost:8012');
      const ws = new WebSocket('ws://localhost:8012');
      ws.onopen = () => {
        setStatus('connected');
        console.log('TranscriptionWebSocket: Connected successfully');
      };
      ws.onerror = (e) => {
        setStatus('error');
        setError('WebSocket error');
        console.error('TranscriptionWebSocket: Connection error', e);
      };
      ws.onclose = (e) => {
        setStatus('disconnected');
        console.log('TranscriptionWebSocket: Connection closed', e.code, e.reason);
      };
      ws.onmessage = (event) => {
        try {
          const msg: BackendMessage = JSON.parse(event.data);
          
          if (msg.type === 'realtime' && msg.text) {
            // Update UI immediately with each partial transcription
            setRealtimeText(msg.text);
            console.log('TranscriptionWebSocket: Received realtime text', msg.text);

            // Detect sentence completion when backend doesn't send explicit fullSentence messages
            const trimmed = msg.text.trim();
            const sentenceComplete = /[.!?]$/; // ends with . ! or ?

            if (sentenceComplete.test(trimmed)) {
              // Avoid processing the same sentence multiple times
              if (trimmed !== lastProcessedSentenceRef.current) {
                console.log('TranscriptionWebSocket: Detected potential sentence (realtime):', trimmed);
                
                // Clear any existing timer to reset the debounce window
                if (debounceTimerRef.current) {
                  clearTimeout(debounceTimerRef.current);
                }

                // Add the potentially temporary sentence to the list for UI responsiveness
                setFullSentences(prev => {
                  // If a similar sentence exists, replace it, otherwise add it.
                  const existingIndex = prev.findIndex(s => trimmed.startsWith(s.slice(0, -1)));
                  if (existingIndex > -1) {
                    const newSentences = [...prev];
                    newSentences[existingIndex] = trimmed;
                    return newSentences;
                  }
                  return [...prev, trimmed];
                });
                
                pendingSentenceRef.current = trimmed;
                
                // Set a timer to process this sentence if no fullSentence arrives
                debounceTimerRef.current = setTimeout(() => {
                  console.log('TranscriptionWebSocket: Debounce timer fired. Processing realtime sentence.');
                  triggerProcessing(trimmed);
                  pendingSentenceRef.current = null; // Clear pending sentence
                }, 750); // 750ms debounce window
              }
            }
          } else if (msg.type === 'fullSentence' && msg.text) {
            // A definitive sentence has arrived.
            console.log('TranscriptionWebSocket: Received full sentence:', msg.text);

            // Clear any pending realtime timer, as this is the "golden" transcript
            if (debounceTimerRef.current) {
              clearTimeout(debounceTimerRef.current);
              console.log('TranscriptionWebSocket: Debounce timer cleared by fullSentence.');
            }

            // If a similar sentence was pending, we can ignore it
            pendingSentenceRef.current = null;
            
            // Process the definitive sentence
            triggerProcessing(msg.text);
            
            // Update the sentence list, replacing any similar realtime sentence
            setFullSentences(prev => {
              const existingIndex = prev.findIndex(s => msg.text.startsWith(s.slice(0, -1)));
              if (existingIndex > -1) {
                const newSentences = [...prev];
                newSentences[existingIndex] = msg.text;
                console.log('TranscriptionWebSocket: Updated fullSentences (replaced), count:', newSentences.length);
                return newSentences;
              }
              const newSentences = [...prev, msg.text];
              console.log('TranscriptionWebSocket: Updated fullSentences (added), count:', newSentences.length);
              return newSentences;
            });

            // Update last processed reference
            lastProcessedSentenceRef.current = msg.text;
          } else {
            console.log('TranscriptionWebSocket: Received unknown message type:', msg.type);
          }
        } catch (err) {
          // Ignore malformed messages
          console.error('TranscriptionWebSocket: Error parsing message:', err);
        }
      };
      wsRef.current = ws;
    } catch (err) {
      setStatus('error');
      setError('Failed to connect WebSocket');
      console.error('TranscriptionWebSocket: Failed to connect:', err);
    }
  }, [processSentence]);

  // Close WebSocket connection
  const disconnect = useCallback(() => {
    reconnectRef.current = false;
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setStatus('disconnected');
    console.log('TranscriptionWebSocket: Disconnected');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      reconnectRef.current = false;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    status,
    error,
    realtimeText,
    fullSentences,
    fullTranscript,
    connect,
    disconnect,
    lastGeminiResponse,
  };
}
