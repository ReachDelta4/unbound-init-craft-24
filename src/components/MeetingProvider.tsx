import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { useCallManager } from '@/hooks/useCallManager';
import { useSentenceProcessor } from '@/hooks/useSentenceProcessor';
import { TranscriptionWSStatus } from '@/hooks/useTranscriptionWebSocket';

interface MeetingContextType {
  // Call status
  isCallActive: boolean;
  isScreenSharing: boolean;
  startCall: () => void;
  endCall: () => void;
  toggleScreenShare: () => void;
  
  // Transcription
  liveTranscript: string;
  fullTranscript: string;
  transcriptionStatus: TranscriptionWSStatus;
  
  // Insights
  insights: {
    emotions: Array<{ emotion: string; level: number }>;
    painPoints: string[];
    objections: string[];
    recommendations: string[];
    nextActions: string[];
  };
  clientEmotion: string;
  clientInterest: number;
  callStage: string;
  aiCoachingSuggestion: string;
  
  // Gemini response
  lastGeminiResponse: string | null;
}

const MeetingContext = createContext<MeetingContextType | undefined>(undefined);

export const useMeeting = (): MeetingContextType => {
  const context = useContext(MeetingContext);
  if (!context) {
    throw new Error('useMeeting must be used within a MeetingProvider');
  }
  return context;
};

const MeetingProviderComponent: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    isCallActive,
    isScreenSharing,
    startCall,
    endCall,
    toggleScreenShare,
    liveTranscript,
    fullTranscript,
    transcriptionStatus,
    insights,
    clientEmotion,
    clientInterest,
    callStage,
    aiCoachingSuggestion,
    lastGeminiResponse,
  } = useCallManager();

  // Create the context value object with all properties explicitly listed
  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    isCallActive,
    isScreenSharing,
    startCall,
    endCall,
    toggleScreenShare,
    liveTranscript,
    fullTranscript,
    transcriptionStatus,
    insights,
    clientEmotion,
    clientInterest,
    callStage,
    aiCoachingSuggestion,
    lastGeminiResponse,
  }), [
    isCallActive,
    isScreenSharing,
    startCall,
    endCall,
    toggleScreenShare,
    liveTranscript,
    fullTranscript,
    transcriptionStatus,
    insights,
    clientEmotion,
    clientInterest,
    callStage,
    aiCoachingSuggestion,
    lastGeminiResponse,
  ]);

  return (
    <MeetingContext.Provider value={contextValue}>
      {children}
    </MeetingContext.Provider>
  );
}; 

// Export a memoized version of the provider to prevent unnecessary re-renders
export const MeetingProvider = React.memo(MeetingProviderComponent); 