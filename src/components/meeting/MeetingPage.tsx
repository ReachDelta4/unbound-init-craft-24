
import React, { useEffect } from "react";
import MeetingLayout from "./MeetingLayout";
import MeetingMainArea from "./MeetingMainArea";
import MeetingControlsBar from "./MeetingControlsBar";
import { useMeetingMouseManager } from "./MeetingMouseManager";
import { useMeetingTranscription } from "@/hooks/useMeetingTranscription";
import { useMeetingScreenShare } from "@/hooks/useMeetingScreenShare";
import { useMeetingControls } from "@/hooks/useMeetingControls";
import { useMeetingInsights } from "@/hooks/useMeetingInsights";

const MeetingPage = () => {
  // Transcription hook
  const {
    fullTranscript,
    realtimeText,
    fullSentences,
    transcriptionStatus,
    transcriptionError,
    connectTranscription,
    disconnectTranscription,
  } = useMeetingTranscription();

  // Screen sharing manager with enhanced callbacks
  const {
    isScreenSharing,
    stream,
    startScreenShare,
    stopScreenShare,
    toggleScreenShare
  } = useMeetingScreenShare();

  // Meeting controls manager
  const {
    isCallActive,
    isMicOn,
    isVideoOn,
    toggleCall,
    toggleMic,
    toggleVideo
  } = useMeetingControls({
    startScreenShare,
    stopScreenShare,
    connectTranscription,
    disconnectTranscription,
    isScreenSharing
  });

  // Mouse controls manager
  const { showControls } = useMeetingMouseManager();

  // Sample insights data
  const insights = useMeetingInsights();

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
