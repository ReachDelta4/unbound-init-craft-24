
import { useState, useCallback, useRef, useEffect } from 'react';
import { useScreenShareValidation } from '@/hooks/useScreenShareValidation';
import { useScreenShareCleanup } from '@/hooks/useScreenShareCleanup';
import { useScreenShareTrackHandlers } from '@/hooks/useScreenShareTrackHandlers';

interface ScreenShareManagerProps {
  onStreamChange: (stream: MediaStream | null) => void;
  onScreenSharingChange: (isSharing: boolean) => void;
}

export const useScreenShareManager = ({ onStreamChange, onScreenSharingChange }: ScreenShareManagerProps) => {
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { validateStream } = useScreenShareValidation();
  const { setupHealthCheck, cleanupStream, cleanup } = useScreenShareCleanup();
  const { setupTrackHandlers } = useScreenShareTrackHandlers();

  // Start screen sharing with enhanced error handling
  const startScreenShare = useCallback(async () => {
    try {
      console.log("ScreenShareManager: Starting screen capture...");
      
      // Always stop any existing stream first
      if (streamRef.current) {
        console.log("ScreenShareManager: Stopping existing stream first");
        cleanupStream(streamRef.current);
        streamRef.current = null;
      }
      
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
      
      // Validate the stream immediately
      if (!validateStream(screenStream)) {
        screenStream.getTracks().forEach(track => track.stop());
        throw new Error('Invalid screen share stream received');
      }
      
      console.log('ScreenShareManager: Screen share started successfully');
      
      // Store references
      setStream(screenStream);
      streamRef.current = screenStream;
      setIsScreenSharing(true);
      
      // Notify parent components
      onStreamChange(screenStream);
      onScreenSharingChange(true);

      // Set up track ended handlers for cleanup
      setupTrackHandlers(screenStream, stopScreenShare);

      // Set up health monitoring
      setupHealthCheck(screenStream, stopScreenShare, validateStream);

      return screenStream;
    } catch (error) {
      console.error("ScreenShareManager: Screen share error:", error);
      
      // Clean up on error
      setStream(null);
      streamRef.current = null;
      setIsScreenSharing(false);
      onStreamChange(null);
      onScreenSharingChange(false);
      
      throw error;
    }
  }, [validateStream, onStreamChange, onScreenSharingChange, cleanupStream, setupTrackHandlers, setupHealthCheck]);

  // Stop screen sharing with comprehensive cleanup
  const stopScreenShare = useCallback(() => {
    console.log("ScreenShareManager: Stopping screen share...");
    
    // Clean up stream references
    if (streamRef.current) {
      cleanupStream(streamRef.current);
      streamRef.current = null;
    }
    
    if (stream) {
      cleanupStream(stream);
    }
    
    // Update state
    setStream(null);
    setIsScreenSharing(false);
    
    // Notify parent components
    onStreamChange(null);
    onScreenSharingChange(false);
    
    console.log("ScreenShareManager: Screen share stopped successfully");
  }, [stream, onStreamChange, onScreenSharingChange, cleanupStream]);

  // Toggle screen sharing
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      try {
        await startScreenShare();
      } catch (error) {
        console.error("ScreenShareManager: Error starting screen share:", error);
        // Error is already handled in startScreenShare
      }
    }
  }, [isScreenSharing, stopScreenShare, startScreenShare]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("ScreenShareManager: Component unmounting, cleaning up");
      
      if (streamRef.current) {
        cleanupStream(streamRef.current);
      }
      
      if (stream) {
        cleanupStream(stream);
      }
      
      cleanup();
    };
  }, [cleanupStream, cleanup, stream]);

  return {
    isScreenSharing,
    stream,
    startScreenShare,
    stopScreenShare,
    toggleScreenShare
  };
};
