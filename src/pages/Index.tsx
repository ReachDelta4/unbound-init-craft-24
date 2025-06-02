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
import WebSocketConnectionPopup from "@/components/meeting/WebSocketConnectionPopup";

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
    reconnectAttempts,
    setAutoReconnect
  } = useMixedAudioWebSocket();

  // State for connection popup
  const [showConnectionPopup, setShowConnectionPopup] = useState(false);
  // State for tracking connection timeout
  const [connectionTimedOut, setConnectionTimedOut] = useState(false);

  // Store the mic and system audio streams
  const micStreamRef = useRef<MediaStream | null>(null);
  const systemStreamRef = useRef<MediaStream | null>(null);

  // Helper to extract mic and system audio tracks from the combined stream
  const extractAudioStreams = useCallback((combinedStream: MediaStream) => {
    const audioTracks = combinedStream.getAudioTracks();
    
    // Reset references
    micStreamRef.current = null;
    systemStreamRef.current = null;
    
    if (audioTracks.length === 0) {
      console.warn('No audio tracks found in the combined stream');
      // Create dummy streams to avoid errors
      micStreamRef.current = new MediaStream();
      systemStreamRef.current = new MediaStream();
      return;
    }
    
    if (audioTracks.length === 1) {
      // Only one audio track (likely mic only)
      console.log('Only one audio track found, using it for both mic and system');
      const singleTrack = audioTracks[0];
      micStreamRef.current = new MediaStream([singleTrack]);
      // Create a clone of the track for system audio
      systemStreamRef.current = new MediaStream([singleTrack.clone()]);
      return;
    }
    
    // We have multiple audio tracks, try to identify which is which
    // Track at index 0 is typically the microphone from getUserMedia
    // Track at index 1 is typically the system audio from getDisplayMedia
    const micTrack = audioTracks[0];
    const systemTrack = audioTracks[1];
    
    // Check labels to confirm if possible
    const isMicTrack = (track: MediaStreamTrack) => 
      track.label.toLowerCase().includes('microphone') || 
      track.label.toLowerCase().includes('mic');
      
    const isSystemTrack = (track: MediaStreamTrack) => 
      track.label.toLowerCase().includes('system') || 
      track.label.toLowerCase().includes('screen') ||
      track.label.toLowerCase().includes('display');
    
    // If we can clearly identify the tracks by label, use that information
    if (isMicTrack(micTrack) && isSystemTrack(systemTrack)) {
      // Labels confirm our assumption
      micStreamRef.current = new MediaStream([micTrack]);
      systemStreamRef.current = new MediaStream([systemTrack]);
    } else if (isMicTrack(systemTrack) && isSystemTrack(micTrack)) {
      // Labels indicate our assumption was wrong, swap them
      micStreamRef.current = new MediaStream([systemTrack]);
      systemStreamRef.current = new MediaStream([micTrack]);
    } else {
      // Can't clearly identify by label, use default order
      console.log('Using default track order: track[0]=mic, track[1]=system');
      micStreamRef.current = new MediaStream([micTrack]);
      systemStreamRef.current = new MediaStream([systemTrack]);
    }
    
    // Log what we found for debugging
    console.log('Extracted audio tracks:', {
      micTrack: micStreamRef.current?.getAudioTracks()[0]?.label,
      systemTrack: systemStreamRef.current?.getAudioTracks()[0]?.label
    });
  }, []);

  const [showMeetingDialog, setShowMeetingDialog] = useState(false);
  const [uiCallDuration, setUiCallDuration] = useState(0);

  // Monitor WebSocket connection status
  useEffect(() => {
    if (activeMeeting && activeMeeting.status === 'active') {
      // Show connection popup if websocket is connecting or has error
      if (wsStatus === 'connecting' || wsStatus === 'error') {
        setShowConnectionPopup(true);
      } else if (wsStatus === 'connected') {
        setShowConnectionPopup(false);
        setConnectionTimedOut(false);
      }
    } else {
      // Hide popup if no active meeting
      setShowConnectionPopup(false);
    }
  }, [wsStatus, activeMeeting]);

  // Reset timeout state when meeting status changes
  useEffect(() => {
    if (!activeMeeting || activeMeeting.status !== 'active') {
      setConnectionTimedOut(false);
    }
  }, [activeMeeting]);

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

  // Handle connection timeout
  const handleConnectionTimeout = useCallback(() => {
    setConnectionTimedOut(true);
    toast({
      title: "Connection Issue",
      description: "Could not connect to the transcription service. You can continue, but transcription will not be available.",
      variant: "destructive",
    });
    // Disable auto-reconnect after timeout
    setAutoReconnect(false);
  }, [toast, setAutoReconnect]);

  // Start call: start screen share, then start mixed audio streaming
  const handleStartCall = useCallback(async (callType: string) => {
    if (!callType || !user) return;
    try {
      // Reset connection timeout state
      setConnectionTimedOut(false);
      // Enable auto-reconnect
      setAutoReconnect(true);
      
      // Start screen sharing which will capture both video and system audio
      const combinedStream = await startScreenShare();
      
      // Extract and identify microphone and system audio tracks
      extractAudioStreams(combinedStream);
      
      // Check if we have valid audio streams
      if (!micStreamRef.current?.getAudioTracks().length) {
        console.warn('No microphone audio track found, attempting to get mic access separately');
        try {
          // Fallback: get microphone separately if not in combined stream
          const micOnlyStream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
          micStreamRef.current = micOnlyStream;
        } catch (micError) {
          console.error('Failed to get microphone access:', micError);
          toast({
            title: "Microphone access failed",
            description: "We couldn't access your microphone. Audio transcription may be limited.",
            variant: "destructive",
          });
        }
      }
      
      // If system audio is missing, create a silent stream as fallback
      if (!systemStreamRef.current?.getAudioTracks().length) {
        console.warn('No system audio track found, creating silent fallback');
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const silentOsc = audioContext.createOscillator();
        const silentGain = audioContext.createGain();
        silentGain.gain.value = 0; // Silent
        silentOsc.connect(silentGain);
        silentGain.connect(audioContext.destination);
        silentOsc.start();
        
        const silentDest = audioContext.createMediaStreamDestination();
        silentGain.connect(silentDest);
        systemStreamRef.current = silentDest.stream;
      }
      
      // Log available tracks for debugging
      console.log('Audio Tracks for WebSocket:', {
        mic: micStreamRef.current?.getAudioTracks().map(t => t.label) || [],
        system: systemStreamRef.current?.getAudioTracks().map(t => t.label) || []
      });
      
      // Wait a moment to ensure streams are ready, then connect to websocket
      setTimeout(() => {
        if (micStreamRef.current && systemStreamRef.current) {
          connectMixedAudio(micStreamRef.current, systemStreamRef.current, 16000);
        } else {
          console.error('Failed to prepare audio streams for websocket');
        }
      }, 500); // Increased timeout for better reliability
      
      await startMeeting(callType);
    } catch (error) {
      console.error('Error starting screen share:', error);
      toast({
        title: "Failed to start screen sharing",
        description: webRTCError || "Please make sure you have granted the necessary permissions.",
        variant: "destructive",
      });
    }
  }, [user, startMeeting, toast, startScreenShare, webRTCError, connectMixedAudio, extractAudioStreams, setAutoReconnect]);

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
      
      // Create a proper AbortController for timeouts
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 15000);
      
      try {
        // Use the signal from AbortController
        const meetingId = await Promise.race([
          endMeeting(transcript, summary, insightsForSaving),
          new Promise((_, reject) => {
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
        // Always clear the timeout to prevent memory leaks
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
      // Always clear state to ensure UI is correct
      stopScreenShare();
      setShowMeetingDialog(false);
      setUiCallDuration(0);
      setActiveMeeting(null);
    }
  }, [activeMeeting, user, insights, endMeeting, updateMeeting, toast, stopScreenShare, setActiveMeeting]);

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

  // Determine if UI should be blocked
  const isUIBlocked = showConnectionPopup && !connectionTimedOut;

  return (
    <MainLayout>
      {/* Web Socket Connection Popup */}
      <WebSocketConnectionPopup 
        isOpen={showConnectionPopup && !connectionTimedOut} 
        onTimeout={handleConnectionTimeout}
        timeoutMs={30000}
        message={wsStatus === 'error' 
          ? `Connection error: ${wsError || 'Unable to connect to transcription service'}`
          : `Connecting to transcription service${reconnectAttempts > 0 ? ` (Attempt ${reconnectAttempts})` : ''}...`
        }
        title={wsStatus === 'error' ? "Connection Error" : "Establishing Connection"}
      />
      
      {/* Main UI with conditional pointer-events based on connection status */}
      <div className={isUIBlocked ? "pointer-events-none" : ""}>
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
      {!isUIBlocked && (
        <div style={{ margin: '1rem 0', color: wsStatus === 'error' ? 'red' : 'inherit' }}>
          WebSocket Status: {wsStatus} {wsError && `- ${wsError}`}
          {isStreaming && <span style={{ color: 'green', marginLeft: 8 }}>(Streaming audio...)</span>}
        </div>
      )}
    </MainLayout>
  );
};

export default Index;
