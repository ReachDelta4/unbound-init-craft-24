
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
    console.log("useWebRTC: Stopping screen share...");
    
    if (state.stream) {
      state.stream.getTracks().forEach(track => {
        console.log(`useWebRTC: Stopping track: ${track.kind} - ${track.label}`);
        track.stop();
      });
    }
    
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => {
        console.log(`useWebRTC: Stopping original track: ${track.kind} - ${track.label}`);
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
    
    console.log("useWebRTC: Screen share stopped");
  }, [state.stream]);
  stopScreenShareRef.current = stopScreenShare;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("useWebRTC: Hook unmounting, cleaning up streams");
      stopScreenShareRef.current();
    };
  }, []);

  const startScreenShare = useCallback(async () => {
    // Always stop any existing screen share before starting a new one
    stopScreenShareRef.current();
    try {
      console.log("useWebRTC: Requesting screen capture...");
      
      // Use enhanced getDisplayMedia call for better stream quality
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          frameRate: { ideal: 30, max: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      // Check if video track exists and is active
      const videoTracks = screenStream.getVideoTracks();
      const audioTracks = screenStream.getAudioTracks();
      
      console.log('useWebRTC: Screen share stream created:', {
        id: screenStream.id,
        active: screenStream.active,
        videoTracks: videoTracks.length,
        audioTracks: audioTracks.length,
        videoTrackStates: videoTracks.map(t => ({
          label: t.label,
          enabled: t.enabled,
          readyState: t.readyState,
          kind: t.kind
        })),
        audioTrackStates: audioTracks.map(t => ({
          label: t.label,
          enabled: t.enabled,
          readyState: t.readyState,
          kind: t.kind
        }))
      });
      
      if (videoTracks.length === 0) {
        console.warn('useWebRTC: No video track found in screen share');
        throw new Error('No video track available in screen share');
      }
      
      // Verify the video track is actually working
      const videoTrack = videoTracks[0];
      if (videoTrack.readyState !== 'live') {
        console.warn('useWebRTC: Video track is not live:', videoTrack.readyState);
      }
      
      screenStreamRef.current = screenStream;
      
      // Set state with this stream immediately
      setState({
        isScreenSharing: true,
        isAudioEnabled: audioTracks.length > 0,
        stream: screenStream,
        error: null,
      });

      // Add event listeners for track ended events
      videoTracks.forEach((track, index) => {
        track.onended = () => {
          console.log(`useWebRTC: Video track ${index} ended by user`);
          stopScreenShareRef.current();
        };
      });

      audioTracks.forEach((track, index) => {
        track.onended = () => {
          console.log(`useWebRTC: Audio track ${index} ended`);
          // Don't stop everything just because audio ended
        };
      });

      console.log('useWebRTC: Screen share started successfully');
      return screenStream;
    } catch (error) {
      console.error("useWebRTC: Screen share error:", error);
      setState(prev => ({
        ...prev,
        isScreenSharing: false,
        stream: null,
        error: error instanceof Error ? error.message : 'Failed to start screen sharing',
      }));
      throw error;
    }
  }, []);

  console.log('useWebRTC: Current state:', {
    isScreenSharing: state.isScreenSharing,
    hasStream: !!state.stream,
    streamId: state.stream?.id,
    error: state.error,
    streamActive: state.stream?.active
  });

  return {
    ...state,
    startScreenShare,
    stopScreenShare,
  };
};
