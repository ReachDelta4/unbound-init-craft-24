import { useState, useCallback, useRef, useEffect } from 'react';

interface WebRTCState {
  isScreenSharing: boolean;
  isAudioEnabled: boolean;
  stream: MediaStream | null;
  error: string | null;
}

export const useWebRTC = () => {
  const [state, setState] = useState<WebRTCState>({
    isScreenSharing: false,
    isAudioEnabled: false,
    stream: null,
    error: null,
  });

  // Keep a ref to the original screen stream
  const screenStreamRef = useRef<MediaStream | null>(null);
  // Keep a ref to the latest stopScreenShare function for use in event handlers
  const stopScreenShareRef = useRef<() => void>(() => {});

  // Stop all tracks in both the combined and original screen stream
  const stopScreenShare = useCallback(() => {
    console.log("Stopping screen share...");
    
    if (state.stream) {
      state.stream.getTracks().forEach(track => {
        console.log(`Stopping track: ${track.kind} - ${track.label}`);
        track.stop();
      });
    }
    
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => {
        console.log(`Stopping original track: ${track.kind} - ${track.label}`);
        track.stop();
      });
      screenStreamRef.current = null;
    }
    
    setState({
      isScreenSharing: false,
      isAudioEnabled: false,
      stream: null,
      error: null,
    });
    
    console.log("Screen share stopped");
  }, [state.stream]);
  stopScreenShareRef.current = stopScreenShare;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("WebRTC hook unmounting, cleaning up streams");
      stopScreenShareRef.current();
    };
  }, []);

  const startScreenShare = useCallback(async () => {
    // Always stop any existing screen share before starting a new one
    stopScreenShareRef.current();
    try {
      console.log("Requesting screen capture...");
      
      // Use simple getDisplayMedia call first for maximum compatibility
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      
      // Check if video track exists and is active
      const videoTracks = screenStream.getVideoTracks();
      if (videoTracks.length === 0) {
        console.warn('No video track found in screen share, but continuing anyway');
      }
      
      // Log video track information for debugging
      console.log('Screen share video tracks:', videoTracks.map(track => ({
        label: track.label,
        enabled: track.enabled,
        readyState: track.readyState
      })));
      
      // Log audio track information for debugging
      console.log('Screen share audio tracks:', screenStream.getAudioTracks().map(track => ({
        label: track.label,
        enabled: track.enabled,
        readyState: track.readyState
      })));
      
      screenStreamRef.current = screenStream;
      
      // Save the original stream in case we need it for error recovery
      const stream = screenStream;
      
      // Set state with this stream immediately to avoid delay
      setState({
        isScreenSharing: true,
        isAudioEnabled: screenStream.getAudioTracks().length > 0,
        stream: stream,
        error: null,
      });

      // Add event listener for when screen sharing ends
      if (videoTracks.length > 0) {
        videoTracks[0].onended = () => {
          console.log("Screen share ended by user");
          stopScreenShareRef.current();
        };
      }

      return stream;
    } catch (error) {
      console.error("Screen share error:", error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start screen sharing',
      }));
      throw error;
    }
  }, []);

  return {
    ...state,
    startScreenShare,
    stopScreenShare,
  };
}; 