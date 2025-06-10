
import { useState, useCallback, useRef, useEffect } from 'react';

interface MeetingControlsManagerProps {
  onCallStateChange: (isActive: boolean) => void;
  onStartScreenShare: () => Promise<MediaStream>;
  onStopScreenShare: () => void;
  onConnectTranscription: () => void;
  onDisconnectTranscription: () => void;
  isScreenSharing: boolean;
}

export const useMeetingControlsManager = ({
  onCallStateChange,
  onStartScreenShare,
  onStopScreenShare,
  onConnectTranscription,
  onDisconnectTranscription,
  isScreenSharing
}: MeetingControlsManagerProps) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);

  // Start/stop call
  const toggleCall = useCallback(async () => {
    if (isCallActive) {
      setIsCallActive(false);
      setIsMicOn(false);
      setIsVideoOn(false);
      if (isScreenSharing) {
        onStopScreenShare();
      }
      onDisconnectTranscription();
      onCallStateChange(false);
    } else {
      setIsCallActive(true);
      setIsMicOn(true);
      onConnectTranscription();
      onCallStateChange(true);
      // Auto-start screen sharing when call starts
      try {
        await onStartScreenShare();
      } catch (error) {
        console.error("Failed to start screen sharing:", error);
      }
    }
  }, [isCallActive, isScreenSharing, onStopScreenShare, onDisconnectTranscription, onCallStateChange, onConnectTranscription, onStartScreenShare]);

  // Toggle microphone
  const toggleMic = useCallback(() => {
    setIsMicOn(!isMicOn);
    // In a real app, would toggle actual microphone here
  }, [isMicOn]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    setIsVideoOn(!isVideoOn);
    // In a real app, would toggle actual camera here
  }, [isVideoOn]);

  return {
    isCallActive,
    isMicOn,
    isVideoOn,
    toggleCall,
    toggleMic,
    toggleVideo
  };
};
