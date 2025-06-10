
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import MainLayout from "@/components/layout/MainLayout";
import MeetingWorkspace from "@/components/meeting/MeetingWorkspace";
import CallTimer from "@/components/meeting/CallTimer";
import MeetingControls from "@/components/MeetingControls";
import MeetingDialogsManager from "@/components/meeting/MeetingDialogsManager";
import Phi3Insights from "@/components/meeting/Phi3Insights";
import Phi3TestButton from "@/components/meeting/Phi3TestButton";
import { Phi3Provider } from "@/contexts/Phi3Context";
import { MeetingProvider, useMeetingContext } from "@/components/meeting/MeetingProvider";
import { useMeetingPageLogic } from "@/hooks/useMeetingPageLogic";
import { TranscriptionWSStatus } from "@/hooks/useTranscriptionWebSocket";

const MeetingPageContent = () => {
  const {
    user,
    isCreatingMeeting,
    isSavingMeeting,
    webRTCStream,
    wsStatus,
    wsError,
    liveTranscript,
    fullTranscript,
    isStreaming,
    reconnectTranscription,
    insights
  } = useMeetingContext();

  const {
    isCallActive,
    callType,
    uiCallDuration,
    setUiCallDuration,
    showControls,
    setShowControls,
    showMeetingDialog,
    showEndCallConfirmation,
    handleStartCall,
    handleCloseMeetingDialog,
    handleEndCall,
    handleConfirmEndCall,
    handleSaveMeeting,
    setShowEndCallConfirmation,
    fullTranscript: formattedTranscript,
    summary,
    insights: formattedInsights,
    savingProgress
  } = useMeetingPageLogic();

  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <Button onClick={() => navigate("/auth")}>Sign In to Continue</Button>
        </div>
      </div>
    );
  }

  console.log('MeetingPage: Rendering with state:', {
    isCallActive,
    hasWebRTCStream: !!webRTCStream,
    webRTCStreamActive: webRTCStream?.active,
    isScreenSharing: !!webRTCStream,
    fullSentences: fullTranscript ? fullTranscript.split('\n').filter(Boolean) : [],
    liveTranscript,
    insights
  });

  // Parse full sentences from the transcript
  const fullSentences = fullTranscript ? fullTranscript.split('\n').filter(Boolean) : [];

  return (
    <MainLayout>
      <div className="relative">
        {/* Test button for debugging AI - positioned better */}
        <div className="absolute top-4 right-4 z-30">
          <Phi3TestButton />
        </div>
        
        {/* Hidden Phi3Insights component to process transcript */}
        <Phi3Insights
          liveText={liveTranscript}
          transcriptHistory={fullSentences}
          className="hidden"
        />
        
        <MeetingWorkspace
          isCallActive={isCallActive}
          transcript={fullTranscript || ""}
          insights={insights}
          realtimeText={liveTranscript}
          fullSentences={fullSentences}
          transcriptionStatus={wsStatus as TranscriptionWSStatus}
          transcriptionError={wsError}
          onReconnectTranscription={reconnectTranscription}
          stream={webRTCStream}
          className={`transition-all duration-300 ${
            isCallActive && !showControls 
              ? "h-screen" 
              : "h-[calc(100vh-56px)]"
          }`}
        />
        
        
        <CallTimer
          isActive={isCallActive}
          onDurationChange={setUiCallDuration}
        />
        
        {/* Indicator when controls are hidden */}
        {isCallActive && !showControls && (
          <div 
            className="fixed bottom-0 left-0 right-0 h-1 bg-primary/20 z-10 cursor-pointer"
            onClick={() => setShowControls(true)}
          >
            <div className="w-20 h-1 mx-auto bg-primary/40 rounded-t"></div>
          </div>
        )}
        
        {/* Controls bar with autohide */}
        <div 
          className={`bg-card border-t border-border fixed bottom-0 left-0 right-0 py-2 px-4 shadow-md z-10 transition-transform duration-300 ${
            isCallActive && !showControls ? 'translate-y-full' : 'translate-y-0'
          }`}
        >
          <MeetingControls
            isCallActive={isCallActive}
            callType={callType}
            callDuration={uiCallDuration}
            onCallTypeChange={handleStartCall}
            onStartCall={() => handleStartCall(callType || "video")}
            onEndCall={handleEndCall}
            isLoading={isCreatingMeeting}
            isSaving={isSavingMeeting}
          />
          <div className="text-xs text-center text-muted-foreground mt-1">
            {wsStatus === 'connected' && isStreaming ? (
              <span className="flex items-center justify-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-green-500">Connected</span>
              </span>
            ) : wsStatus === 'error' ? (
              <span className="text-red-500">Transcription error - reconnect to try again</span>
            ) : wsStatus === 'connecting' ? (
              <span className="flex items-center justify-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                Reconnecting...
              </span>
            ) : (
              <span>Transcription ready</span>
            )}
          </div>
        </div>
      </div>
      
      <MeetingDialogsManager
        showMeetingDialog={showMeetingDialog}
        showEndCallConfirmation={showEndCallConfirmation}
        onCloseMeetingDialog={handleCloseMeetingDialog}
        onCloseEndCallConfirmation={() => setShowEndCallConfirmation(false)}
        onConfirmEndCall={handleConfirmEndCall}
        onSaveMeeting={handleSaveMeeting}
        transcript={formattedTranscript}
        summary={summary}
        insights={formattedInsights}
        saveProgress={savingProgress}
      />
    </MainLayout>
  );
};

const MeetingPage = () => {
  return (
    <Phi3Provider autoInitialize={true}>
      <MeetingProvider>
        <MeetingPageContent />
      </MeetingProvider>
    </Phi3Provider>
  );
};

export default MeetingPage;
