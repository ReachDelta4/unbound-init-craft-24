
import { useState, useCallback, useRef } from 'react';
import { useMeetingContext } from '@/components/meeting/MeetingProvider';
import { useControlsVisibility } from '@/hooks/useControlsVisibility';
import { useMeetingDialogs } from '@/hooks/useMeetingDialogs';
import { useMeetingEffects } from '@/hooks/useMeetingEffects';

export const useMeetingPageLogic = () => {
  const meetingContext = useMeetingContext();
  const {
    activeMeeting,
    user,
    startCall,
    startMeeting,
    savingProgress,
    fullTranscript,
    generateSummary,
    insights
  } = meetingContext;

  const [uiCallDuration, setUiCallDuration] = useState(0);
  const tempTranscriptRef = useRef("");
  const tempSummaryRef = useRef("");

  const isCallActive = !!(activeMeeting && activeMeeting.status === 'active');
  const callType = activeMeeting?.platform || null;
  
  const { showControls, setShowControls } = useControlsVisibility(isCallActive);
  
  const dialogs = useMeetingDialogs();
  
  const { formatTranscript } = useMeetingEffects({
    tempTranscriptRef,
    tempSummaryRef,
    setUiCallDuration
  });

  const handleStartCall = useCallback(async (callType: string) => {
    await startCall(callType, startMeeting, user);
  }, [startCall, startMeeting, user]);

  const handleSaveMeetingWrapper = useCallback(async (title: string, transcript: string, summary: string) => {
    await dialogs.handleSaveMeeting(title, transcript, summary, tempTranscriptRef, tempSummaryRef);
    setUiCallDuration(0);
  }, [dialogs, setUiCallDuration]);

  return {
    // State
    isCallActive,
    callType,
    uiCallDuration,
    setUiCallDuration,
    showControls,
    setShowControls,
    
    // Dialogs
    ...dialogs,
    
    // Handlers
    handleStartCall,
    handleSaveMeeting: handleSaveMeetingWrapper,
    
    // Data
    fullTranscript: fullTranscript ? formatTranscript(fullTranscript.split('\n').filter(Boolean)) : "",
    summary: generateSummary(),
    insights: [
      { type: 'emotions', data: insights.emotions },
      { type: 'painPoints', data: insights.painPoints },
      { type: 'objections', data: insights.objections },
      { type: 'recommendations', data: insights.recommendations },
      { type: 'nextActions', data: insights.nextActions }
    ],
    savingProgress
  };
};
