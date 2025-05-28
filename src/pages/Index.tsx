import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import MeetingControls from "@/components/MeetingControls";
import MeetingEndDialog from "@/components/MeetingEndDialog";
import { useMeetingState } from "@/hooks/use-meeting-state";
import { useNotesState } from "@/hooks/use-notes-state";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import MainLayout from "@/components/layout/MainLayout";
import MeetingWorkspace from "@/components/meeting/MeetingWorkspace";
import CallTimer from "@/components/meeting/CallTimer";
import { useSampleData } from "@/hooks/useSampleData";
import { useWebRTC } from "@/hooks/useWebRTC";
import ScreenSharePreview from "@/components/meeting/ScreenSharePreview";
import { useMixedAudioWebSocket } from "@/hooks/useMixedAudioWebSocket";

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

  const { saveNotesToMeeting, isSaving: isSavingNotes, notes, checklist } = useNotesState();
  const { insights, transcript, generateSummary } = useSampleData();
  const {
    startScreenShare,
    stopScreenShare,
    isScreenSharing,
    stream,
    error: webRTCError
  } = useWebRTC();

  // --- Mixed Audio WebSocket Hook ---
  const {
    status: wsStatus,
    error: wsError,
    liveTranscript,
    fullTranscript,
    isStreaming,
    connect: connectMixedAudio,
    disconnect: disconnectMixedAudio,
  } = useMixedAudioWebSocket();

  // Store the mic and system audio streams
  const micStreamRef = useRef<MediaStream | null>(null);
  const systemStreamRef = useRef<MediaStream | null>(null);

  // Helper to extract mic and system audio tracks from the combined stream
  const extractAudioStreams = useCallback((combinedStream: MediaStream) => {
    // Try to distinguish mic and system audio tracks
    // This is a best-effort approach; browser support may vary
    const audioTracks = combinedStream.getAudioTracks();
    if (audioTracks.length < 2) {
      // Fallback: use the same stream for both
      micStreamRef.current = combinedStream;
      systemStreamRef.current = combinedStream;
      return;
    }
    // Create separate streams for each track
    micStreamRef.current = new MediaStream([audioTracks[0]]);
    systemStreamRef.current = new MediaStream([audioTracks[1]]);
  }, []);

  const [showMeetingDialog, setShowMeetingDialog] = useState(false);
  const [uiCallDuration, setUiCallDuration] = useState(0);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (activeMeeting && activeMeeting.status === 'active') {
        e.preventDefault();
        e.returnValue = "You have a call in progress. Are you sure you want to leave?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [activeMeeting]);

  // Start call: start screen share, then start mixed audio streaming
  const handleStartCall = useCallback(async (callType: string) => {
    if (!callType || !user) return;
    try {
      const combinedStream = await startScreenShare();
      extractAudioStreams(combinedStream);
      // Wait a moment to ensure streams are ready
      setTimeout(() => {
        if (micStreamRef.current && systemStreamRef.current) {
          connectMixedAudio(micStreamRef.current, systemStreamRef.current, 16000);
        }
      }, 300);
      await startMeeting(callType);
    } catch (error) {
      console.error('Error starting screen share:', error);
      toast({
        title: "Failed to start screen sharing",
        description: webRTCError || "Please make sure you have granted the necessary permissions.",
        variant: "destructive",
      });
    }
  }, [user, startMeeting, toast, startScreenShare, webRTCError, connectMixedAudio, extractAudioStreams]);

  // End call: stop audio streaming and screen share
  const handleEndCall = useCallback(() => {
    disconnectMixedAudio();
    setShowMeetingDialog(true);
  }, [disconnectMixedAudio]);

  // Cleanup on unmount or when call ends
  useEffect(() => {
    if (!isScreenSharing) {
      disconnectMixedAudio();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScreenSharing]);

  // For demonstration: log transcripts
  useEffect(() => {
    if (liveTranscript) {
      console.log('Live Transcript:', liveTranscript);
    }
    if (fullTranscript) {
      console.log('Full Transcript:', fullTranscript);
    }
  }, [liveTranscript, fullTranscript]);

  const handleSaveMeeting = useCallback(async (title: string, transcript: string, summary: string) => {
    if (!activeMeeting && !user) return;
    try {
      const insightsForSaving = [
        { type: 'emotions', data: insights.emotions },
        { type: 'painPoints', data: insights.painPoints },
        { type: 'objections', data: insights.objections },
        { type: 'recommendations', data: insights.recommendations },
        { type: 'nextActions', data: insights.nextActions }
      ];
      const meetingId = await Promise.race([
        endMeeting(transcript, summary, insightsForSaving),
        new Promise<any>((_, reject) =>
          setTimeout(() => reject(new Error('Meeting save timeout')), 15000)
        )
      ]);
      if (meetingId) {
        await updateMeeting(meetingId, { title });
        toast({
          title: "Meeting saved",
          description: "Your meeting has been successfully saved.",
        });
      }
    } catch (error) {
      console.error("Error saving meeting:", error);
      toast({
        title: "Error saving meeting",
        description: "There was a problem saving your meeting data. Please try again.",
        variant: "destructive"
      });
    } finally {
      // Always clear state to ensure UI is correct
      stopScreenShare();
      setShowMeetingDialog(false);
      setUiCallDuration(0);
      setActiveMeeting(null);
    }
  }, [activeMeeting, user, insights, endMeeting, updateMeeting, toast, checklist, notes, setActiveMeeting, stopScreenShare]);

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

  return (
    <MainLayout>
      <MeetingWorkspace
        isCallActive={isCallActive}
        transcript={fullTranscript}
        insights={insights}
      />
      <ScreenSharePreview
        stream={stream}
        isActive={isScreenSharing}
      />
      <CallTimer
        isActive={isCallActive}
        onDurationChange={setUiCallDuration}
      />
      <div className="bg-card border-t border-border p-4">
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
      </div>
      <MeetingEndDialog
        isOpen={showMeetingDialog}
        onClose={() => setShowMeetingDialog(false)}
        onSave={(title, transcript, summary) => handleSaveMeeting(title, transcript, summary)}
        transcript={transcript}
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
      {/* Optionally, display WebSocket status and errors for debugging */}
      <div style={{ margin: '1rem 0', color: wsStatus === 'error' ? 'red' : 'inherit' }}>
        WebSocket Status: {wsStatus} {wsError && `- ${wsError}`}
        {isStreaming && <span style={{ color: 'green', marginLeft: 8 }}>(Streaming audio...)</span>}
      </div>
    </MainLayout>
  );
};

export default Index;
