import React, { useEffect } from "react";
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

  // Debug stream information when it changes
  useEffect(() => {
    if (stream) {
      console.log('MeetingWorkspace received stream:', {
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length,
        videoActive: stream.getVideoTracks().some(track => track.enabled && track.readyState === 'live'),
      });
    }
  }, [stream]);

  // Always show screen share preview when call is active and stream exists
  const isScreenShareActive = isCallActive && !!stream;

  return (
    <div className={cn("h-full overflow-hidden relative", className)}>
      <div className="h-full flex flex-col">
        {/* Compact Top Section */}
        <div className="flex-shrink-0 p-3 space-y-2 border-b border-border">
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
          <ResizablePanelGroup direction="horizontal" className="h-full border border-border rounded-lg overflow-hidden">
            {/* Left Side Panel - Emotions & Pain Points */}
            <ResizablePanel 
              defaultSize={20} 
              minSize={15}
              maxSize={25}
              className="pr-2 border-r border-border"
            >
              <ScrollArea className="h-full">
                <LeftInsightsPanel 
                  isCallActive={isCallActive}
                  emotions={insights.emotions}
                  painPoints={insights.painPoints}
                />
              </ScrollArea>
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-border" />

            {/* Center Panel - Screen Share & Transcript */}
            <ResizablePanel 
              defaultSize={60} 
              minSize={40}
              className="px-2 border-x border-border"
            >
              <ScrollArea className="h-full">
                <div className="flex flex-col space-y-3 py-2">
                  {/* Resizable Screen Share Preview */}
                  <div className="flex-shrink-0">
                    <ResizableScreenShare 
                      stream={stream} 
                      isActive={isScreenShareActive} 
                    />
                  </div>
                  
                  {/* Live Transcript Area */}
                  <div className="min-h-[200px]">
                    <LiveTranscriptDisplay 
                      liveText={realtimeText}
                      transcriptHistory={fullSentences}
                    />
                  </div>
                </div>
              </ScrollArea>
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-border" />

            {/* Right Side Panel - Objections & Recommendations */}
            <ResizablePanel 
              defaultSize={20} 
              minSize={15}
              maxSize={25}
              className="pl-2 border-l border-border"
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
