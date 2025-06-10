
import React, { useEffect } from "react";
import MeetingLayout from "./MeetingLayout";
import MeetingMainArea from "./MeetingMainArea";
import MeetingControlsBar from "./MeetingControlsBar";
import { useTranscriptionWebSocket } from "@/hooks/useTranscriptionWebSocket";
import { useScreenShareManager } from "./ScreenShareManager";
import { useMeetingControlsManager } from "./MeetingControlsManager";
import { useMeetingMouseManager } from "./MeetingMouseManager";

const MeetingPage = () => {
  // Transcription hook
  const {
    fullTranscript,
    realtimeText,
    fullSentences,
    status: transcriptionStatus,
    error: transcriptionError,
    connect: connectTranscription,
    disconnect: disconnectTranscription,
  } = useTranscriptionWebSocket();

  // Screen sharing manager with enhanced callbacks
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

  // Meeting controls manager
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

  // Mouse controls manager
  const { showControls } = useMeetingMouseManager();

  // Sample insights data
  const insights = {
    emotions: [
      { emotion: "Interest", level: 75 },
      { emotion: "Confusion", level: 25 },
      { emotion: "Satisfaction", level: 60 },
    ],
    painPoints: [
      "Current process is too manual",
      "Lack of visibility into team productivity",
      "Integration issues with existing tools"
    ],
    objections: [
      "Price is too high compared to competitors",
      "Implementation timeline is too long",
      "Need approval from other stakeholders"
    ],
    recommendations: [
      "Focus on ROI and long-term value",
      "Offer implementation assistance",
      "Provide case studies from similar clients"
    ],
    nextActions: [
      "Schedule follow-up meeting with decision makers",
      "Send pricing comparison document",
      "Share implementation timeline"
    ]
  };

  // Enhanced debugging for stream state changes
  useEffect(() => {
    console.log('MeetingPage: State update', {
      hasStream: !!stream,
      isScreenSharing,
      isCallActive,
      streamId: stream?.id,
      streamTracks: stream ? {
        video: stream.getVideoTracks().length,
        audio: stream.getAudioTracks().length,
        videoActive: stream.getVideoTracks().some(t => t.enabled && t.readyState === 'live'),
        audioActive: stream.getAudioTracks().some(t => t.enabled && t.readyState === 'live')
      } : null
    });
  }, [stream, isScreenSharing, isCallActive]);

  return (
    <MeetingLayout>
      {/* Main Meeting Area */}
      <MeetingMainArea
        showControls={showControls}
        isCallActive={isCallActive}
        transcript={fullTranscript || ""}
        insights={insights}
        realtimeText={realtimeText}
        fullSentences={fullSentences}
        transcriptionStatus={transcriptionStatus}
        transcriptionError={transcriptionError}
        onReconnectTranscription={connectTranscription}
        stream={stream}
      />

      {/* Controls Bar */}
      <MeetingControlsBar
        showControls={showControls}
        isCallActive={isCallActive}
        isMicOn={isMicOn}
        isVideoOn={isVideoOn}
        isScreenSharing={isScreenSharing}
        onToggleMic={toggleMic}
        onToggleVideo={toggleVideo}
        onToggleScreenShare={toggleScreenShare}
        onToggleCall={toggleCall}
      />
    </MeetingLayout>
  );
};

export default MeetingPage;
