
import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { useCallManager } from '@/hooks/useCallManager';
import { TranscriptionWSStatus } from '@/hooks/useTranscriptionWebSocket';

interface MeetingContextType {
  // Call status
  isCallActive: boolean;
  isScreenSharing: boolean;
  startCall: () => void;
  endCall: () => void;
  
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
  const callManager = useCallManager();

  // Create the context value object with all properties explicitly listed
  const contextValue = useMemo(() => ({
    isCallActive: callManager.isCallActive || false,
    isScreenSharing: callManager.isScreenSharing || false,
    startCall: () => callManager.startCall?.('video', async () => {}, null),
    endCall: callManager.endCall || (() => {}),
    liveTranscript: callManager.liveTranscript || '',
    fullTranscript: callManager.fullTranscript || '',
    transcriptionStatus: callManager.wsStatus as TranscriptionWSStatus || 'disconnected',
    insights: callManager.insights || {
      emotions: [],
      painPoints: [],
      objections: [],
      recommendations: [],
      nextActions: []
    },
    clientEmotion: callManager.clientEmotion || 'neutral',
    clientInterest: callManager.clientInterest || 50,
    callStage: callManager.callStage || 'Discovery',
    aiCoachingSuggestion: callManager.aiCoachingSuggestion || '',
    lastGeminiResponse: callManager.lastGeminiResponse || null,
  }), [callManager]);

  return (
    <MeetingContext.Provider value={contextValue}>
      {children}
    </MeetingContext.Provider>
  );
};

export const MeetingProvider = React.memo(MeetingProviderComponent);
