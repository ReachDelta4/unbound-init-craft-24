
import React, { createContext, useContext, ReactNode } from 'react';
import { useMeetingState } from '@/hooks/use-meeting-state';
import { usePhi3Context } from '@/contexts/Phi3Context';
import { useCallManager } from '@/hooks/useCallManager';
import { useAuth } from '@/contexts/AuthContext';

interface MeetingContextValue {
  // Meeting state
  activeMeeting: any;
  isCreatingMeeting: boolean;
  isSavingMeeting: boolean;
  savingProgress: number;
  startMeeting: (type: string) => Promise<void>;
  endMeeting: (transcript: string, summary: string, insights: any[]) => Promise<string | null>;
  updateMeeting: (id: string, data: any) => Promise<void>;
  setActiveMeeting: (meeting: any) => void;

  // AI insights from Phi-3
  insights: any;
  generateSummary: () => string;

  // Call manager
  isScreenSharing: boolean;
  webRTCStream: MediaStream | null;
  webRTCError: string | null;
  wsStatus: string;
  wsError: string | null;
  liveTranscript: string;
  fullTranscript: string | null;
  isStreaming: boolean;
  connectionTimedOut: boolean;
  setConnectionTimedOut: (value: boolean) => void;
  startCall: (callType: string, startMeeting: (type: string) => Promise<void>, user: any) => Promise<void>;
  endCall: () => void;
  reconnectTranscription: () => void;
  handleConnectionTimeout: () => void;
  micStreamRef: React.MutableRefObject<MediaStream | null>;
  systemStreamRef: React.MutableRefObject<MediaStream | null>;

  // Auth
  user: any;
}

const MeetingContext = createContext<MeetingContextValue | undefined>(undefined);

export const useMeetingContext = () => {
  const context = useContext(MeetingContext);
  if (!context) {
    throw new Error('useMeetingContext must be used within a MeetingProvider');
  }
  return context;
};

interface MeetingProviderProps {
  children: ReactNode;
}

export const MeetingProvider = ({ children }: MeetingProviderProps) => {
  const { user } = useAuth();
  
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

  // Get AI insights from Phi-3 context instead of sample data
  const { insights } = usePhi3Context();
  
  const callManager = useCallManager();

  // Generate summary from Phi-3 insights
  const generateSummary = () => {
    if (!insights || (!insights.painPoints?.length && !insights.recommendations?.length)) {
      return "AI-generated summary will appear here after the call has some transcript data.";
    }
    
    let summary = "Meeting Summary:\n\n";
    
    if (insights.painPoints?.length > 0) {
      summary += "Key Pain Points:\n";
      insights.painPoints.forEach((point: string, index: number) => {
        summary += `${index + 1}. ${point}\n`;
      });
      summary += "\n";
    }
    
    if (insights.recommendations?.length > 0) {
      summary += "Recommendations:\n";
      insights.recommendations.forEach((rec: string, index: number) => {
        summary += `${index + 1}. ${rec}\n`;
      });
      summary += "\n";
    }
    
    if (insights.nextActions?.length > 0) {
      summary += "Next Actions:\n";
      insights.nextActions.forEach((action: string, index: number) => {
        summary += `${index + 1}. ${action}\n`;
      });
    }
    
    return summary;
  };

  const value: MeetingContextValue = {
    // Meeting state
    activeMeeting,
    isCreatingMeeting,
    isSavingMeeting,
    savingProgress,
    startMeeting,
    endMeeting,
    updateMeeting,
    setActiveMeeting,

    // AI insights from Phi-3
    insights,
    generateSummary,

    // Call manager
    ...callManager,

    // Auth
    user
  };

  return (
    <MeetingContext.Provider value={value}>
      {children}
    </MeetingContext.Provider>
  );
};
