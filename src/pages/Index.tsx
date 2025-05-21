
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MeetingControls from "@/components/MeetingControls";
import TranscriptPanel from "@/components/TranscriptPanel";
import InsightsPanel from "@/components/InsightsPanel";
import NotesPanel from "@/components/NotesPanel";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/auth/UserMenu";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useMeetingState } from "@/hooks/use-meeting-state";
import { useNotesState } from "@/hooks/use-notes-state";
import MeetingEndDialog from "@/components/MeetingEndDialog";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isCallActive, setIsCallActive] = useState(false);
  const [callType, setCallType] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [showMeetingDialog, setShowMeetingDialog] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { 
    activeMeeting, 
    isCreatingMeeting, 
    startMeeting, 
    endMeeting,
    updateMeeting
  } = useMeetingState();
  
  const { saveNotesToMeeting } = useNotesState();

  // Redirect to auth page if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  // Sample insights for the current call
  const [currentInsights, setCurrentInsights] = useState({
    emotions: [
      { emotion: "Interest", level: 80 },
      { emotion: "Concern", level: 40 },
      { emotion: "Enthusiasm", level: 65 },
      { emotion: "Skepticism", level: 30 },
    ],
    painPoints: [
      "Integration issues between existing tools",
      "Team communication challenges",
      "Cost management with current solutions",
      "Scalability concerns for growing team",
    ],
    objections: [
      "Budget constraints this quarter",
      "Concerned about implementation time",
      "Questions about technical support availability",
    ],
    recommendations: [
      "Highlight how our integration reduces total cost of ownership",
      "Address implementation timeline - emphasize quick onboarding",
      "Discuss the dedicated support team availability",
      "Demonstrate scalability features for growing teams",
    ],
    nextActions: [
      "Send pricing proposal by Friday",
      "Schedule technical demo with their IT team",
      "Share case studies of similar-sized companies"
    ]
  });

  // Sample transcript - this would come from a real transcription service
  const [currentTranscript, setCurrentTranscript] = useState(
    "You: Hello, thanks for joining the call today. How are you doing?\n\n" +
    "Client: I'm doing well, thank you for asking. I'm excited to discuss your product and see if it fits our needs.\n\n" +
    "You: That's great to hear. I'd love to understand your current challenges and how we might be able to address them.\n\n" +
    "Client: Well, our main issue is increasing productivity while keeping our costs manageable. Our team is growing but our tools aren't scaling well."
  );

  const handleStartCall = async () => {
    if (!callType || !user) return;
    
    // Create a new meeting in the database
    const meeting = await startMeeting(callType);
    
    if (meeting) {
      setIsCallActive(true);
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
  };

  const handleEndCall = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsCallActive(false);
    setShowMeetingDialog(true);
  };

  const handleSaveMeeting = async (title: string, transcript: string, summary: string) => {
    if (!activeMeeting || !user) return;
    
    // Prepare insights for saving
    const insightsForSaving = [
      { type: 'emotions', data: currentInsights.emotions },
      { type: 'painPoints', data: currentInsights.painPoints },
      { type: 'objections', data: currentInsights.objections },
      { type: 'recommendations', data: currentInsights.recommendations },
      { type: 'nextActions', data: currentInsights.nextActions }
    ];
    
    // Update meeting and save insights
    const meetingId = await endMeeting(transcript, summary, insightsForSaving);
    
    if (meetingId) {
      // Update meeting title
      await updateMeeting(meetingId, { title });
      
      // Save notes to meeting
      await saveNotesToMeeting(meetingId, [
        { type: 'markdown', content: { raw: transcript } }
      ]);
      
      setShowMeetingDialog(false);
      setCallDuration(0);
      setCallType(null);
    }
  };

  // Generate a summary from transcript - in a real app, this would use AI
  const generateSummary = () => {
    return "The client expressed interest in our solution to help with scaling their team while managing costs. They're experiencing integration issues between their existing tools and have concerns about implementation time and support availability.";
  };

  if (!user) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <Button onClick={() => navigate("/auth")}>Sign In to Continue</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-background text-foreground flex flex-col">
      <header className="bg-card p-4 border-b border-border flex items-center justify-between">
        <div className="flex-1">
          {/* Spacer */}
        </div>
        <h1 className="text-xl font-semibold text-center flex-1">Invisible AI Meeting Assistant</h1>
        <div className="flex-1 flex justify-end items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate("/profile")}
            className="flex items-center gap-2"
          >
            Profile
          </Button>
          <ThemeToggle />
          <UserMenu />
        </div>
      </header>

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
              transcript={currentTranscript}
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
              insights={currentInsights}
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

      {/* Meeting Controls at Bottom */}
      <div className="bg-card border-t border-border p-4">
        <MeetingControls 
          isCallActive={isCallActive}
          callType={callType}
          callDuration={callDuration}
          onCallTypeChange={setCallType}
          onStartCall={handleStartCall}
          onEndCall={handleEndCall}
          isLoading={isCreatingMeeting}
        />
      </div>

      {/* Meeting End Dialog */}
      <MeetingEndDialog
        isOpen={showMeetingDialog}
        onClose={() => setShowMeetingDialog(false)}
        onSave={(title, transcript, summary) => handleSaveMeeting(title, transcript, summary)}
        transcript={currentTranscript}
        summary={generateSummary()}
        insights={[
          { type: 'emotions', data: currentInsights.emotions },
          { type: 'painPoints', data: currentInsights.painPoints },
          { type: 'objections', data: currentInsights.objections },
          { type: 'recommendations', data: currentInsights.recommendations },
          { type: 'nextActions', data: currentInsights.nextActions }
        ]}
      />
    </div>
  );
};

export default Index;
