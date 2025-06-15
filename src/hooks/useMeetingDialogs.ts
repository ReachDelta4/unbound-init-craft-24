import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMeetingContext } from '@/components/meeting/MeetingProvider';

export const useMeetingDialogs = () => {
  const { toast } = useToast();
  const {
    activeMeeting,
    user,
    insights,
    endMeeting,
    updateMeeting,
    endCall,
    setActiveMeeting
  } = useMeetingContext();

  const [showMeetingDialog, setShowMeetingDialog] = useState(false);
  const [showEndCallConfirmation, setShowEndCallConfirmation] = useState(false);

  const handleSaveMeeting = useCallback(async (
    title: string, 
    transcript: string, 
    summary: string,
    tempTranscriptRef: React.MutableRefObject<string>,
    tempSummaryRef: React.MutableRefObject<string>
  ): Promise<void> => {
    if (!activeMeeting && !user) return;
    
    try {
      const transcriptToSave = transcript || tempTranscriptRef.current || "";
      const summaryToSave = summary || tempSummaryRef.current || "";
      
      const insightsForSaving = [
        { type: 'emotions', data: insights.emotions },
        { type: 'painPoints', data: insights.painPoints },
        { type: 'objections', data: insights.objections },
        { type: 'buyingSignals', data: insights.buyingSignals },
        { type: 'recommendations', data: insights.recommendations },
        { type: 'closingTechniques', data: insights.closingTechniques },
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
      setActiveMeeting(null);
      tempTranscriptRef.current = "";
      tempSummaryRef.current = "";
    }
  }, [activeMeeting, user, insights, endMeeting, updateMeeting, toast, endCall, setActiveMeeting]);

  const handleCloseMeetingDialog = useCallback(() => {
    endCall();
    setShowMeetingDialog(false);
    setActiveMeeting(null);
  }, [endCall, setActiveMeeting]);

  const handleEndCall = useCallback(() => {
    setShowEndCallConfirmation(true);
  }, []);

  const handleConfirmEndCall = useCallback(() => {
    setShowEndCallConfirmation(false);
    endCall();
    setShowMeetingDialog(true);
  }, [endCall]);

  return {
    showMeetingDialog,
    setShowMeetingDialog,
    showEndCallConfirmation,
    setShowEndCallConfirmation,
    handleSaveMeeting,
    handleCloseMeetingDialog,
    handleEndCall,
    handleConfirmEndCall
  };
};
