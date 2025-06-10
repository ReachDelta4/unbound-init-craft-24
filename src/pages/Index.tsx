
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import MeetingControls from "@/components/MeetingControls";
import MeetingEndDialog from "@/components/MeetingEndDialog";
import EndCallConfirmationDialog from "@/components/EndCallConfirmationDialog";
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
  const { insights, generateSummary } = useSampleData();
  
  // Use the WebRTC hook for screen sharing - this is the main source of the stream
  const {
    startScreenShare,
    stopScreenShare,
    isScreenSharing,
    stream: webRTCStream,
    error: webRTCError
  } = useWebRTC();

  console.log('Index: WebRTC state:', {
    isScreenSharing,
    hasWebRTCStream: !!webRTCStream,
    webRTCStreamId: webRTCStream?.id,
    webRTCStreamActive: webRTCStream?.active,
    webRTCError
  });

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

  const [connectionTimedOut, setConnectionTimedOut] = useState(false);
  const micStreamRef = useRef<MediaStream | null>(null);
  const systemStreamRef = useRef<MediaStream | null>(null);
  const [showMeetingDialog, setShowMeetingDialog] = useState(false);
  const [showEndCallConfirmation, setShowEndCallConfirmation] = useState(false);
  const [uiCallDuration, setUiCallDuration] = useState(0);
  const tempTranscriptRef = useRef("");
  const tempSummaryRef = useRef("");
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Simple state for controlling the visibility of the controls bar
  const [showControls, setShowControls] = useState(true);

  // Emergency auto-save function
  const setupEmergencyAutoSave = useCallback(() => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
    if (activeMeeting?.status === 'active' && user) {
      autoSaveTimeoutRef.current = setTimeout(async () => {
        try {
          const transcript = tempTranscriptRef.current;
          const summary = tempSummaryRef.current || generateSummary();
          
          const insightsForSaving = [
            { type: 'emotions', data: insights.emotions },
            { type: 'painPoints', data: insights.painPoints },
            { type: 'objections', data: insights.objections },
            { type: 'recommendations', data: insights.recommendations },
            { type: 'nextActions', data: insights.nextActions }
          ];
          
          await endMeeting(transcript, summary, insightsForSaving);
          console.log("Auto-saved meeting backup at", new Date().toISOString());
          
          setupEmergencyAutoSave();
        } catch (error) {
          console.error("Failed to auto-save meeting:", error);
          setupEmergencyAutoSave();
        }
      }, 120000);
    }
  }, [activeMeeting?.status, user, endMeeting, insights, generateSummary]);

  const extractAudioStreams = useCallback((combinedStream: MediaStream) => {
    const audioTracks = combinedStream.getAudioTracks();
    
    micStreamRef.current = null;
    systemStreamRef.current = null;
    
    if (audioTracks.length === 0) {
      console.warn('No audio tracks found in the combined stream');
      micStreamRef.current = new MediaStream();
      systemStreamRef.current = new MediaStream();
      return;
    }
    
    if (audioTracks.length === 1) {
      console.log('Only one audio track found, using it for both mic and system');
      const singleTrack = audioTracks[0];
      micStreamRef.current = new MediaStream([singleTrack]);
      systemStreamRef.current = new MediaStream([singleTrack.clone()]);
      return;
    }
    
    const micTrack = audioTracks[0];
    const systemTrack = audioTracks[1];
    
    const isMicTrack = (track: MediaStreamTrack) => 
      track.label.toLowerCase().includes('microphone') || 
      track.label.toLowerCase().includes('mic');
      
    const isSystemTrack = (track: MediaStreamTrack) => 
      track.label.toLowerCase().includes('system') || 
      track.label.toLowerCase().includes('screen') ||
      track.label.toLowerCase().includes('display');
    
    if (isMicTrack(micTrack) && isSystemTrack(systemTrack)) {
      micStreamRef.current = new MediaStream([micTrack]);
      systemStreamRef.current = new MediaStream([systemTrack]);
    } else if (isMicTrack(systemTrack) && isSystemTrack(micTrack)) {
      micStreamRef.current = new MediaStream([systemTrack]);
      systemStreamRef.current = new MediaStream([micTrack]);
    } else {
      console.log('Using default track order: track[0]=mic, track[1]=system');
      micStreamRef.current = new MediaStream([micTrack]);
      systemStreamRef.current = new MediaStream([systemTrack]);
    }
    
    console.log('Extracted audio tracks:', {
      micTrack: micStreamRef.current?.getAudioTracks()[0]?.label,
      systemTrack: systemStreamRef.current?.getAudioTracks()[0]?.label
    });
  }, []);

  const formatTranscript = useCallback((sentences: string[]) => {
    if (!sentences || sentences.length === 0) return "";
    return sentences.join('\n\n');
  }, []);

  useEffect(() => {
    if (fullTranscript) {
      tempTranscriptRef.current = formatTranscript(fullTranscript.split('\n').filter(Boolean));
    }
  }, [fullTranscript, formatTranscript]);

  useEffect(() => {
    if (activeMeeting?.status === 'active') {
      const summaryInterval = setInterval(() => {
        tempSummaryRef.current = generateSummary();
      }, 30000);
      
      return () => clearInterval(summaryInterval);
    }
  }, [activeMeeting?.status, generateSummary]);

  useEffect(() => {
    setupEmergencyAutoSave();
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [setupEmergencyAutoSave]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if ((activeMeeting && activeMeeting.status === 'active') || showMeetingDialog) {
        e.preventDefault();
        e.returnValue = "You have a call in progress or unsaved meeting data. Are you sure you want to leave?";
        
        // Make sure to stop screen sharing when leaving the page
        if (isScreenSharing) {
          stopScreenShare();
        }
        
        if (activeMeeting && user) {
          try {
            const transcript = tempTranscriptRef.current;
            const summary = tempSummaryRef.current || generateSummary();
            
            const insightsForSaving = [
              { type: 'emotions', data: insights.emotions },
              { type: 'painPoints', data: insights.painPoints },
              { type: 'objections', data: insights.objections },
              { type: 'recommendations', data: insights.recommendations },
              { type: 'nextActions', data: insights.nextActions }
            ];
            
            const emergencyData = {
              userId: user.id,
              meetingId: activeMeeting.id,
              transcript: transcript,
              summary: summary,
              insights: insightsForSaving,
              timestamp: new Date().toISOString(),
              title: "Emergency Auto-saved Meeting"
            };
            
            localStorage.setItem('emergency_meeting_backup', JSON.stringify(emergencyData));
            
            setTimeout(() => {
              endMeeting(transcript, summary, insightsForSaving)
                .then(meetingId => {
                  if (meetingId) {
                    updateMeeting(meetingId, { title: "Emergency Auto-saved Meeting" });
                    console.log("Emergency save completed");
                    localStorage.removeItem('emergency_meeting_backup');
                  }
                })
                .catch(err => console.error("Emergency save failed:", err));
            }, 0);
          } catch (error) {
            console.error("Failed to prepare emergency save:", error);
          }
        }
      }
    };
    
    window.addEventListener("beforeunload", handleBeforeUnload);
    
    const checkForEmergencyBackup = async () => {
      try {
        const backupData = localStorage.getItem('emergency_meeting_backup');
        if (backupData && user) {
          const data = JSON.parse(backupData);
          
          if (data.userId === user.id) {
            console.log("Found emergency backup, attempting to restore...");
            
            const meetingId = await endMeeting(
              data.transcript || "",
              data.summary || "",
              data.insights || []
            );
            
            if (meetingId) {
              await updateMeeting(meetingId, { title: "Recovered Meeting" });
              toast({
                title: "Meeting recovered",
                description: "We've recovered meeting data from your previous session.",
              });
            }
            
            localStorage.removeItem('emergency_meeting_backup');
          }
        }
      } catch (error) {
        console.error("Failed to process emergency backup:", error);
      }
    };
    
    if (user) {
      checkForEmergencyBackup();
    }
    
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [activeMeeting, showMeetingDialog, user, endMeeting, updateMeeting, insights, generateSummary, toast, isScreenSharing, stopScreenShare]);

  useEffect(() => {
    if (!activeMeeting || activeMeeting.status !== 'active') {
      setConnectionTimedOut(false);
    }
  }, [activeMeeting]);

  const handleConnectionTimeout = useCallback(() => {
    setConnectionTimedOut(true);
    toast({
      title: "Connection Issue",
      description: "Could not connect to the transcription service. You can continue, but transcription will not be available.",
      variant: "destructive",
    });
    setAutoReconnect(false);
  }, [toast, setAutoReconnect]);

  const handleStartCall = useCallback(async (callType: string) => {
    if (!callType || !user) return;
    try {
      setConnectionTimedOut(false);
      setAutoReconnect(true);
      
      console.log('Index: Starting call with screen share');
      const combinedStream = await startScreenShare();
      console.log('Index: Screen share started, stream:', {
        id: combinedStream?.id,
        videoTracks: combinedStream?.getVideoTracks().length || 0,
        audioTracks: combinedStream?.getAudioTracks().length || 0,
        active: combinedStream?.active
      });
      
      extractAudioStreams(combinedStream);
      
      if (!micStreamRef.current?.getAudioTracks().length) {
        console.warn('No microphone audio track found, attempting to get mic access separately');
        try {
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
      
      if (!systemStreamRef.current?.getAudioTracks().length) {
        console.warn('No system audio track found, creating silent fallback');
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const silentOsc = audioContext.createOscillator();
        const silentGain = audioContext.createGain();
        silentGain.gain.value = 0;
        silentOsc.connect(silentGain);
        silentGain.connect(audioContext.destination);
        silentOsc.start();
        
        const silentDest = audioContext.createMediaStreamDestination();
        silentGain.connect(silentDest);
        systemStreamRef.current = silentDest.stream;
      }
      
      console.log('Audio Tracks for WebSocket:', {
        mic: micStreamRef.current?.getAudioTracks().map(t => t.label) || [],
        system: systemStreamRef.current?.getAudioTracks().map(t => t.label) || []
      });
      
      setTimeout(() => {
        if (micStreamRef.current && systemStreamRef.current) {
          connectMixedAudio(micStreamRef.current, systemStreamRef.current, 16000);
        } else {
          console.error('Failed to prepare audio streams for websocket');
        }
      }, 500);
      
      await startMeeting(callType);
      console.log('Index: Meeting started successfully');
    } catch (error) {
      console.error('Error starting screen share:', error);
      toast({
        title: "Failed to start screen sharing",
        description: webRTCError || "Please make sure you have granted the necessary permissions.",
        variant: "destructive",
      });
    }
  }, [user, startMeeting, toast, startScreenShare, webRTCError, connectMixedAudio, extractAudioStreams, setAutoReconnect]);

  const handleEndCall = useCallback(() => {
    setShowEndCallConfirmation(true);
  }, []);

  const handleConfirmEndCall = useCallback(() => {
    setShowEndCallConfirmation(false);
    
    // Stop audio processing
    disconnectMixedAudio();
    
    // Stop screen sharing
    stopScreenShare();
    
    // Explicitly stop all tracks in micStreamRef and systemStreamRef
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => {
        console.log(`Explicitly stopping mic track: ${track.kind} - ${track.label}`);
        track.stop();
      });
      micStreamRef.current = null;
    }
    
    if (systemStreamRef.current) {
      systemStreamRef.current.getTracks().forEach(track => {
        console.log(`Explicitly stopping system track: ${track.kind} - ${track.label}`);
        track.stop();
      });
      systemStreamRef.current = null;
    }
    
    // Show meeting dialog
    setShowMeetingDialog(true);
  }, [disconnectMixedAudio, stopScreenShare]);

  useEffect(() => {
    if (!isScreenSharing) {
      disconnectMixedAudio();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScreenSharing]);

  // Add a new effect to ensure screen sharing stops when the active meeting changes
  useEffect(() => {
    if (!activeMeeting || activeMeeting.status !== 'active') {
      // Make sure screen sharing is stopped when call is no longer active
      stopScreenShare();
    }
  }, [activeMeeting, stopScreenShare]);

  useEffect(() => {
    if (liveTranscript) {
      console.log('Live Transcript:', liveTranscript);
    }
    if (fullTranscript) {
      console.log('Full Transcript:', fullTranscript);
    }
  }, [liveTranscript, fullTranscript]);

  // Simple effect for autohiding controls
  useEffect(() => {
    if (!activeMeeting || activeMeeting.status !== 'active') {
      setShowControls(true);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const { clientY } = e;
      const windowHeight = window.innerHeight;
      
      if (clientY > windowHeight - 100) {
        setShowControls(true);
      } else {
        setShowControls(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [activeMeeting]);

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
      // Ensure all screen sharing is stopped
      stopScreenShare();
      
      // Explicitly stop all tracks in micStreamRef and systemStreamRef
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => {
          console.log(`Explicitly stopping mic track on save: ${track.kind} - ${track.label}`);
          track.stop();
        });
        micStreamRef.current = null;
      }
      
      if (systemStreamRef.current) {
        systemStreamRef.current.getTracks().forEach(track => {
          console.log(`Explicitly stopping system track on save: ${track.kind} - ${track.label}`);
          track.stop();
        });
        systemStreamRef.current = null;
      }
      
      // Clean up UI state
      setShowMeetingDialog(false);
      setUiCallDuration(0);
      setActiveMeeting(null);
      
      tempTranscriptRef.current = "";
      tempSummaryRef.current = "";
      
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }
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
  const isUIBlocked = false;

  console.log('Index: Rendering with state:', {
    isCallActive,
    hasWebRTCStream: !!webRTCStream,
    webRTCStreamActive: webRTCStream?.active,
    isScreenSharing,
    activeMeetingStatus: activeMeeting?.status
  });

  return (
    <MainLayout>
      <div className={isUIBlocked ? "pointer-events-none" : ""}>
        <MeetingWorkspace
          isCallActive={isCallActive}
          transcript={fullTranscript || ""}
          insights={insights}
          realtimeText={liveTranscript}
          fullSentences={fullTranscript ? fullTranscript.split('\n').filter(Boolean) : []}
          transcriptionStatus={wsStatus}
          transcriptionError={wsError}
          onReconnectTranscription={() => {
            if (micStreamRef.current && systemStreamRef.current) {
              disconnectMixedAudio();
              setTimeout(() => {
                connectMixedAudio(micStreamRef.current!, systemStreamRef.current!, 16000);
              }, 500);
            }
          }}
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
      
      <MeetingEndDialog
        isOpen={showMeetingDialog}
        onClose={() => {
          // Stop screen sharing
          stopScreenShare();
          
          // Explicitly stop all tracks in micStreamRef and systemStreamRef
          if (micStreamRef.current) {
            micStreamRef.current.getTracks().forEach(track => {
              console.log(`Explicitly stopping mic track on dialog close: ${track.kind} - ${track.label}`);
              track.stop();
            });
            micStreamRef.current = null;
          }
          
          if (systemStreamRef.current) {
            systemStreamRef.current.getTracks().forEach(track => {
              console.log(`Explicitly stopping system track on dialog close: ${track.kind} - ${track.label}`);
              track.stop();
            });
            systemStreamRef.current = null;
          }
          
          // Clean up UI state
          setShowMeetingDialog(false);
          setUiCallDuration(0);
          setActiveMeeting(null);
        }}
        onSave={handleSaveMeeting}
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
      
      <EndCallConfirmationDialog
        isOpen={showEndCallConfirmation}
        onClose={() => setShowEndCallConfirmation(false)}
        onConfirm={handleConfirmEndCall}
      />
    </MainLayout>
  );
};

export default Index;
