
import { useScreenShareManager } from "@/components/meeting/ScreenShareManager";

export const useMeetingScreenShare = () => {
  const {
    isScreenSharing,
    stream,
    startScreenShare,
    stopScreenShare,
    toggleScreenShare
  } = useScreenShareManager({
    onStreamChange: (newStream) => {
      console.log('MeetingPage: Stream changed', {
        hasStream: !!newStream,
        streamId: newStream?.id,
        videoTracks: newStream?.getVideoTracks().length || 0,
        audioTracks: newStream?.getAudioTracks().length || 0
      });
    },
    onScreenSharingChange: (sharing) => {
      console.log('MeetingPage: Screen sharing state changed:', sharing);
    }
  });

  return {
    isScreenSharing,
    stream,
    startScreenShare,
    stopScreenShare,
    toggleScreenShare
  };
};
