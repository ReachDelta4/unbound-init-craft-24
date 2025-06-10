
import { useState, useCallback, useRef, useEffect } from 'react';

interface ScreenShareManagerProps {
  onStreamChange: (stream: MediaStream | null) => void;
  onScreenSharingChange: (isSharing: boolean) => void;
}

export const useScreenShareManager = ({ onStreamChange, onScreenSharingChange }: ScreenShareManagerProps) => {
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start screen sharing
  const startScreenShare = useCallback(async () => {
    try {
      console.log("Requesting screen capture...");
      
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: true
      });
      
      console.log('Screen share started successfully:', {
        videoTracks: screenStream.getVideoTracks().map(track => ({
          label: track.label,
          enabled: track.enabled,
          readyState: track.readyState,
          settings: track.getSettings()
        })),
        audioTracks: screenStream.getAudioTracks().map(track => ({
          label: track.label,
          enabled: track.enabled,
          readyState: track.readyState
        }))
      });
      
      // Store in both state and ref
      setStream(screenStream);
      streamRef.current = screenStream;
      setIsScreenSharing(true);
      onStreamChange(screenStream);
      onScreenSharingChange(true);

      // Add event listener for when screen sharing ends
      const videoTracks = screenStream.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks[0].onended = () => {
          console.log("Screen share ended by user");
          stopScreenShare();
        };
      }

      return screenStream;
    } catch (error) {
      console.error("Screen share error:", error);
      throw error;
    }
  }, [onStreamChange, onScreenSharingChange]);

  // Stop screen sharing
  const stopScreenShare = useCallback(() => {
    console.log("Stopping screen share...");
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log(`Stopping track: ${track.kind} - ${track.label}`);
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
    }
    
    setStream(null);
    setIsScreenSharing(false);
    onStreamChange(null);
    onScreenSharingChange(false);
    
    console.log("Screen share stopped");
  }, [stream, onStreamChange, onScreenSharingChange]);

  // Toggle screen sharing
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      try {
        await startScreenShare();
      } catch (error) {
        console.error("Error starting screen share:", error);
      }
    }
  }, [isScreenSharing, stopScreenShare, startScreenShare]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    isScreenSharing,
    stream,
    startScreenShare,
    stopScreenShare,
    toggleScreenShare
  };
};
