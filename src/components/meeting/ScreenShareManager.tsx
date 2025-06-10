
import { useState, useCallback, useRef, useEffect } from 'react';

interface ScreenShareManagerProps {
  onStreamChange: (stream: MediaStream | null) => void;
  onScreenSharingChange: (isSharing: boolean) => void;
}

export const useScreenShareManager = ({ onStreamChange, onScreenSharingChange }: ScreenShareManagerProps) => {
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Enhanced stream validation
  const validateStream = useCallback((mediaStream: MediaStream | null): boolean => {
    if (!mediaStream) {
      console.log('ScreenShareManager: No stream to validate');
      return false;
    }

    const videoTracks = mediaStream.getVideoTracks();
    const audioTracks = mediaStream.getAudioTracks();
    
    console.log('ScreenShareManager: Validating stream', {
      streamId: mediaStream.id,
      videoTracks: videoTracks.length,
      audioTracks: audioTracks.length,
      videoTrackStates: videoTracks.map(t => ({ 
        label: t.label, 
        enabled: t.enabled, 
        readyState: t.readyState,
        muted: t.muted
      })),
      audioTrackStates: audioTracks.map(t => ({ 
        label: t.label, 
        enabled: t.enabled, 
        readyState: t.readyState,
        muted: t.muted
      }))
    });

    // Check if we have at least one active video track
    const hasActiveVideo = videoTracks.some(track => 
      track.enabled && track.readyState === 'live'
    );

    if (!hasActiveVideo) {
      console.warn('ScreenShareManager: No active video tracks found');
      return false;
    }

    return true;
  }, []);

  // Start screen sharing with enhanced error handling
  const startScreenShare = useCallback(async () => {
    try {
      console.log("ScreenShareManager: Starting screen capture...");
      
      // Always stop any existing stream first
      if (streamRef.current) {
        console.log("ScreenShareManager: Stopping existing stream first");
        streamRef.current.getTracks().forEach(track => track.stop());
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
      const videoTracks = screenStream.getVideoTracks();
      if (videoTracks.length > 0) {
        const firstVideoTrack = videoTracks[0];
        
        firstVideoTrack.onended = () => {
          console.log("ScreenShareManager: Screen share ended by user");
          stopScreenShare();
        };
        
        // Also listen for track state changes
        firstVideoTrack.onmute = () => {
          console.log("ScreenShareManager: Video track muted");
        };
        
        firstVideoTrack.onunmute = () => {
          console.log("ScreenShareManager: Video track unmuted");
        };
      }

      // Monitor stream health
      const healthCheckInterval = setInterval(() => {
        if (streamRef.current && !validateStream(streamRef.current)) {
          console.warn("ScreenShareManager: Stream health check failed, stopping");
          clearInterval(healthCheckInterval);
          stopScreenShare();
        }
      }, 5000);

      // Store interval reference for cleanup
      (screenStream as any)._healthCheckInterval = healthCheckInterval;

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
  }, [validateStream, onStreamChange, onScreenSharingChange]);

  // Stop screen sharing with comprehensive cleanup
  const stopScreenShare = useCallback(() => {
    console.log("ScreenShareManager: Stopping screen share...");
    
    // Clear health check interval if it exists
    if (streamRef.current && (streamRef.current as any)._healthCheckInterval) {
      clearInterval((streamRef.current as any)._healthCheckInterval);
    }
    
    // Stop all tracks in both stream references
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log(`ScreenShareManager: Stopping track: ${track.kind} - ${track.label}`);
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (stream) {
      stream.getTracks().forEach(track => {
        if (track.readyState !== 'ended') {
          track.stop();
        }
      });
    }
    
    // Update state
    setStream(null);
    setIsScreenSharing(false);
    
    // Notify parent components
    onStreamChange(null);
    onScreenSharingChange(false);
    
    console.log("ScreenShareManager: Screen share stopped successfully");
  }, [stream, onStreamChange, onScreenSharingChange]);

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
        if ((streamRef.current as any)._healthCheckInterval) {
          clearInterval((streamRef.current as any)._healthCheckInterval);
        }
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
