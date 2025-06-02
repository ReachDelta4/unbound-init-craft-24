import { useCallback, useEffect, useRef, useState } from 'react';

// Connection status types
export type MixedAudioWSStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface BackendMessage {
  type: 'realtime' | 'fullSentence' | string;
  text?: string;
  [key: string]: any;
}

interface UseMixedAudioWebSocketResult {
  status: MixedAudioWSStatus;
  error: string | null;
  liveTranscript: string;
  fullTranscript: string;
  isStreaming: boolean;
  connect: (micStream: MediaStream, systemStream: MediaStream, sampleRate?: number) => void;
  disconnect: () => void;
  reconnectAttempts: number;
  setAutoReconnect: (enabled: boolean) => void;
}

// Maximum number of reconnection attempts
const MAX_RECONNECT_ATTEMPTS = 5;
// Base delay for reconnection in ms (will be multiplied by attempt count for exponential backoff)
const RECONNECT_BASE_DELAY = 1000;

/**
 * React hook for mixing microphone and system audio, streaming to a WebSocket for real-time transcription.
 * Uses AudioWorkletNode for robust, modern audio processing.
 *
 * Usage:
 *   const ws = useMixedAudioWebSocket();
 *   ws.connect(micStream, systemStream, 16000);
 *   // Use ws.status, ws.liveTranscript, ws.fullTranscript, ws.error, ws.isStreaming in UI
 *   ws.disconnect();
 */
export function useMixedAudioWebSocket(): UseMixedAudioWebSocketResult {
  const [status, setStatus] = useState<MixedAudioWSStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [fullTranscript, setFullTranscript] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [autoReconnect, setAutoReconnect] = useState(true);
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const sourceNodesRef = useRef<AudioNode[]>([]);
  const reconnectRef = useRef(false);
  const sampleRateRef = useRef(16000);
  // Store streams for reconnection
  const micStreamRef = useRef<MediaStream | null>(null);
  const systemStreamRef = useRef<MediaStream | null>(null);
  // Store reconnect timer
  const reconnectTimerRef = useRef<number | null>(null);

  // Helper: Convert Float32Array [-1, 1] to Int16Array PCM
  function floatTo16BitPCM(input: Float32Array): Int16Array {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      let s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output;
  }

  // Inline AudioWorkletProcessor code as a string
  const workletProcessorCode = `
    class MixerProcessor extends AudioWorkletProcessor {
      constructor() {
        super();
        this._buffer = [];
        this._bufferSize = 1024; // Tune as needed (was 4096)
        // Default mixing values
        this._micGain = 0.7;    // Microphone gain factor
        this._sysGain = 0.5;    // System audio gain factor
        
        // Listen for messages from main thread to adjust gains
        this.port.onmessage = (event) => {
          if (event.data.micGain !== undefined) {
            this._micGain = event.data.micGain;
          }
          if (event.data.sysGain !== undefined) {
            this._sysGain = event.data.sysGain;
          }
        };
      }
      
      process(inputs, outputs, parameters) {
        // inputs: [ [Float32Array], [Float32Array] ]
        // Input 0 is mic, Input 1 is system audio
        const input0 = inputs[0][0] || new Float32Array(128);
        const input1 = inputs[1][0] || new Float32Array(128);
        const len = Math.max(input0.length, input1.length);
        const mono = new Float32Array(len);
        
        for (let i = 0; i < len; i++) {
          // Apply gain factors to each source, then mix
          const micSample = (input0[i] || 0) * this._micGain;
          const sysSample = (input1[i] || 0) * this._sysGain;
          
          // Mix the audio sources with adjusted gains
          mono[i] = micSample + sysSample;
          
          // Prevent clipping
          if (mono[i] > 1.0) mono[i] = 1.0;
          if (mono[i] < -1.0) mono[i] = -1.0;
        }
        
        // Buffer the mono data
        for (let i = 0; i < mono.length; i++) {
          this._buffer.push(mono[i]);
        }
        
        // When buffer is full, send to main thread
        if (this._buffer.length >= this._bufferSize) {
          this.port.postMessage({ audio: this._buffer.slice(0, this._bufferSize) });
          this._buffer = this._buffer.slice(this._bufferSize);
        }
        
        return true;
      }
    }
    registerProcessor('mixer-processor', MixerProcessor);
  `;

  // Function to attempt reconnection
  const attemptReconnect = useCallback(() => {
    if (!autoReconnect || reconnectAttempts >= MAX_RECONNECT_ATTEMPTS || !micStreamRef.current || !systemStreamRef.current) {
      return;
    }

    // Clear any existing reconnect timer
    if (reconnectTimerRef.current !== null) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    // Calculate delay with exponential backoff
    const delay = RECONNECT_BASE_DELAY * Math.pow(2, reconnectAttempts);
    
    // Set a timer for reconnection
    reconnectTimerRef.current = window.setTimeout(() => {
      setReconnectAttempts(prev => prev + 1);
      connect(micStreamRef.current!, systemStreamRef.current!, sampleRateRef.current);
    }, delay);
  }, [autoReconnect, reconnectAttempts]);

  // Open WebSocket connection and start streaming mixed audio
  const connect = useCallback(
    async (micStream: MediaStream, systemStream: MediaStream, sampleRate: number = 16000) => {
      if (!window.AudioWorkletNode) {
        setStatus('error');
        setError('AudioWorklet is not supported in this browser. Please use a modern browser.');
        return;
      }
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        return;
      }
      setStatus('connecting');
      setError(null);
      setLiveTranscript('');
      setFullTranscript('');
      setIsStreaming(false);
      reconnectRef.current = true;
      
      // Store streams for potential reconnection
      micStreamRef.current = micStream;
      systemStreamRef.current = systemStream;
      sampleRateRef.current = sampleRate;

      // Setup WebSocket
      let ws: WebSocket;
      try {
        ws = new WebSocket('ws://localhost:8012');
        ws.binaryType = 'arraybuffer';
      } catch (err) {
        setStatus('error');
        setError('Failed to connect WebSocket');
        attemptReconnect();
        return;
      }

      ws.onopen = () => {
        setStatus('connected');
        setIsStreaming(true);
        setReconnectAttempts(0); // Reset reconnect attempts on successful connection
      };
      ws.onerror = () => {
        setStatus('error');
        setError('WebSocket error');
        attemptReconnect();
      };
      ws.onclose = () => {
        setStatus('disconnected');
        setIsStreaming(false);
        if (reconnectRef.current && autoReconnect) {
          attemptReconnect();
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

      // Setup AudioContext and mixing
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });
      audioContextRef.current = audioContext;

      // Register the worklet if not already registered
      // (We use a unique name to avoid duplicate registration)
      const workletName = 'mixer-processor';
      const workletBlob = new Blob([workletProcessorCode], { type: 'application/javascript' });
      const workletURL = URL.createObjectURL(workletBlob);
      try {
        // Try to addModule, but ignore error if already registered
        await audioContext.audioWorklet.addModule(workletURL);
      } catch (e) {
        // Already registered or failed
      }
      URL.revokeObjectURL(workletURL);

      // Create source nodes for mic and system
      const micSource = audioContext.createMediaStreamSource(micStream);
      const sysSource = audioContext.createMediaStreamSource(systemStream);
      
      // Create gain nodes with adjusted default values
      const micGain = audioContext.createGain();
      micGain.gain.value = 0.7; // Default mic gain (adjust as needed)
      
      const sysGain = audioContext.createGain();
      sysGain.gain.value = 0.5; // Default system audio gain (adjust as needed)
      
      micSource.connect(micGain);
      sysSource.connect(sysGain);
      sourceNodesRef.current = [micSource, sysSource, micGain, sysGain];

      // Create the AudioWorkletNode for mixing
      const workletNode = new AudioWorkletNode(audioContext, workletName, {
        numberOfInputs: 2,
        numberOfOutputs: 1,
        outputChannelCount: [1],
      });
      workletNodeRef.current = workletNode;
      
      // Send initial gain values to the worklet
      workletNode.port.postMessage({ micGain: 0.7, sysGain: 0.5 });
      
      micGain.connect(workletNode, 0, 0);
      sysGain.connect(workletNode, 0, 1);
      
      // Optionally connect to destination for monitoring (uncomment if needed)
      // workletNode.connect(audioContext.destination);

      // Listen for mixed audio from the worklet
      workletNode.port.onmessage = (event) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        const mono = event.data.audio;
        if (!mono) return;
        const float32 = new Float32Array(mono);
        const pcm16 = floatTo16BitPCM(float32);
        // Prepare metadata
        const metadata = { sampleRate, client_timestamp: Date.now() };
        const metadataJson = JSON.stringify(metadata);
        const metadataBytes = new TextEncoder().encode(metadataJson);
        const metaLen = metadataBytes.length;
        // Prepare buffer: 4 bytes (metaLen LE uint32) + meta + PCM16
        const audioBytes = new Uint8Array(pcm16.buffer);
        const totalLen = 4 + metaLen + audioBytes.length;
        const buffer = new ArrayBuffer(totalLen);
        const view = new DataView(buffer);
        view.setUint32(0, metaLen, true); // Little-endian
        new Uint8Array(buffer, 4, metaLen).set(metadataBytes);
        new Uint8Array(buffer, 4 + metaLen).set(audioBytes);
        wsRef.current.send(buffer);
      };
    },
    [attemptReconnect, autoReconnect]
  );

  // Stop streaming and cleanup
  const disconnect = useCallback(() => {
    reconnectRef.current = false;
    setIsStreaming(false);
    
    // Clear any reconnect timer
    if (reconnectTimerRef.current !== null) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    
    // Reset reconnect attempts
    setReconnectAttempts(0);
    
    // Stop audio processing
    if (workletNodeRef.current) {
      workletNodeRef.current.port.onmessage = null;
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }
    // Disconnect all source nodes
    sourceNodesRef.current.forEach((node) => {
      try {
        node.disconnect();
      } catch {}
    });
    sourceNodesRef.current = [];
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    // Close websocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    // Clear stream references
    micStreamRef.current = null;
    systemStreamRef.current = null;
    
    setStatus('disconnected');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    status,
    error,
    liveTranscript,
    fullTranscript,
    isStreaming,
    connect,
    disconnect,
    reconnectAttempts,
    setAutoReconnect
  };
} 