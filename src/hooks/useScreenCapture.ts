
import { useState, useCallback, useRef } from 'react';

interface ScreenCaptureState {
  stream: MediaStream | null;
  isCapturing: boolean;
  error: string | null;
}

const useScreenCapture = () => {
  const [state, setState] = useState<ScreenCaptureState>({
    stream: null,
    isCapturing: false,
    error: null,
  });

  const streamRef = useRef<MediaStream | null>(null);

  const startCapture = useCallback(async () => {
    try {
      console.log("Starting screen capture...");
      
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      
      streamRef.current = screenStream;
      
      setState({
        stream: screenStream,
        isCapturing: true,
        error: null,
      });

      // Handle when user stops sharing via browser UI
      const videoTrack = screenStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          console.log("Screen share ended by user");
          stopCapture();
        };
      }

      return screenStream;
    } catch (error) {
      console.error("Screen capture error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start screen capture';
      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  const stopCapture = useCallback(() => {
    console.log("Stopping screen capture...");
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log(`Stopping track: ${track.kind} - ${track.label}`);
        track.stop();
      });
      streamRef.current = null;
    }
    
    setState({
      stream: null,
      isCapturing: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    startCapture,
    stopCapture,
  };
};

export default useScreenCapture;
