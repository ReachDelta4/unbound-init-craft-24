
import React from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import FloatingNotesWidget from "@/components/FloatingNotesWidget";
import { TranscriptionWSStatus } from "@/hooks/useTranscriptionWebSocket";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/auth/UserMenu";
import ClientInterestBar from "./ClientInterestBar";
import SimpleClientEmotion from "./SimpleClientEmotion";
import CallStageIndicator from "./CallStageIndicator";
import AIResponseSection from "./AIResponseSection";
import ResizableScreenShare from "./ResizableScreenShare";
import LiveTranscriptDisplay from "./LiveTranscriptDisplay";
import LeftInsightsPanel from "./LeftInsightsPanel";
import RightInsightsPanel from "./RightInsightsPanel";

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
  realtimeText?: string;
  fullSentences?: string[];
  transcriptionStatus?: TranscriptionWSStatus;
  transcriptionError?: string | null;
  onReconnectTranscription?: () => void;
  className?: string;
  stream?: MediaStream | null;
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
  className,
  stream = null
}: MeetingWorkspaceProps) => {
  // Sample data for demonstration
  const clientInterest = 75;
  const currentEmotion = "Interested";
  const currentStage = "Discovery";
  const aiResponse = "Ask about their current workflow and pain points to better understand their needs.";

  return (
    <div className={cn("h-full overflow-hidden relative", className)}>
      <div className="h-full flex flex-col">
        {/* Compact Top Section */}
        <div className="flex-shrink-0 p-3 space-y-2">
          {/* First row: Client Interest (20%), Client Emotion, Call Stage, User Controls */}
          <div className="flex gap-3 items-center">
            <div className="w-1/5">
              <ClientInterestBar interestLevel={clientInterest} />
            </div>
            <div className="flex-1">
              <SimpleClientEmotion currentEmotion={currentEmotion} />
            </div>
            <div className="flex-1">
              <CallStageIndicator currentStage={currentStage} />
            </div>
            <div className="flex justify-end items-center gap-2">
              <ThemeToggle />
              <UserMenu />
            </div>
          </div>
          
          {/* Second row: AI Response */}
          <div>
            <AIResponseSection response={aiResponse} />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 px-3 pb-3 min-h-0">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Left Side Panel - Emotions & Pain Points */}
            <ResizablePanel 
              defaultSize={20} 
              minSize={15}
              maxSize={25}
              className="pr-2"
            >
              <ScrollArea className="h-full">
                <LeftInsightsPanel 
                  isCallActive={isCallActive}
                  emotions={insights.emotions}
                  painPoints={insights.painPoints}
                />
              </ScrollArea>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Center Panel - Screen Share & Transcript */}
            <ResizablePanel 
              defaultSize={60} 
              minSize={40}
              className="px-2"
            >
              <div className="h-full flex flex-col space-y-3">
                {/* Resizable Screen Share Preview */}
                <div className="flex-shrink-0">
                  <ResizableScreenShare 
                    stream={stream} 
                    isActive={isCallActive && !!stream} 
                  />
                </div>
                
                {/* Live Transcript Area - Takes remaining space */}
                <div className="flex-1 min-h-0">
                  <LiveTranscriptDisplay 
                    liveText={realtimeText}
                    transcriptHistory={fullSentences}
                  />
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Right Side Panel - Objections & Recommendations */}
            <ResizablePanel 
              defaultSize={20} 
              minSize={15}
              maxSize={25}
              className="pl-2"
            >
              <ScrollArea className="h-full">
                <RightInsightsPanel 
                  isCallActive={isCallActive}
                  objections={insights.objections}
                  recommendations={insights.recommendations}
                  nextActions={insights.nextActions}
                />
              </ScrollArea>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>

      {/* Floating Notes Widget */}
      <FloatingNotesWidget isCallActive={isCallActive} />
    </div>
  );
};

export default MeetingWorkspace;
