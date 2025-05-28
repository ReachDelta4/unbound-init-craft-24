import { useCallback, useEffect, useRef, useState } from 'react';

// Connection status types
export type AudioWSStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// Message from backend
interface BackendMessage {
  type: 'realtime' | 'fullSentence' | string;
  text?: string;
  [key: string]: any;
}

interface UseAudioWebSocketResult {
  status: AudioWSStatus;
  error: string | null;
  liveTranscript: string;
  fullTranscript: string;
  connect: (sampleRate: number) => void;
  sendAudioChunk: (chunk: Int16Array, sampleRate: number) => void;
  disconnect: () => void;
}

/**
 * React hook for managing audio WebSocket streaming and transcription.
 *
 * Usage:
 *   const ws = useAudioWebSocket();
 *   ws.connect(sampleRate);
 *   ws.sendAudioChunk(chunk, sampleRate);
 *   ws.disconnect();
 *   // Use ws.status, ws.liveTranscript, ws.fullTranscript, ws.error in UI
 */
export function useAudioWebSocket(): UseAudioWebSocketResult {
  const [status, setStatus] = useState<AudioWSStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [fullTranscript, setFullTranscript] = useState('');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef(false);

  // Open WebSocket connection
  const connect = useCallback((sampleRate: number) => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }
    setStatus('connecting');
    setError(null);
    setLiveTranscript('');
    setFullTranscript('');
    reconnectRef.current = true;
    try {
      const ws = new WebSocket('ws://localhost:8012');
      ws.binaryType = 'arraybuffer';
      ws.onopen = () => {
        setStatus('connected');
      };
      ws.onerror = (e) => {
        setStatus('error');
        setError('WebSocket error');
      };
      ws.onclose = () => {
        setStatus('disconnected');
        if (reconnectRef.current) {
          // Optionally implement auto-reconnect logic here
        }
      };
      ws.onmessage = (event) => {
        try {
          const msg: BackendMessage = JSON.parse(event.data);
          if (msg.type === 'realtime' && msg.text) {
            setLiveTranscript(msg.text);
          } else if (msg.type === 'fullSentence' && msg.text) {
            setFullTranscript((prev) => (prev ? prev + '\n' : '') + msg.text);
          }
        } catch (err) {
          // Ignore malformed messages
        }
      };
      wsRef.current = ws;
    } catch (err) {
      setStatus('error');
      setError('Failed to connect WebSocket');
    }
  }, []);

  // Send audio chunk with metadata
  const sendAudioChunk = useCallback((chunk: Int16Array, sampleRate: number) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    // Metadata
    const metadata = { sampleRate };
    const metadataJson = JSON.stringify(metadata);
    const metadataBytes = new TextEncoder().encode(metadataJson);
    const metaLen = metadataBytes.length;
    // Prepare buffer: 4 bytes (metaLen LE uint32) + meta + PCM16
    const audioBytes = new Uint8Array(chunk.buffer);
    const totalLen = 4 + metaLen + audioBytes.length;
    const buffer = new ArrayBuffer(totalLen);
    const view = new DataView(buffer);
    view.setUint32(0, metaLen, true); // Little-endian
    new Uint8Array(buffer, 4, metaLen).set(metadataBytes);
    new Uint8Array(buffer, 4 + metaLen).set(audioBytes);
    ws.send(buffer);
  }, []);

  // Close WebSocket connection
  const disconnect = useCallback(() => {
    reconnectRef.current = false;
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus('disconnected');
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
    liveTranscript,
    fullTranscript,
    connect,
    sendAudioChunk,
    disconnect,
  };
} 