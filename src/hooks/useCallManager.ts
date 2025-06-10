
import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useMixedAudioWebSocket } from '@/hooks/useMixedAudioWebSocket';

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

  const [connectionTimedOut, setConnectionTimedOut] = useState(false);
  const micStreamRef = useRef<MediaStream | null>(null);
  const systemStreamRef = useRef<MediaStream | null>(null);

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
      
      // Create silent system audio fallback if needed
      if (!systemStreamRef.current?.getAudioTracks().length) {
        console.warn('No system audio track found, creating silent fallback');
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const silentOsc = audioContext.createOscillator();
          const silentGain = audioContext.createGain();
          silentGain.gain.value = 0;
          silentOsc.connect(silentGain);
          
          const silentDest = audioContext.createMediaStreamDestination();
          silentGain.connect(silentDest);
          silentOsc.start();
          
          systemStreamRef.current = silentDest.stream;
          console.log('CallManager: Silent system audio stream created');
        } catch (audioError) {
          console.error('Failed to create silent audio stream:', audioError);
          systemStreamRef.current = new MediaStream();
        }
      }
      
      console.log('Audio Tracks prepared for WebSocket:', {
        mic: micStreamRef.current?.getAudioTracks().map(t => t.label) || [],
        system: systemStreamRef.current?.getAudioTracks().map(t => t.label) || []
      });
      
      setTimeout(() => {
        if (micStreamRef.current && systemStreamRef.current) {
          console.log('CallManager: Starting transcription websocket...');
          connectMixedAudio(micStreamRef.current, systemStreamRef.current, 16000);
        } else {
          console.error('Failed to prepare audio streams for websocket');
        }
      }, 1000);
      
      toast({
        title: "Call started",
        description: "Screen sharing and transcription are now active.",
      });
      
    } catch (error) {
      console.error('Error starting call:', error);
      
      stopScreenShare();
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
        micStreamRef.current = null;
      }
      if (systemStreamRef.current) {
        systemStreamRef.current.getTracks().forEach(track => track.stop());
        systemStreamRef.current = null;
      }
      
      toast({
        title: "Failed to start call",
        description: webRTCError || (error instanceof Error ? error.message : "Please make sure you have granted screen sharing permissions."),
        variant: "destructive",
      });
    }
  }, [startScreenShare, webRTCError, connectMixedAudio, extractAudioStreams, setAutoReconnect, stopScreenShare, toast]);

  const endCall = useCallback(() => {
    disconnectMixedAudio();
    stopScreenShare();
    
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => {
        console.log(`Explicitly stopping mic track: ${track.kind} - ${track.label}`);
        track.stop();
      });
      micStreamRef.current = null;
    }
    
    if (systemStreamRef.current) {
      systemStreamRef.current.getTracks().forEach(track => {
        console.log(`Explicitly stopping system track: ${track.kind} - ${track.label}`);
        track.stop();
      });
      systemStreamRef.current = null;
    }
  }, [disconnectMixedAudio, stopScreenShare]);

  const reconnectTranscription = useCallback(() => {
    if (micStreamRef.current && systemStreamRef.current) {
      disconnectMixedAudio();
      setTimeout(() => {
        connectMixedAudio(micStreamRef.current!, systemStreamRef.current!, 16000);
      }, 500);
    }
  }, [disconnectMixedAudio, connectMixedAudio]);

  return {
    // WebRTC state
    isScreenSharing,
    webRTCStream,
    webRTCError,
    
    // WebSocket state
    wsStatus,
    wsError,
    liveTranscript,
    fullTranscript,
    isStreaming,
    
    // Connection state
    connectionTimedOut,
    setConnectionTimedOut,
    
    // Actions
    startCall,
    endCall,
    reconnectTranscription,
    handleConnectionTimeout,
    
    // Stream refs
    micStreamRef,
    systemStreamRef
  };
};
