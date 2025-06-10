
import { useEffect, useCallback } from 'react';
import { useMeetingContext } from '@/components/meeting/MeetingProvider';
import { useEmergencyAutoSave } from '@/hooks/useEmergencyAutoSave';

interface UseMeetingEffectsProps {
  tempTranscriptRef: React.MutableRefObject<string>;
  tempSummaryRef: React.MutableRefObject<string>;
  setUiCallDuration: (duration: number) => void;
}

export const useMeetingEffects = ({
  tempTranscriptRef,
  tempSummaryRef,
  setUiCallDuration
}: UseMeetingEffectsProps) => {
  const {
    activeMeeting,
    user,
    insights,
    endMeeting,
    updateMeeting,
    fullTranscript,
    generateSummary,
    isScreenSharing,
    endCall,
    setConnectionTimedOut
  } = useMeetingContext();

  const {
    createEmergencyBackup,
    checkForEmergencyBackup,
    cleanup: cleanupAutoSave
  } = useEmergencyAutoSave(activeMeeting, user, endMeeting, insights, generateSummary);

  const formatTranscript = useCallback((sentences: string[]) => {
    if (!sentences || sentences.length === 0) return "";
    return sentences.join('\n\n');
  }, []);

  // Update transcript ref when fullTranscript changes
  useEffect(() => {
    if (fullTranscript) {
      tempTranscriptRef.current = formatTranscript(fullTranscript.split('\n').filter(Boolean));
    }
  }, [fullTranscript, formatTranscript, tempTranscriptRef]);

  // Update summary ref periodically during active meetings
  useEffect(() => {
    if (activeMeeting?.status === 'active') {
      const summaryInterval = setInterval(() => {
        tempSummaryRef.current = generateSummary();
      }, 30000);
      
      return () => clearInterval(summaryInterval);
    }
  }, [activeMeeting?.status, generateSummary, tempSummaryRef]);

  // Emergency auto-save setup
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

  // Reset connection timeout when meeting ends
  useEffect(() => {
    if (!activeMeeting || activeMeeting.status !== 'active') {
      setConnectionTimedOut(false);
    }
  }, [activeMeeting, setConnectionTimedOut]);

  // End call when screen sharing stops
  useEffect(() => {
    if (!isScreenSharing) {
      endCall();
    }
  }, [isScreenSharing, endCall]);

  // End call when meeting becomes inactive
  useEffect(() => {
    if (!activeMeeting || activeMeeting.status !== 'active') {
      endCall();
    }
  }, [activeMeeting, endCall]);

  // Reset UI call duration when meeting ends
  useEffect(() => {
    if (!activeMeeting || activeMeeting.status !== 'active') {
      setUiCallDuration(0);
    }
  }, [activeMeeting, setUiCallDuration]);

  return {
    formatTranscript
  };
};
