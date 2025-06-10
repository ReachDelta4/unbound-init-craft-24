
import { useCallback, useState } from 'react';

interface StreamDetails {
  hasVideo: boolean;
  hasAudio: boolean;
  videoTrackState: string;
  streamId: string;
}

export const useStreamValidation = () => {
  const [streamDetails, setStreamDetails] = useState<StreamDetails | null>(null);

  const validateStream = useCallback((mediaStream: MediaStream | null) => {
    if (!mediaStream) {
      console.log('useStreamValidation: No stream provided');
      return false;
    }

    const videoTracks = mediaStream.getVideoTracks();
    const audioTracks = mediaStream.getAudioTracks();
    
    const details = {
      hasVideo: videoTracks.length > 0,
      hasAudio: audioTracks.length > 0,
      videoTrackState: videoTracks[0]?.readyState || 'no-track',
      streamId: mediaStream.id
    };
    
    setStreamDetails(details);
    
    console.log('useStreamValidation: Stream validation', {
      ...details,
      videoTrackEnabled: videoTracks[0]?.enabled,
      videoTrackLabel: videoTracks[0]?.label,
      totalTracks: mediaStream.getTracks().length
    });

    const isValid = details.hasVideo && details.videoTrackState === 'live';
    
    if (!isValid) {
      console.warn('useStreamValidation: Stream validation failed', details);
    }
    
    return isValid;
  }, []);

  const clearStreamDetails = useCallback(() => {
    setStreamDetails(null);
  }, []);

  return {
    validateStream,
    streamDetails,
    clearStreamDetails
  };
};
