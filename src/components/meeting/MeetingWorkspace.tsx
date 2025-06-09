
import React from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import TranscriptPanel from "@/components/TranscriptPanel";
import InsightsPanel from "@/components/InsightsPanel";
import FloatingNotesWidget from "@/components/FloatingNotesWidget";
import { TranscriptionWSStatus } from "@/hooks/useTranscriptionWebSocket";
import { cn } from "@/lib/utils";

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
  className?: string;
}

const MeetingWorkspace = ({ 
  isCallActive, 
  transcript, 
  insights,
  realtimeText = "",
  fullSentences = [],
  transcriptionStatus = "disconnected",
  transcriptionError = null,
  onReconnectTranscription = () => {},
  className
}: MeetingWorkspaceProps) => {
  return (
    <div className={cn("flex-grow overflow-hidden relative", className)}>
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Transcript Panel - Left Side */}
        <ResizablePanel 
          defaultSize={50} 
          minSize={30}
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

        {/* Insights Panel - Right Side */}
        <ResizablePanel 
          defaultSize={50} 
          minSize={30}
          className="bg-background p-4"
        >
          <InsightsPanel 
            isCallActive={isCallActive}
            insights={insights}
            fullSentences={fullSentences}
          />
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Floating Notes Widget */}
      <FloatingNotesWidget isCallActive={isCallActive} />
    </div>
  );
};

export default MeetingWorkspace;
