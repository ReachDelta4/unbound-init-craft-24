import React from "react";
import MeetingWorkspace from "./MeetingWorkspace";
import { TranscriptionWSStatus } from "@/hooks/useTranscriptionWebSocket";

interface MeetingMainAreaProps {
  showControls: boolean;
  isCallActive: boolean;
  transcript: string;
  insights: {
    emotions: Array<{ emotion: string; level: number }>;
    painPoints: string[];
    objections: string[];
    recommendations: string[];
    nextActions: string[];
  };
  realtimeText: string;
  fullSentences: string[];
  transcriptionStatus: TranscriptionWSStatus;
  transcriptionError: string | null;
  onReconnectTranscription: () => void;
  stream: MediaStream | null;
  lastGeminiResponse?: string | null;
}

const MeetingMainArea = ({
  showControls,
  isCallActive,
  transcript,
  insights,
  realtimeText,
  fullSentences,
  transcriptionStatus,
  transcriptionError,
  onReconnectTranscription,
  stream,
  lastGeminiResponse
}: MeetingMainAreaProps) => {
  return (
    <div 
      className="flex-1 overflow-hidden"
      style={{ 
        height: showControls ? 'calc(100vh - 80px)' : '100vh',
        transition: 'height 0.3s ease-in-out'
      }}
    >
      <MeetingWorkspace
        isCallActive={isCallActive}
        transcript={transcript}
        insights={insights}
        realtimeText={realtimeText}
        fullSentences={fullSentences}
        transcriptionStatus={transcriptionStatus}
        transcriptionError={transcriptionError}
        onReconnectTranscription={onReconnectTranscription}
        stream={stream}
        lastGeminiResponse={lastGeminiResponse}
      />
    </div>
  );
};

export default MeetingMainArea;
