
import { useMeetingControlsManager } from "@/components/meeting/MeetingControlsManager";

interface UseMeetingControlsProps {
  startScreenShare: () => Promise<MediaStream>;
  stopScreenShare: () => void;
  connectTranscription: () => void;
  disconnectTranscription: () => void;
  isScreenSharing: boolean;
}

export const useMeetingControls = ({
  startScreenShare,
  stopScreenShare,
  connectTranscription,
  disconnectTranscription,
  isScreenSharing
}: UseMeetingControlsProps) => {
  const {
    isCallActive,
    isMicOn,
    isVideoOn,
    toggleCall,
    toggleMic,
    toggleVideo
  } = useMeetingControlsManager({
    onCallStateChange: (active) => {
      console.log('MeetingPage: Call state changed:', active);
    },
    onStartScreenShare: startScreenShare,
    onStopScreenShare: stopScreenShare,
    onConnectTranscription: connectTranscription,
    onDisconnectTranscription: disconnectTranscription,
    isScreenSharing
  });

  return {
    isCallActive,
    isMicOn,
    isVideoOn,
    toggleCall,
    toggleMic,
    toggleVideo
  };
};
