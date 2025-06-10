
import { useCallback } from 'react';

export const useScreenShareTrackHandlers = () => {
  const setupTrackHandlers = useCallback((stream: MediaStream, onTrackEnded: () => void) => {
    const videoTracks = stream.getVideoTracks();
    
    if (videoTracks.length > 0) {
      const firstVideoTrack = videoTracks[0];
      
      firstVideoTrack.onended = () => {
        console.log("ScreenShareTrackHandlers: Screen share ended by user");
        onTrackEnded();
      };
      
      // Also listen for track state changes
      firstVideoTrack.onmute = () => {
        console.log("ScreenShareTrackHandlers: Video track muted");
      };
      
      firstVideoTrack.onunmute = () => {
        console.log("ScreenShareTrackHandlers: Video track unmuted");
      };
    }
  }, []);

  return { setupTrackHandlers };
};
