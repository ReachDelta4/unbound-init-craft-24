import { useState, useCallback } from 'react';

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

  const startScreenShare = useCallback(async () => {
    try {
      // Request screen sharing
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
        },
        audio: true,
      });

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
    if (state.stream) {
      state.stream.getTracks().forEach(track => track.stop());
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