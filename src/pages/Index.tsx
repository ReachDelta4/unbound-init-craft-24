
import React, { useState, useEffect, useCallback } from "react";
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

const Index = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isCallActive, setIsCallActive] = useState(false);
  const [callType, setCallType] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [showMeetingDialog, setShowMeetingDialog] = useState(false);
  
  // Hooks
  const { 
    activeMeeting, 
    isCreatingMeeting, 
    isSavingMeeting,
    savingProgress,
    startMeeting, 
    endMeeting,
    updateMeeting
  } = useMeetingState();
  
  const { saveNotesToMeeting, isSaving: isSavingNotes } = useNotesState();
  const { insights, transcript, generateSummary } = useSampleData();

  // Auto save data periodically during active calls
  const [autoSavedData, setAutoSavedData] = useState({
    transcript: "",
    summary: "",
    insights: [] as any[]
  });

  // Redirect to auth page if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  // Implement auto-saving during active calls - more efficient
  useEffect(() => {
    let autoSaveInterval: NodeJS.Timeout;
    
    if (isCallActive && activeMeeting) {
      autoSaveInterval = setInterval(() => {
        // Update auto-saved data
        setAutoSavedData({
          transcript: transcript,
          summary: generateSummary(),
          insights: [
            { type: 'emotions', data: insights.emotions },
            { type: 'painPoints', data: insights.painPoints },
            { type: 'objections', data: insights.objections },
            { type: 'recommendations', data: insights.recommendations },
            { type: 'nextActions', data: insights.nextActions }
          ]
        });
      }, 30000); // Auto-save every 30 seconds
    }
    
    return () => {
      if (autoSaveInterval) clearInterval(autoSaveInterval);
    };
  }, [isCallActive, activeMeeting, transcript, insights, generateSummary]);

  // Optimized version with useCallback
  const handleStartCall = useCallback(async () => {
    if (!callType || !user) return;
    
    // Optimistic UI update - immediate feedback
    setIsCallActive(true);
    
    // Create a new meeting in the database (non-blocking)
    const meetingPromise = startMeeting(callType);
    
    // Don't block UI on database operations
    meetingPromise.catch(error => {
      console.error('Error in meeting creation:', error);
      // Only show error if critical
      if (!activeMeeting) {
        toast({
          title: "Meeting sync issue",
          description: "We've started your meeting but there might be issues saving it later.",
          variant: "destructive",
        });
      }
    });
  }, [callType, user, startMeeting, toast, activeMeeting]);

  // Optimized end call handling
  const handleEndCall = useCallback(() => {
    setIsCallActive(false);
    setShowMeetingDialog(true);
  }, []);

  // Optimized meeting save with progress
  const handleSaveMeeting = useCallback(async (title: string, transcript: string, summary: string) => {
    if (!activeMeeting && !user) return;
    
    try {
      // Prepare insights for saving
      const insightsForSaving = [
        { type: 'emotions', data: insights.emotions },
        { type: 'painPoints', data: insights.painPoints },
        { type: 'objections', data: insights.objections },
        { type: 'recommendations', data: insights.recommendations },
        { type: 'nextActions', data: insights.nextActions }
      ];
      
      // Update meeting and save insights - endpoint handles parallelization
      const meetingId = await endMeeting(transcript, summary, insightsForSaving);
      
      if (meetingId) {
        // Run these operations in parallel for better performance
        await Promise.all([
          // Update meeting title
          updateMeeting(meetingId, { title }),
          // Save notes to meeting
          saveNotesToMeeting(meetingId, [
            { type: 'markdown', content: { raw: transcript } }
          ])
        ]);
        
        setShowMeetingDialog(false);
        setCallDuration(0);
        setCallType(null);
        setAutoSavedData({ transcript: "", summary: "", insights: [] });
      }
    } catch (error) {
      console.error("Error saving meeting:", error);
      toast({
        title: "Error saving meeting",
        description: "There was a problem saving your meeting data. Please try again.",
        variant: "destructive"
      });
    }
  }, [activeMeeting, user, insights, endMeeting, updateMeeting, saveNotesToMeeting, toast]);

  if (!user) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <Button onClick={() => navigate("/auth")}>Sign In to Continue</Button>
        </div>
      </div>
    );
  }

  return (
    <MainLayout>
      <MeetingWorkspace 
        isCallActive={isCallActive} 
        transcript={transcript} 
        insights={insights}
      />

      {/* Call Timer - invisible component that manages the timer logic */}
      <CallTimer 
        isActive={isCallActive}
        onDurationChange={setCallDuration}
        initialDuration={callDuration}
      />

      {/* Meeting Controls at Bottom */}
      <div className="bg-card border-t border-border p-4">
        <MeetingControls 
          isCallActive={isCallActive}
          callType={callType}
          callDuration={callDuration}
          onCallTypeChange={setCallType}
          onStartCall={handleStartCall}
          onEndCall={handleEndCall}
          isLoading={isCreatingMeeting}
        />
      </div>

      {/* Meeting End Dialog */}
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
    </MainLayout>
  );
};

export default Index;
