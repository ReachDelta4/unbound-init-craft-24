
import { useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface AutoSaveData {
  emotions: Array<{ emotion: string; level: number }>;
  painPoints: string[];
  objections: string[];
  recommendations: string[];
  nextActions: string[];
}

export const useEmergencyAutoSave = (
  activeMeeting: any,
  user: any,
  endMeeting: (transcript: string, summary: string, insights: any[]) => Promise<string | null>,
  insights: AutoSaveData,
  generateSummary: () => string
) => {
  const { toast } = useToast();
  const tempTranscriptRef = useRef("");
  const tempSummaryRef = useRef("");
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const createEmergencyBackup = useCallback((updateMeeting: (id: string, data: any) => Promise<void>) => {
    return (e: BeforeUnloadEvent) => {
      if ((activeMeeting && activeMeeting.status === 'active')) {
        e.preventDefault();
        e.returnValue = "You have a call in progress or unsaved meeting data. Are you sure you want to leave?";
        
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
  }, [activeMeeting, user, endMeeting, insights, generateSummary]);

  const checkForEmergencyBackup = useCallback(async (updateMeeting: (id: string, data: any) => Promise<void>) => {
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
  }, [user, endMeeting, toast]);

  const cleanup = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    setupEmergencyAutoSave();
    return cleanup;
  }, [setupEmergencyAutoSave, cleanup]);

  return {
    tempTranscriptRef,
    tempSummaryRef,
    setupEmergencyAutoSave,
    createEmergencyBackup,
    checkForEmergencyBackup,
    cleanup
  };
};
