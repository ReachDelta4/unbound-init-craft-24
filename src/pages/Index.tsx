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
  const { insights, generateSummary } = useSampleData();
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
  const [showEndCallConfirmation, setShowEndCallConfirmation] = useState(false);
  const [uiCallDuration, setUiCallDuration] = useState(0);
  
  // Refs for storing latest data that might need to be auto-saved
  const tempTranscriptRef = useRef("");
  const tempSummaryRef = useRef("");
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Format transcript for saving - moved up before it's used in useEffect
  const formatTranscript = useCallback((sentences: string[]) => {
    if (!sentences || sentences.length === 0) return "";
    
    // Join sentences with double line breaks for better readability
    return sentences.join('\n\n');
  }, []);

  // Keep transcript data updated in refs for potential auto-save
  useEffect(() => {
    if (fullTranscript) {
      tempTranscriptRef.current = formatTranscript(fullTranscript.split('\n').filter(Boolean));
    }
  }, [fullTranscript, formatTranscript]);

  // Generate and store summary periodically
  useEffect(() => {
    if (activeMeeting?.status === 'active') {
      // Update summary every 30 seconds during an active call
      const summaryInterval = setInterval(() => {
        tempSummaryRef.current = generateSummary();
      }, 30000);
      
      return () => clearInterval(summaryInterval);
    }
  }, [activeMeeting?.status, generateSummary]);

  // Auto-save logic for unexpected termination
  useEffect(() => {
    // Setup emergency auto-save in case browser crashes or user force-closes
    const setupEmergencyAutoSave = () => {
      if (activeMeeting?.status === 'active' && user) {
        // Clear any existing timeout
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }
        
        // Schedule an auto-save every 2 minutes
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
            
            // Quietly save a backup without affecting UI
            await endMeeting(transcript, summary, insightsForSaving);
            console.log("Auto-saved meeting backup at", new Date().toISOString());
            
            // Schedule the next auto-save
            setupEmergencyAutoSave();
          } catch (error) {
            console.error("Failed to auto-save meeting:", error);
            // Still try again after a failure
            setupEmergencyAutoSave();
          }
        }, 120000); // Every 2 minutes
      }
    };
    
    setupEmergencyAutoSave();
    
    // Also save immediately when the meeting dialog is shown (before user input)
    if (showMeetingDialog && activeMeeting?.status === 'active' && user) {
      const immediateBackup = async () => {
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
          
          // Save with a default title to ensure data is captured
          const meetingId = await endMeeting(transcript, summary, insightsForSaving);
          if (meetingId) {
            await updateMeeting(meetingId, { title: "Auto-saved Meeting" });
            console.log("Immediate backup saved at", new Date().toISOString());
          }
        } catch (error) {
          console.error("Failed to create immediate backup:", error);
        }
      };
      
      immediateBackup();
    }
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [activeMeeting?.status, user, endMeeting, insights, generateSummary, showMeetingDialog, updateMeeting, tempTranscriptRef, tempSummaryRef]);
  
  // Enhanced browser close warning with emergency save
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Show warning when either active call or saving dialog is open
      if ((activeMeeting && activeMeeting.status === 'active') || showMeetingDialog) {
        e.preventDefault();
        e.returnValue = "You have a call in progress or unsaved meeting data. Are you sure you want to leave?";
        
        // Try to save data immediately in case user forces close
        if (activeMeeting && user) {
          try {
            // Use sendBeacon for reliable data sending during page unload
            const transcript = tempTranscriptRef.current;
            const summary = tempSummaryRef.current || generateSummary();
            
            const insightsForSaving = [
              { type: 'emotions', data: insights.emotions },
              { type: 'painPoints', data: insights.painPoints },
              { type: 'objections', data: insights.objections },
              { type: 'recommendations', data: insights.recommendations },
              { type: 'nextActions', data: insights.nextActions }
            ];
            
            // Create a FormData object to send via beacon
            const emergencyData = {
              userId: user.id,
              meetingId: activeMeeting.id,
              transcript: transcript,
              summary: summary,
              insights: insightsForSaving,
              timestamp: new Date().toISOString(),
              title: "Emergency Auto-saved Meeting"
            };
            
            // Store in localStorage as a backup
            localStorage.setItem('emergency_meeting_backup', JSON.stringify(emergencyData));
            
            // Try to save via normal API if possible
            setTimeout(() => {
              endMeeting(transcript, summary, insightsForSaving)
                .then(meetingId => {
                  if (meetingId) {
                    updateMeeting(meetingId, { title: "Emergency Auto-saved Meeting" });
                    console.log("Emergency save completed");
                    // Clear localStorage backup if successful
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
    
    // Check for any emergency backups from previous session
    const checkForEmergencyBackup = async () => {
      try {
        const backupData = localStorage.getItem('emergency_meeting_backup');
        if (backupData && user) {
          const data = JSON.parse(backupData);
          
          // Only process if it belongs to current user
          if (data.userId === user.id) {
            console.log("Found emergency backup, attempting to restore...");
            
            // Try to save the backup data
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
            
            // Clear the backup
            localStorage.removeItem('emergency_meeting_backup');
          }
        }
      } catch (error) {
        console.error("Failed to process emergency backup:", error);
      }
    };
    
    // Run recovery check when component mounts and user is available
    if (user) {
      checkForEmergencyBackup();
    }
    
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [activeMeeting, showMeetingDialog, user, endMeeting, updateMeeting, insights, generateSummary, tempTranscriptRef, tempSummaryRef, toast]);

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

  // End call: show confirmation dialog first
  const handleEndCall = useCallback(() => {
    setShowEndCallConfirmation(true);
  }, []);

  // Confirm end call: stop audio streaming and screen share, then show save dialog
  const handleConfirmEndCall = useCallback(() => {
    setShowEndCallConfirmation(false);
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
      // Ensure we're using the actual transcript from the call
      const transcriptToSave = transcript || tempTranscriptRef.current || "";
      const summaryToSave = summary || tempSummaryRef.current || "";
      
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
          endMeeting(transcriptToSave, summaryToSave, insightsForSaving),
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
      
      // Clear temporary data
      tempTranscriptRef.current = "";
      tempSummaryRef.current = "";
      
      // Clear any pending auto-save
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
          className="mb-14"
        />
        <ScreenSharePreview
          stream={stream}
          isActive={isScreenSharing}
        />
        <CallTimer
          isActive={isCallActive}
          onDurationChange={setUiCallDuration}
        />
        <div className="bg-card border-t border-border fixed bottom-0 left-0 right-0 py-2 px-4 shadow-md z-10">
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
          {!isUIBlocked && (
            <div className="text-xs text-center text-muted-foreground mt-1">
              {wsStatus === 'connected' && isStreaming ? (
                <span className="flex items-center justify-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  Transcription active
                </span>
              ) : wsStatus === 'error' ? (
                <span className="text-red-500">Transcription error - reconnect to try again</span>
              ) : wsStatus === 'connecting' ? (
                <span>Connecting to transcription service...</span>
              ) : (
                <span>Transcription ready</span>
              )}
            </div>
          )}
        </div>
      </div>
      
      <MeetingEndDialog
        isOpen={showMeetingDialog}
        onClose={() => setShowMeetingDialog(false)}
        onSave={(title, transcript, summary) => handleSaveMeeting(title, transcript, summary)}
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
