import { useState, useCallback } from 'react';
import { isElectron } from '@/lib/browser-detection';

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
   * Internal helper that creates a stream using Electron's desktopCapturer fallback
   * with system audio included
   */
  const createElectronStream = async (): Promise<MediaStream> => {
    if (!window.electronAPI || typeof window.electronAPI.getScreenSources !== 'function') {
      throw new Error('Electron screen sources API not available');
    }

    const sources = await window.electronAPI.getScreenSources({
      types: ['screen', 'window'],
      thumbnailSize: { width: 150, height: 150 },
      fetchWindowIcons: true,
    });

    if (!sources || sources.length === 0) {
      throw new Error('No screen sources found');
    }

    // Prefer an entire screen source if available
    const screenSource = sources.find((s: any) => s.name.toLowerCase().includes('screen')) || sources[0];

    // Create screen stream with audio
    // @ts-ignore – Electron-specific constraint
    const screenWithAudioStream = await (navigator.mediaDevices as any).getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: 'desktop',
        },
        optional: [
          { echoCancellation: true },
          { noiseSuppression: true },
          { autoGainControl: true }
        ]
      },
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: screenSource.id,
          minWidth: 1280,
          maxWidth: 1920,
          minHeight: 720,
          maxHeight: 1080,
        },
      },
    });
    
    // Also get microphone audio
    try {
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
      screenWithAudioStream.getTracks().forEach(track => {
        combinedStream.addTrack(track);
      });
      
      // Add mic audio track
      micStream.getAudioTracks().forEach(track => {
        combinedStream.addTrack(track);
      });
      
      return combinedStream;
    } catch (micError) {
      console.warn('Failed to get microphone access:', micError);
      // Return just the screen stream if mic access fails
      return screenWithAudioStream;
    }
  };

  /**
   * Start screen sharing – tries standard getDisplayMedia first, then falls back to Electron capturer
   * Includes both system audio and microphone audio when possible
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
      console.warn('Standard getDisplayMedia failed, attempting Electron fallback...', err);

      if (!isElectron()) {
        throw err; // not running in Electron – give up
      }

      // Attempt Electron fallback
      const electronStream = await createElectronStream();
      
      // Set up track ended handlers
      electronStream.getTracks().forEach(track => {
        track.onended = () => {
          if (track.kind === 'video') {
            // Only stop everything if video ends
            stopScreenShare();
          }
        };
      });
      
      setStream(electronStream);
      setIsScreenSharing(true);
      return electronStream;
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