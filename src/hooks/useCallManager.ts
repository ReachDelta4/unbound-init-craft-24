import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useMixedAudioWebSocket } from '@/hooks/useMixedAudioWebSocket';
import { useTranscriptionWebSocket } from '@/hooks/useTranscriptionWebSocket';

export const useCallManager = () => {
  const { toast } = useToast();
  const {
    startScreenShare,
    stopScreenShare,
    isScreenSharing,
    stream: webRTCStream,
    error: webRTCError
  } = useWebRTC();

  const {
    status: wsStatus,
    error: wsError,
    liveTranscript,
    fullTranscript,
    isStreaming,
    connect: connectMixedAudio,
    disconnect: disconnectMixedAudio,
    reconnectAttempts,
    setAutoReconnect
  } = useMixedAudioWebSocket();

  // Transcription and Gemini processing
  const {
    lastGeminiResponse,
    connect: connectTranscription,
    disconnect: disconnectTranscription
  } = useTranscriptionWebSocket();

  // State for insights
  const [insights, setInsights] = useState({
    emotions: [
      { emotion: "Interest", level: 75 },
      { emotion: "Concern", level: 30 },
      { emotion: "Enthusiasm", level: 45 },
      { emotion: "Skepticism", level: 20 }
    ],
    painPoints: [
      "Current solution is too complex to implement",
      "Training the team takes too much time"
    ],
    objections: [
      "Price seems higher than competitors",
      "Concerned about implementation timeline"
    ],
    recommendations: [
      "Demonstrate ROI calculation",
      "Offer implementation support options"
    ],
    nextActions: [
      "Schedule technical demo",
      "Send case study on similar implementation"
    ]
  });
  
  const [clientEmotion, setClientEmotion] = useState<string>("Interest");
  const [clientInterest, setClientInterest] = useState<number>(75);
  const [callStage, setCallStage] = useState<string>("Discovery");
  const [aiCoachingSuggestion, setAiCoachingSuggestion] = useState<string>(
    "Ask about their current workflow and pain points to better understand their needs."
  );

  const [connectionTimedOut, setConnectionTimedOut] = useState(false);
  const [isProcessingSentence, setIsProcessingSentence] = useState(false);
  const micStreamRef = useRef<MediaStream | null>(null);
  const systemStreamRef = useRef<MediaStream | null>(null);
  const lastSentenceRef = useRef<string | null>(null);
  const sentenceQueueRef = useRef<string[]>([]);

  // Track the last processed sentence to avoid duplicates
  const [processedSentences, setProcessedSentences] = useState<Set<string>>(new Set());

  // Log when we get a new Gemini response
  useEffect(() => {
    if (lastGeminiResponse) {
      console.log('CallManager: New Gemini response for transcribed sentence:', lastGeminiResponse);
    }
  }, [lastGeminiResponse]);

  // Define extractAudioStreams before it's used in startCall
  const extractAudioStreams = useCallback((combinedStream: MediaStream) => {
    const audioTracks = combinedStream.getAudioTracks();
    
    micStreamRef.current = null;
    systemStreamRef.current = null;
    
    if (audioTracks.length === 0) {
      console.warn('No audio tracks found in the combined stream');
      micStreamRef.current = new MediaStream();
      systemStreamRef.current = new MediaStream();
      return;
    }
    
    if (audioTracks.length === 1) {
      console.log('Only one audio track found, using it for both mic and system');
      const singleTrack = audioTracks[0];
      micStreamRef.current = new MediaStream([singleTrack]);
      systemStreamRef.current = new MediaStream([singleTrack.clone()]);
      return;
    }
    
    const micTrack = audioTracks[0];
    const systemTrack = audioTracks[1];
    
    const isMicTrack = (track: MediaStreamTrack) => 
      track.label.toLowerCase().includes('microphone') || 
      track.label.toLowerCase().includes('mic');
      
    const isSystemTrack = (track: MediaStreamTrack) => 
      track.label.toLowerCase().includes('system') || 
      track.label.toLowerCase().includes('screen') ||
      track.label.toLowerCase().includes('display');
    
    if (isMicTrack(micTrack) && isSystemTrack(systemTrack)) {
      micStreamRef.current = new MediaStream([micTrack]);
      systemStreamRef.current = new MediaStream([systemTrack]);
    } else if (isMicTrack(systemTrack) && isSystemTrack(micTrack)) {
      micStreamRef.current = new MediaStream([systemTrack]);
      systemStreamRef.current = new MediaStream([micTrack]);
    } else {
      console.log('Using default track order: track[0]=mic, track[1]=system');
      micStreamRef.current = new MediaStream([micTrack]);
      systemStreamRef.current = new MediaStream([systemTrack]);
    }
    
    console.log('Extracted audio tracks:', {
      micTrack: micStreamRef.current?.getAudioTracks()[0]?.label,
      systemTrack: systemStreamRef.current?.getAudioTracks()[0]?.label
    });
  }, []);

  const handleConnectionTimeout = useCallback(() => {
    setConnectionTimedOut(true);
    toast({
      title: "Connection Issue",
      description: "Could not connect to the transcription service. You can continue, but transcription will not be available.",
      variant: "destructive",
    });
    setAutoReconnect(false);
  }, [toast, setAutoReconnect]);

  const startCall = useCallback(async (callType: string, startMeeting: (type: string) => Promise<void>, user: any) => {
    if (!callType || !user) return;
    
    console.log('CallManager: Starting call process...');
    
    try {
      setConnectionTimedOut(false);
      setAutoReconnect(true);
      
      // Reset sentence tracking on new call
      lastSentenceRef.current = null;
      sentenceQueueRef.current = [];
      setProcessedSentences(new Set());
      setIsProcessingSentence(false);
      
      // Reset insights to defaults
      setInsights({
        emotions: [
          { emotion: "Interest", level: 75 },
          { emotion: "Concern", level: 30 },
          { emotion: "Enthusiasm", level: 45 },
          { emotion: "Skepticism", level: 20 }
        ],
        painPoints: [
          "Current solution is too complex to implement",
          "Training the team takes too much time"
        ],
        objections: [
          "Price seems higher than competitors",
          "Concerned about implementation timeline"
        ],
        recommendations: [
          "Demonstrate ROI calculation",
          "Offer implementation support options"
        ],
        nextActions: [
          "Schedule technical demo",
          "Send case study on similar implementation"
        ]
      });
      setClientEmotion("Interest");
      setClientInterest(75);
      setCallStage("Discovery");
      setAiCoachingSuggestion("Ask about their current workflow and pain points to better understand their needs.");
      
      console.log('CallManager: Starting meeting in database...');
      await startMeeting(callType);
      console.log('CallManager: Meeting started in database');
      
      console.log('CallManager: Requesting screen share...');
      const combinedStream = await startScreenShare();
      
      if (!combinedStream) {
        throw new Error('Failed to get screen share stream');
      }
      
      console.log('CallManager: Screen share started successfully, stream:', {
        id: combinedStream.id,
        videoTracks: combinedStream.getVideoTracks().length,
        audioTracks: combinedStream.getAudioTracks().length,
        active: combinedStream.active,
        videoTrackStates: combinedStream.getVideoTracks().map(t => ({
          label: t.label,
          enabled: t.enabled,
          readyState: t.readyState
        }))
      });
      
      extractAudioStreams(combinedStream);
      
      // Setup microphone fallback if needed
      if (!micStreamRef.current?.getAudioTracks().length) {
        console.warn('No microphone audio track found, attempting to get mic access separately');
        try {
          const micOnlyStream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
          micStreamRef.current = micOnlyStream;
          console.log('CallManager: Separate microphone stream acquired');
        } catch (micError) {
          console.error('Failed to get microphone access:', micError);
          toast({
            title: "Microphone access failed",
            description: "We couldn't access your microphone. Audio transcription may be limited.",
            variant: "destructive",
          });
        }
      }

      // Connect to audio websocket
      console.log('CallManager: Connecting to audio websocket...');
      console.log('CallManager: Audio WebSocket state:', { wsStatus, reconnectAttempts });
      
      // Start a connection timeout
      const connectionTimeoutId = setTimeout(() => {
        if (wsStatus !== 'connected') {
          handleConnectionTimeout();
        }
      }, 10000);
      
      // Ensure we have valid MediaStream objects (fallback to empty streams)
      const micStreamSafe = micStreamRef.current ?? new MediaStream();
      const sysStreamSafe = systemStreamRef.current ?? new MediaStream();
      await connectMixedAudio(micStreamSafe, sysStreamSafe);
      console.log('CallManager: Connected to mixed audio WebSocket');
      
      // Also connect to the transcription WebSocket
      connectTranscription();
      console.log('CallManager: Connected to transcription WebSocket');
      
      // Clear the timeout if we got here
      clearTimeout(connectionTimeoutId);
      
    } catch (error) {
      console.error('CallManager: Error starting call:', error);
      toast({
        title: "Call Start Failed",
        description: error instanceof Error ? error.message : "Failed to start call.",
        variant: "destructive",
      });
      
      // End the meeting in the database too (cleanup)
      try {
        console.log('CallManager: Cleaning up failed meeting...');
        // Implement cleanup logic here if needed
      } catch (cleanupError) {
        console.error('CallManager: Cleanup error:', cleanupError);
      }
    }
    
  }, [connectMixedAudio, startScreenShare, wsStatus, reconnectAttempts, toast, handleConnectionTimeout, setAutoReconnect, connectTranscription]);
  
  // End call and disconnect all streams
  const endCall = useCallback(() => {
    console.log('CallManager: Ending call...');
    
    try {
      // Stop screen share
      stopScreenShare();

      // Close WebSocket connections
      disconnectMixedAudio();
      disconnectTranscription();
      
      // Reset audio streams
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
        micStreamRef.current = null;
      }
      
      if (systemStreamRef.current) {
        systemStreamRef.current.getTracks().forEach(track => track.stop());
        systemStreamRef.current = null;
      }
      
      // Reset state
      lastSentenceRef.current = null;
      sentenceQueueRef.current = [];
      setProcessedSentences(new Set());
      setIsProcessingSentence(false);
      setConnectionTimedOut(false);
    } catch (error) {
      console.error('CallManager: Error ending call:', error);
    }
  }, [stopScreenShare, disconnectMixedAudio, disconnectTranscription]);
  
  // Reconnect the WebSocket connection
  const reconnectTranscription = useCallback(() => {
    console.log('CallManager: Attempting to reconnect to WebSockets...');
    setConnectionTimedOut(false);
    setAutoReconnect(true);
    const micStreamSafe2 = micStreamRef.current ?? new MediaStream();
    const sysStreamSafe2 = systemStreamRef.current ?? new MediaStream();
    connectMixedAudio(micStreamSafe2, sysStreamSafe2);
    connectTranscription();
  }, [connectMixedAudio, setAutoReconnect, connectTranscription]);
  
  return {
    // WebRTC
    isScreenSharing,
    webRTCStream,
    webRTCError,
    
    // WebSocket
    wsStatus, 
    wsError,
    liveTranscript,
    fullTranscript,
    isStreaming,
    reconnectAttempts,
    
    // Call actions
    startCall,
    endCall,
    reconnectTranscription,
    
    // Refs
    micStreamRef,
    systemStreamRef,
    
    // Connection state
    connectionTimedOut,
    setConnectionTimedOut,
    handleConnectionTimeout,
    
    // AI-generated insights
    insights,
    clientEmotion,
    clientInterest,
    callStage,
    aiCoachingSuggestion,
    lastGeminiResponse
  };
};
