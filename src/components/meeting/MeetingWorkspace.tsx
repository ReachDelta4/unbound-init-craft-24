
import React from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import TranscriptPanel from "@/components/TranscriptPanel";
import InsightsPanel from "@/components/InsightsPanel";
import NotesPanel from "@/components/NotesPanel";

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
}

const MeetingWorkspace = ({ isCallActive, transcript, insights }: MeetingWorkspaceProps) => {
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
