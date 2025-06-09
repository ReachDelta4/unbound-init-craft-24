
import React from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import FloatingNotesWidget from "@/components/FloatingNotesWidget";
import { TranscriptionWSStatus } from "@/hooks/useTranscriptionWebSocket";
import { cn } from "@/lib/utils";
import ClientInterestBar from "./ClientInterestBar";
import ClientEmotionIndicators from "./ClientEmotionIndicators";
import AILiveCoaching from "./AILiveCoaching";
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
  const availableEmotions = ["Interested", "Not Interested", "Skeptical", "Budget Constraints", "Excited", "Confused"];
  const liveSuggestion = "Ask about their current workflow and pain points to better understand their needs.";

  return (
    <div className={cn("h-full overflow-hidden relative", className)}>
      <div className="h-full flex flex-col">
        {/* Top Section: Client Interest & Emotion */}
        <div className="flex-shrink-0 p-4 space-y-4">
          <ClientInterestBar interestLevel={clientInterest} />
          <ClientEmotionIndicators 
            currentEmotion={currentEmotion} 
            emotions={availableEmotions} 
          />
          <AILiveCoaching 
            suggestion={liveSuggestion} 
            isActive={isCallActive} 
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 px-4 pb-4">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Left Side Panel - Emotions & Pain Points */}
            <ResizablePanel 
              defaultSize={20} 
              minSize={15}
              maxSize={30}
              className="pr-2"
            >
              <LeftInsightsPanel 
                isCallActive={isCallActive}
                emotions={insights.emotions}
                painPoints={insights.painPoints}
              />
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Center Panel - Screen Share & Transcript */}
            <ResizablePanel 
              defaultSize={60} 
              minSize={40}
              className="px-2"
            >
              <div className="h-full flex flex-col space-y-4">
                {/* Resizable Screen Share Preview */}
                <div className="flex-1">
                  <ResizableScreenShare 
                    stream={stream} 
                    isActive={isCallActive} 
                  />
                </div>
                
                {/* Live Transcript Area */}
                <div className="flex-shrink-0">
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
              maxSize={30}
              className="pl-2"
            >
              <RightInsightsPanel 
                isCallActive={isCallActive}
                objections={insights.objections}
                recommendations={insights.recommendations}
                nextActions={insights.nextActions}
              />
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
