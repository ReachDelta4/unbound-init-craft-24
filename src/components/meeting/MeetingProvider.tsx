
import React, { createContext, useContext, ReactNode } from 'react';
import { useMeetingState } from '@/hooks/use-meeting-state';
import { useSampleData } from '@/hooks/useSampleData';
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

  // Sample data
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

  const { insights, generateSummary } = useSampleData();
  
  const callManager = useCallManager();

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

    // Sample data
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
