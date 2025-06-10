
import { useState, useCallback, useRef, useEffect } from 'react';

interface ScreenCaptureState {
  stream: MediaStream | null;
  isActive: boolean;
  error: string | null;
}

const useScreenCapture = () => {
  const [state, setState] = useState<ScreenCaptureState>({
    stream: null,
    isActive: false,
    error: null,
  });

  const streamRef = useRef<MediaStream | null>(null);

  const startCapture = useCallback(async (): Promise<MediaStream> => {
    try {
      console.log("Starting screen capture...");
      
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      
      streamRef.current = stream;
      
      setState({
        stream,
        isActive: true,
        error: null,
      });

      // Handle when user stops sharing via browser UI
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          console.log("Screen share ended by user");
          stopCapture();
        };
      }

      console.log("Screen capture started successfully");
      return stream;
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
      isActive: false,
      error: null,
    });
    
    console.log("Screen capture stopped");
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("useScreenCapture unmounting, cleaning up...");
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    ...state,
    startCapture,
    stopCapture,
  };
};

export default useScreenCapture;
