
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import MeetingControls from "@/components/MeetingControls";
import { useMeetingState } from "@/hooks/use-meeting-state";
import { useNotesState } from "@/hooks/use-notes-state";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import MainLayout from "@/components/layout/MainLayout";
import MeetingWorkspace from "@/components/meeting/MeetingWorkspace";
import CallTimer from "@/components/meeting/CallTimer";
import { useSampleData } from "@/hooks/useSampleData";
import { useCallManager } from "@/hooks/useCallManager";
import { useEmergencyAutoSave } from "@/hooks/useEmergencyAutoSave";
import { useControlsVisibility } from "@/hooks/useControlsVisibility";
import MeetingDialogsManager from "@/components/meeting/MeetingDialogsManager";

const Index = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const {
    activeMeeting,
    isCreatingMeeting,
    isSavingMeeting,
    savingProgress,
    startMeeting,
    endMeeting,
    updateMeeting,
    setActiveMeeting
  } = useMeetingState();

  const { insights, generateSummary } = useSampleData();
  
  const {
    isScreenSharing,
    webRTCStream,
    webRTCError,
    wsStatus,
    wsError,
    liveTranscript,
    fullTranscript,
    isStreaming,
    connectionTimedOut,
    setConnectionTimedOut,
    startCall,
    endCall,
    reconnectTranscription,
    handleConnectionTimeout,
    micStreamRef,
    systemStreamRef
  } = useCallManager();

  const {
    tempTranscriptRef,
    tempSummaryRef,
    createEmergencyBackup,
    checkForEmergencyBackup,
    cleanup: cleanupAutoSave
  } = useEmergencyAutoSave(activeMeeting, user, endMeeting, insights, generateSummary);

  const [showMeetingDialog, setShowMeetingDialog] = useState(false);
  const [showEndCallConfirmation, setShowEndCallConfirmation] = useState(false);
  const [uiCallDuration, setUiCallDuration] = useState(0);

  const { showControls, setShowControls } = useControlsVisibility(!!(activeMeeting && activeMeeting.status === 'active'));

  const formatTranscript = useCallback((sentences: string[]) => {
    if (!sentences || sentences.length === 0) return "";
    return sentences.join('\n\n');
  }, []);

  useEffect(() => {
    if (fullTranscript) {
      tempTranscriptRef.current = formatTranscript(fullTranscript.split('\n').filter(Boolean));
    }
  }, [fullTranscript, formatTranscript, tempTranscriptRef]);

  useEffect(() => {
    if (activeMeeting?.status === 'active') {
      const summaryInterval = setInterval(() => {
        tempSummaryRef.current = generateSummary();
      }, 30000);
      
      return () => clearInterval(summaryInterval);
    }
  }, [activeMeeting?.status, generateSummary, tempSummaryRef]);

  useEffect(() => {
    const emergencyHandler = createEmergencyBackup(updateMeeting);
    window.addEventListener("beforeunload", emergencyHandler);
    
    if (user) {
      checkForEmergencyBackup(updateMeeting);
    }
    
    return () => {
      window.removeEventListener("beforeunload", emergencyHandler);
      cleanupAutoSave();
    };
  }, [createEmergencyBackup, updateMeeting, user, checkForEmergencyBackup, cleanupAutoSave]);

  useEffect(() => {
    if (!activeMeeting || activeMeeting.status !== 'active') {
      setConnectionTimedOut(false);
    }
  }, [activeMeeting, setConnectionTimedOut]);

  useEffect(() => {
    if (!isScreenSharing) {
      endCall();
    }
  }, [isScreenSharing, endCall]);

  useEffect(() => {
    if (!activeMeeting || activeMeeting.status !== 'active') {
      endCall();
    }
  }, [activeMeeting, endCall]);

  const handleStartCall = useCallback(async (callType: string) => {
    await startCall(callType, startMeeting, user);
  }, [startCall, startMeeting, user]);

  const handleEndCall = useCallback(() => {
    setShowEndCallConfirmation(true);
  }, []);

  const handleConfirmEndCall = useCallback(() => {
    setShowEndCallConfirmation(false);
    endCall();
    setShowMeetingDialog(true);
  }, [endCall]);

  const handleSaveMeeting = useCallback(async (title: string, transcript: string, summary: string): Promise<void> => {
    if (!activeMeeting && !user) return;
    
    try {
      const transcriptToSave = transcript || tempTranscriptRef.current || "";
      const summaryToSave = summary || tempSummaryRef.current || "";
      
      const insightsForSaving = [
        { type: 'emotions', data: insights.emotions },
        { type: 'painPoints', data: insights.painPoints },
        { type: 'objections', data: insights.objections },
        { type: 'recommendations', data: insights.recommendations },
        { type: 'nextActions', data: insights.nextActions }
      ];
      
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 15000);
      
      try {
        const meetingId = await Promise.race([
          endMeeting(transcriptToSave, summaryToSave, insightsForSaving),
          new Promise<string | null>((_, reject) => {
            abortController.signal.addEventListener('abort', () => {
              reject(new Error('Meeting save timeout'));
            });
          })
        ]);
        
        if (meetingId) {
          await updateMeeting(meetingId, { title });
          toast({
            title: "Meeting saved",
            description: "Your meeting has been successfully saved.",
          });
        }
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      console.error("Error saving meeting:", error);
      toast({
        title: "Error saving meeting",
        description: "There was a problem saving your meeting data. Please try again.",
        variant: "destructive"
      });
    } finally {
      endCall();
      setShowMeetingDialog(false);
      setUiCallDuration(0);
      setActiveMeeting(null);
      tempTranscriptRef.current = "";
      tempSummaryRef.current = "";
    }
  }, [activeMeeting, user, insights, endMeeting, updateMeeting, toast, endCall, setActiveMeeting, tempTranscriptRef, tempSummaryRef]);

  const handleCloseMeetingDialog = useCallback(() => {
    endCall();
    setShowMeetingDialog(false);
    setUiCallDuration(0);
    setActiveMeeting(null);
  }, [endCall, setActiveMeeting]);

  if (!user) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <Button onClick={() => navigate("/auth")}>Sign In to Continue</Button>
        </div>
      </div>
    );
  }

  const isCallActive = !!(activeMeeting && activeMeeting.status === 'active');
  const callType = activeMeeting?.platform || null;

  console.log('Index: Rendering with state:', {
    isCallActive,
    hasWebRTCStream: !!webRTCStream,
    webRTCStreamActive: webRTCStream?.active,
    isScreenSharing,
    activeMeetingStatus: activeMeeting?.status
  });

  return (
    <MainLayout>
      <div>
        <MeetingWorkspace
          isCallActive={isCallActive}
          transcript={fullTranscript || ""}
          insights={insights}
          realtimeText={liveTranscript}
          fullSentences={fullTranscript ? fullTranscript.split('\n').filter(Boolean) : []}
          transcriptionStatus={wsStatus}
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
            onEndCall={() => setShowEndCallConfirmation(true)}
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
        transcript={fullTranscript ? formatTranscript(fullTranscript.split('\n').filter(Boolean)) : ""}
        summary={generateSummary()}
        insights={[
          { type: 'emotions', data: insights.emotions },
          { type: 'painPoints', data: insights.painPoints },
          { type: 'objections', data: insights.objections },
          { type: 'recommendations', data: insights.recommendations },
          { type: 'nextActions', data: insights.nextActions }
        ]}
        saveProgress={savingProgress}
      />
    </MainLayout>
  );
};

export default Index;
