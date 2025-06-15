import { useState, useCallback } from 'react';

interface ScreenShareHook {
  isScreenSharing: boolean;
  stream: MediaStream | null;
  startScreenShare: () => Promise<MediaStream>;
  stopScreenShare: () => void;
  toggleScreenShare: () => Promise<void>;
}

export const useMeetingScreenShare = (): ScreenShareHook => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  /**
   * Stop screen sharing and clean up tracks
   */
  const stopScreenShare = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (_) {
          // ignore
        }
      });
    }

    setStream(null);
    setIsScreenSharing(false);
  }, [stream]);

  /**
   * Start screen sharing with system audio and microphone audio when possible
   */
  const startScreenShare = useCallback(async (): Promise<MediaStream> => {
    if (stream) return stream; // already sharing

    try {
      // Try to get screen + system audio with standard API
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
        video: true, 
        audio: true // Request system audio
      });
      
      try {
        // Also get microphone audio
        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
          video: false
        });
        
        // Combine screen+system audio with microphone audio
        const combinedStream = new MediaStream();
        
        // Add all tracks from screen stream
        screenStream.getTracks().forEach(track => {
          combinedStream.addTrack(track);
        });
        
        // Add mic audio track
        micStream.getAudioTracks().forEach(track => {
          combinedStream.addTrack(track);
        });
        
        // Set up track ended handlers
        combinedStream.getTracks().forEach(track => {
          track.onended = () => {
            if (track.kind === 'video') {
              // Only stop everything if video ends
              stopScreenShare();
            }
          };
        });
        
        setStream(combinedStream);
        setIsScreenSharing(true);
        return combinedStream;
      } catch (micError) {
        console.warn('Failed to get microphone access:', micError);
        
        // Set up track ended handlers
        screenStream.getTracks().forEach(track => {
          track.onended = () => {
            if (track.kind === 'video') {
              // Only stop everything if video ends
              stopScreenShare();
            }
          };
        });
        
        // Return just the screen stream if mic access fails
        setStream(screenStream);
        setIsScreenSharing(true);
        return screenStream;
      }
    } catch (err) {
      console.error('Failed to start screen sharing:', err);
      throw err;
    }
  }, [stream, stopScreenShare]);

  /**
   * Toggle screen sharing
   */
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      stopScreenShare();
      return;
    }

    try {
      await startScreenShare();
    } catch (e) {
      console.error('Failed to start screen sharing:', e);
      // Let caller handle UI feedback
    }
  }, [isScreenSharing, startScreenShare, stopScreenShare]);

  return {
    isScreenSharing,
    stream,
    startScreenShare,
    stopScreenShare,
    toggleScreenShare,
  };
}; 