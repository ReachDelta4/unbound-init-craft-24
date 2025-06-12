import { useState, useCallback, useRef, useEffect } from 'react';
import { isElectron, getDesktopSources } from '@/lib/electron-screen-share';

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
      console.log("Requesting screen capture...", isElectron() ? "Using Electron API" : "Using Browser API");
      
      let stream: MediaStream | null = null;
      
      // Use browser API directly - this works in both Electron and browser
      // Electron will show its own picker dialog
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      
      if (!stream) {
        throw new Error("Failed to get screen capture stream");
      }
      
      console.log('Screen share video tracks:', stream.getVideoTracks().map(track => ({
        label: track.label,
        enabled: track.enabled,
        readyState: track.readyState
      })));
      
      console.log('Screen share audio tracks:', stream.getAudioTracks().map(track => ({
        label: track.label,
        enabled: track.enabled,
        readyState: track.readyState
      })));
      
      streamRef.current = stream;
      
      setState({
        stream,
        isActive: true,
        error: null,
      });

      // Add event listener for when screen sharing ends
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks[0].onended = () => {
          console.log("Screen share ended by user");
          stopCapture();
        };
      }

      return stream;
    } catch (error) {
      console.error("Screen share error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start screen sharing';
      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  const stopCapture = useCallback(() => {
    console.log("Stopping screen share...");
    
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
    
    console.log("Screen share stopped");
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    stream: state.stream,
    isActive: state.isActive,
    error: state.error,
    startCapture,
    stopCapture,
  };
};

export default useScreenCapture;
