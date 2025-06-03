import React from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import TranscriptPanel from "@/components/TranscriptPanel";
import InsightsPanel from "@/components/InsightsPanel";
import NotesPanel from "@/components/NotesPanel";
import { TranscriptionWSStatus } from "@/hooks/useTranscriptionWebSocket";

interface MeetingWorkspaceProps {
  isCallActive: boolean;
  transcript: string;
  insights: {
    emotions: Array<{ emotion: string; level: number }>;
    painPoints: string[];
    objections: string[];
    recommendations: string[];
    nextActions: string[];
  };
  // Add props for real-time transcription
  realtimeText?: string;
  fullSentences?: string[];
  transcriptionStatus?: TranscriptionWSStatus;
  transcriptionError?: string | null;
  onReconnectTranscription?: () => void;
}

const MeetingWorkspace = ({ 
  isCallActive, 
  transcript, 
  insights,
  realtimeText = "",
  fullSentences = [],
  transcriptionStatus = "disconnected",
  transcriptionError = null,
  onReconnectTranscription = () => {}
}: MeetingWorkspaceProps) => {
  return (
    <div className="flex-grow overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Transcript Panel - Left Side */}
        <ResizablePanel 
          defaultSize={30} 
          minSize={20}
          className="bg-card p-4"
        >
          <TranscriptPanel 
            isCallActive={isCallActive} 
            transcript={transcript}
            realtimeText={realtimeText}
            fullSentences={fullSentences}
            transcriptionStatus={transcriptionStatus}
            transcriptionError={transcriptionError}
            onReconnect={onReconnectTranscription}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Insights Panel - Center */}
        <ResizablePanel 
          defaultSize={40} 
          minSize={30}
          className="bg-background p-4"
        >
          <InsightsPanel 
            isCallActive={isCallActive}
            insights={insights}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Notes Panel - Right Side */}
        <ResizablePanel 
          defaultSize={30} 
          minSize={20}
          className="bg-card p-4"
        >
          <NotesPanel isCallActive={isCallActive} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default MeetingWorkspace;
