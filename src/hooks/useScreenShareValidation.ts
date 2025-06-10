
import { useCallback } from 'react';

export const useScreenShareValidation = () => {
  const validateStream = useCallback((mediaStream: MediaStream | null): boolean => {
    if (!mediaStream) {
      console.log('ScreenShareValidation: No stream to validate');
      return false;
    }

    const videoTracks = mediaStream.getVideoTracks();
    const audioTracks = mediaStream.getAudioTracks();
    
    console.log('ScreenShareValidation: Validating stream', {
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
      console.warn('ScreenShareValidation: No active video tracks found');
      return false;
    }

    return true;
  }, []);

  return { validateStream };
};
