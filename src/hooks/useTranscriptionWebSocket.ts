import { useCallback, useEffect, useRef, useState } from 'react';

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
      const ws = new WebSocket('ws://localhost:8012');
      ws.onopen = () => {
        setStatus('connected');
        console.log('TranscriptionWebSocket: Connected successfully');
      };
      ws.onerror = () => {
        setStatus('error');
        setError('WebSocket error');
        console.error('TranscriptionWebSocket: Connection error');
      };
      ws.onclose = () => {
        setStatus('disconnected');
        console.log('TranscriptionWebSocket: Connection closed');
      };
      ws.onmessage = (event) => {
        try {
          const msg: BackendMessage = JSON.parse(event.data);
          
          if (msg.type === 'realtime' && msg.text) {
            // Update UI immediately with each partial transcription
            setRealtimeText(msg.text);
            console.log('TranscriptionWebSocket: Received realtime text', msg.text);
          } else if (msg.type === 'fullSentence' && msg.text) {
            // Add the finalized sentence to history
            console.log('TranscriptionWebSocket: Received full sentence', msg.text);
            setFullSentences(prev => {
              const newSentences = [...prev, msg.text];
              console.log('TranscriptionWebSocket: Updated fullSentences', newSentences);
              return newSentences;
            });
          }
        } catch (err) {
          // Ignore malformed messages
          console.error('TranscriptionWebSocket: Error parsing message', err);
        }
      };
      wsRef.current = ws;
    } catch (err) {
      setStatus('error');
      setError('Failed to connect WebSocket');
      console.error('TranscriptionWebSocket: Failed to connect', err);
    }
  }, []);

  // Close WebSocket connection
  const disconnect = useCallback(() => {
    reconnectRef.current = false;
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
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
  };
}
