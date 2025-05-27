import { useState, useCallback, useRef } from 'react';

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

  const startScreenShare = useCallback(async () => {
    try {
      // Request screen sharing
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
        },
        audio: true,
      });
      screenStreamRef.current = screenStream;

      // Request audio
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      // Combine streams
      const combinedStream = new MediaStream([
        ...screenStream.getVideoTracks(),
        ...audioStream.getAudioTracks(),
      ]);

      setState({
        isScreenSharing: true,
        isAudioEnabled: true,
        stream: combinedStream,
        error: null,
      });

      // Handle when user stops sharing
      screenStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

      return combinedStream;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start screen sharing',
      }));
      throw error;
    }
  }, []);

  const stopScreenShare = useCallback(() => {
    // Stop all tracks in the combined stream
    if (state.stream) {
      state.stream.getTracks().forEach(track => track.stop());
    }
    // Stop all tracks in the original screen stream
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    setState({
      isScreenSharing: false,
      isAudioEnabled: false,
      stream: null,
      error: null,
    });
  }, [state.stream]);

  return {
    ...state,
    startScreenShare,
    stopScreenShare,
  };
}; 