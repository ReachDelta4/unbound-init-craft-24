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
import ScreenShareVideo from "./ScreenShareVideo";
import LiveTranscriptDisplay from "./LiveTranscriptDisplay";
import LeftInsightsPanel from "./LeftInsightsPanel";
import RightInsightsPanel from "./RightInsightsPanel";
import { Button } from "@/components/ui/button";
import GeminiClient from "@/integrations/gemini/GeminiClient";

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
  clientEmotion?: string;
  clientInterest?: number;
  callStage?: string;
  aiCoachingSuggestion?: string;
  lastGeminiResponse?: string | null;
}

const MeetingWorkspace = ({ 
  isCallActive, 
  transcript, 
  insights: initialInsights,
  realtimeText = "",
  fullSentences = [],
  transcriptionStatus = "disconnected",
  transcriptionError = null,
  onReconnectTranscription = () => {},
  className,
  stream = null,
  clientEmotion: providedClientEmotion = "Interest",
  clientInterest: providedClientInterest = 75,
  callStage: providedCallStage = "Discovery",
  aiCoachingSuggestion: providedAiResponse = "Ask about their current workflow and pain points to better understand their needs.",
  lastGeminiResponse = null
}: MeetingWorkspaceProps) => {
  // Use insights from props (which can be updated by webhook responses)
  const currentInsights = initialInsights;
  
  // Use provided values from webhook responses or fallback to defaults
  const currentEmotion = providedClientEmotion;
  const clientInterestLevel = providedClientInterest;
  const currentStage = providedCallStage;
  const aiResponse = providedAiResponse;

  // Debug stream information when it changes
  useEffect(() => {
    console.log('MeetingWorkspace: Props changed:', {
      isCallActive,
      hasStream: !!stream,
      streamId: stream?.id,
      videoTracks: stream?.getVideoTracks().length || 0,
      audioTracks: stream?.getAudioTracks().length || 0,
      videoActive: stream?.getVideoTracks().some(track => track.enabled && track.readyState === 'live'),
      streamActive: stream?.active
    });
  }, [stream, isCallActive]);

  // Log when we get a new Gemini response
  useEffect(() => {
    if (lastGeminiResponse) {
      console.log('MeetingWorkspace: New Gemini response received:', lastGeminiResponse);
    }
  }, [lastGeminiResponse]);

  // Add debugging for the screen share video props
  const screenShareProps = {
    stream,
    isActive: isCallActive,
    debugInfo: {
      hasStream: !!stream,
      streamActive: stream?.active,
      isCallActive,
      videoTracksCount: stream?.getVideoTracks().length || 0,
      audioTracksCount: stream?.getAudioTracks().length || 0
    }
  };

  console.log('MeetingWorkspace: Passing to ScreenShareVideo:', screenShareProps);

  // Function to test Gemini API directly
  const testGeminiAPI = async () => {
    console.log('MeetingWorkspace: Testing Gemini API directly');
    
    if (!GeminiClient) {
      console.error('MeetingWorkspace: GeminiClient is not available');
      alert('GeminiClient is not available');
      return;
    }
    
    try {
      const testMessage = "Hello, this is a test message from the MeetingWorkspace component. Please respond with a short confirmation.";
      console.log('MeetingWorkspace: Sending test message to Gemini:', testMessage);
      
      const response = await GeminiClient.sendStatelessMessage(testMessage);
      console.log('MeetingWorkspace: Received response from Gemini:', response);
      
      alert(`Gemini API Test Result: ${response}`);
    } catch (error) {
      console.error('MeetingWorkspace: Error testing Gemini API:', error);
      alert(`Gemini API Test Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className={cn("h-full overflow-hidden relative", className)}>
      <div className="h-full flex flex-col">
        {/* Compact Top Section */}
        <div className="flex-shrink-0 p-3 space-y-2 border-b border-border">
          {/* First row: Client Interest (20%), Client Emotion, Call Stage, User Controls */}
          <div className="flex gap-3 items-center">
            <div className="w-1/5">
              <ClientInterestBar interestLevel={clientInterestLevel} />
            </div>
            <div className="flex-1">
              <SimpleClientEmotion currentEmotion={currentEmotion} />
            </div>
            <div className="flex-1">
              <CallStageIndicator currentStage={currentStage} />
            </div>
            <div className="flex justify-end items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={testGeminiAPI}
                className="bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800"
              >
                Test Gemini API
              </Button>
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
                  emotions={currentInsights.emotions}
                  painPoints={currentInsights.painPoints}
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
                <div className="flex flex-col space-y-4 py-2">
                  {/* Screen Share Video - Shows when call is active */}
                  <div className="flex-shrink-0">
                    <ScreenShareVideo 
                      stream={stream} 
                      isActive={isCallActive} 
                    />
                  </div>
                  
                  {/* Live Transcript Area */}
                  <div className="min-h-[200px]">
                    <LiveTranscriptDisplay 
                      liveText={realtimeText}
                      transcriptHistory={fullSentences}
                      transcriptionStatus={transcriptionStatus}
                      transcriptionError={transcriptionError}
                      onReconnect={onReconnectTranscription}
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
                  objections={currentInsights.objections}
                  recommendations={currentInsights.recommendations}
                  nextActions={currentInsights.nextActions}
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

// Export a memoized version of the component to prevent unnecessary re-renders
export default React.memo(MeetingWorkspace);
