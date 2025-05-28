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
}

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
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const sourceNodesRef = useRef<AudioNode[]>([]);
  const reconnectRef = useRef(false);
  const sampleRateRef = useRef(16000);

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
        this._bufferSize = 4096; // Tune as needed
      }
      process(inputs, outputs, parameters) {
        // inputs: [ [Float32Array], [Float32Array] ]
        // We'll mix all input channels into mono
        const input0 = inputs[0][0] || new Float32Array(128);
        const input1 = inputs[1][0] || new Float32Array(128);
        const len = Math.max(input0.length, input1.length);
        const mono = new Float32Array(len);
        for (let i = 0; i < len; i++) {
          mono[i] = ((input0[i] || 0) + (input1[i] || 0)) / 2;
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
      sampleRateRef.current = sampleRate;

      // Setup WebSocket
      let ws: WebSocket;
      try {
        ws = new WebSocket('ws://localhost:8012');
        ws.binaryType = 'arraybuffer';
      } catch (err) {
        setStatus('error');
        setError('Failed to connect WebSocket');
        return;
      }

      ws.onopen = () => {
        setStatus('connected');
        setIsStreaming(true);
      };
      ws.onerror = () => {
        setStatus('error');
        setError('WebSocket error');
      };
      ws.onclose = () => {
        setStatus('disconnected');
        setIsStreaming(false);
        if (reconnectRef.current) {
          // Optionally implement auto-reconnect here
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
      // Optionally, you can adjust gain for each source
      const micGain = audioContext.createGain();
      micGain.gain.value = 1.0;
      const sysGain = audioContext.createGain();
      sysGain.gain.value = 1.0;
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
      micGain.connect(workletNode, 0, 0);
      sysGain.connect(workletNode, 0, 1);
      // Optionally connect to destination for monitoring (muted)
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
    []
  );

  // Stop streaming and cleanup
  const disconnect = useCallback(() => {
    reconnectRef.current = false;
    setIsStreaming(false);
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
  };
} 