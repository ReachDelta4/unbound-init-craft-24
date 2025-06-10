
import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, Phone, Monitor, Share2 } from "lucide-react";
import MeetingWorkspace from "./MeetingWorkspace";
import { useTranscriptionWebSocket } from "@/hooks/useTranscriptionWebSocket";
import { useScreenShareManager } from "./ScreenShareManager";
import { useMeetingControlsManager } from "./MeetingControlsManager";
import { useMeetingMouseManager } from "./MeetingMouseManager";

const MeetingPage = () => {
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);

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

  // Screen sharing manager
  const {
    isScreenSharing,
    stream,
    startScreenShare,
    stopScreenShare,
    toggleScreenShare
  } = useScreenShareManager({
    onStreamChange: () => {},
    onScreenSharingChange: () => {}
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
    onCallStateChange: () => {},
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

  // Debug stream state
  useEffect(() => {
    console.log('MeetingPage stream state changed:', {
      hasStream: !!stream,
      isScreenSharing,
      isCallActive,
      streamId: stream?.id
    });
  }, [stream, isScreenSharing, isCallActive]);

  return (
    <div 
      ref={mainContainerRef}
      className="h-screen w-full flex flex-col bg-background overflow-hidden"
      style={{ height: '100vh' }}
    >
      {/* Main Meeting Area */}
      <div 
        className="flex-1 overflow-hidden"
        style={{ 
          height: showControls ? 'calc(100vh - 80px)' : '100vh',
          transition: 'height 0.3s ease-in-out'
        }}
      >
        <MeetingWorkspace
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
      </div>

      {/* Controls Bar */}
      <div 
        ref={controlsRef}
        className="h-20 bg-card border-t-2 border-border shadow-lg flex items-center justify-center gap-4 transition-all duration-300"
        style={{
          transform: showControls ? 'translateY(0)' : 'translateY(100%)',
          opacity: showControls ? 1 : 0,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10
        }}
      >
        {/* Left Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant={isMicOn ? "default" : "outline"}
            size="icon"
            className="h-12 w-12 rounded-full border-2 border-border"
            onClick={toggleMic}
          >
            {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>
          
          <Button
            variant={isVideoOn ? "default" : "outline"}
            size="icon"
            className="h-12 w-12 rounded-full border-2 border-border"
            onClick={toggleVideo}
          >
            {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>
        </div>
        
        {/* Center Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant={isScreenSharing ? "default" : "outline"}
            size="icon"
            className="h-12 w-12 rounded-full border-2 border-border"
            onClick={toggleScreenShare}
          >
            {isScreenSharing ? <Monitor className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
          </Button>
        </div>
        
        {/* Right Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant={isCallActive ? "destructive" : "default"}
            size="lg"
            className="rounded-full px-8 border-2 border-border"
            onClick={toggleCall}
          >
            <Phone className="h-5 w-5 mr-2" />
            {isCallActive ? "End Call" : "Start Call"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MeetingPage;
