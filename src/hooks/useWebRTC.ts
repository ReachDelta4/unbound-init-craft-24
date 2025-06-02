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
  // Keep a ref to the latest stopScreenShare function for use in event handlers
  const stopScreenShareRef = useRef<() => void>(() => {});

  // Stop all tracks in both the combined and original screen stream
  const stopScreenShare = useCallback(() => {
    if (state.stream) {
      state.stream.getTracks().forEach(track => track.stop());
    }
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
  stopScreenShareRef.current = stopScreenShare;

  const startScreenShare = useCallback(async () => {
    // Always stop any existing screen share before starting a new one
    stopScreenShareRef.current();
    try {
      // Explicitly request system audio when getting display media
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: {
          // Explicitly request system audio
          // This enables capturing the audio of the screen being shared
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          // In some browsers, 'mediaSource' is used to specify system audio
          // @ts-expect-error - Some browsers support this property
          mediaSource: 'desktop'
        }
      });
      
      // Check if system audio was successfully captured
      const hasSystemAudio = screenStream.getAudioTracks().length > 0;
      
      screenStreamRef.current = screenStream;

      // Always get microphone audio separately
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Combine all tracks (video from screen, audio from both screen and mic)
      const combinedStream = new MediaStream([
        ...screenStream.getVideoTracks(),
        ...micStream.getAudioTracks(),
        ...(hasSystemAudio ? screenStream.getAudioTracks() : [])
      ]);

      setState({
        isScreenSharing: true,
        isAudioEnabled: true,
        stream: combinedStream,
        error: null,
      });

      // Use the latest stopScreenShare for the onended handler
      screenStream.getVideoTracks()[0].onended = () => {
        stopScreenShareRef.current();
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

  return {
    ...state,
    startScreenShare,
    stopScreenShare,
  };
}; 