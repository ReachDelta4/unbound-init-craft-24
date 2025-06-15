import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from "@/components/ui/use-toast";

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
export const useTranscriptionWebSocket = (
  onProcessSentence: (sentence: string) => void,
  onRealtimeTranscript?: (transcript: string) => void
) => {
  const { toast } = useToast();
  
  const [status, setStatus] = useState<TranscriptionWSStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [realtimeText, setRealtimeText] = useState('');
  const [fullSentences, setFullSentences] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);

  // Ref for the debounce timer
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Ref to prevent multiple debounce timers during a single utterance
  const isWaitingForUtteranceEnd = useRef<boolean>(false);
  
  // Ref to hold the most recent interim sentence
  const lastInterimSentence = useRef<string>('');

  // Ref to store normalized sentences that have been processed to prevent duplicates
  const processedSentencesRef = useRef<Set<string>>(new Set());
  
  const DEBOUNCE_DELAY = 1500; // ms

  const normalizeSentence = useCallback((sentence: string): string => {
    // Lowercase, trim, and remove all punctuation for better matching.
    return sentence.trim().toLowerCase().replace(/[.,!?-]/g, '');
  }, []);

  const triggerProcessing = useCallback((sentence: string) => {
    const normalized = normalizeSentence(sentence);
    // Prevent processing of empty or already processed sentences.
    if (!normalized || processedSentencesRef.current.has(normalized)) {
      if (normalized) {
        console.log('TranscriptionWebSocket: Skipping already processed sentence:', sentence);
      }
      return;
    }
    
    console.log('TranscriptionWebSocket: Triggering processing for:', sentence);
    processedSentencesRef.current.add(normalized);
    onProcessSentence(sentence);
  }, [onProcessSentence, normalizeSentence]);

  // Function to safely update realtime transcript
  const updateRealtimeTranscript = useCallback((text: string) => {
    // Update internal state
    setRealtimeText(text);
    
    // Call the callback if provided
    if (typeof onRealtimeTranscript === 'function') {
      onRealtimeTranscript(text);
    }
  }, [onRealtimeTranscript]);

  // Open WebSocket connection
  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }
    setStatus('connecting');
    setError(null);
    try {
      console.log('TranscriptionWebSocket: Attempting to connect to WebSocket server at ws://localhost:8012');
      const ws = new WebSocket('ws://localhost:8012');
      ws.onopen = () => {
        setStatus('connected');
        reconnectAttemptsRef.current = 0;
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
          
          if (msg.type === 'realtime' && typeof msg.text === 'string') {
            // The service sends the full interim transcript, so we just replace it.
            lastInterimSentence.current = msg.text;
            updateRealtimeTranscript(msg.text); // Use the safe wrapper function

            // If we are not already waiting for a pause, start a new timer.
            if (!isWaitingForUtteranceEnd.current) {
              isWaitingForUtteranceEnd.current = true;
              
              debounceTimerRef.current = setTimeout(() => {
                const sentenceToProcess = lastInterimSentence.current.trim();
                if (sentenceToProcess) {
                  console.log('TranscriptionWebSocket: Debounce timer fired. Processing interim sentence.');
                  triggerProcessing(sentenceToProcess);
                }
                // The pause is over, reset the flag to allow the next utterance to start a new timer.
                isWaitingForUtteranceEnd.current = false;
                debounceTimerRef.current = null;
              }, DEBOUNCE_DELAY);
            }

          } else if (msg.type === 'fullSentence' && msg.text) {
            console.log('TranscriptionWebSocket: Received full sentence:', msg.text);

            // The definitive sentence has arrived. Cancel any pending interim processing.
            if (debounceTimerRef.current) {
              console.log('TranscriptionWebSocket: Debounce timer cleared by fullSentence.');
              clearTimeout(debounceTimerRef.current);
              debounceTimerRef.current = null;
            }
            
            // This utterance is complete, so reset the flag.
            isWaitingForUtteranceEnd.current = false;
            // Clear the interim UI display.
            updateRealtimeTranscript('');

            // Process the definitive sentence.
            triggerProcessing(msg.text);
            
            setFullSentences(prev => [...prev, msg.text || '']);

          } else if (msg.type === 'error') {
            console.error('TranscriptionWebSocket: Received error:', msg.message);
            setError(msg.message || 'Unknown error from WebSocket');
            setStatus('error');
          } else {
            // console.log("TranscriptionWebSocket: Received unknown message type:", msg.type);
          }
        } catch (err) {
          console.error("TranscriptionWebSocket: Error parsing message", err);
          setError("Failed to parse message from server.");
          setStatus('error');
        }
      };
      wsRef.current = ws;
    } catch (err) {
      setStatus('error');
      setError('Failed to connect WebSocket');
      console.error('TranscriptionWebSocket: Failed to connect:', err);
    }
  }, [triggerProcessing, toast, updateRealtimeTranscript, normalizeSentence, onProcessSentence]);

  // Close WebSocket connection
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setStatus('disconnected');
    console.log('TranscriptionWebSocket: Disconnected');
    
    // Clear processed sentences on disconnect
    processedSentencesRef.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      // Clear processed sentences on unmount
      processedSentencesRef.current.clear();
    };
  }, []);

  // Compute full transcript from sentences
  const fullTranscript = fullSentences.join('\n');

  return {
    status,
    error,
    realtimeText,
    fullSentences,
    fullTranscript,
    connect,
    disconnect,
    lastGeminiResponse: null,
  };
}
