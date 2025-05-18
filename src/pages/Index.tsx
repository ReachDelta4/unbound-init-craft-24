
import React, { useState, useRef } from "react";
import MeetingControls from "@/components/MeetingControls";
import TranscriptPanel from "@/components/TranscriptPanel";
import InsightsPanel from "@/components/InsightsPanel";
import NotesPanel from "@/components/NotesPanel";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

const Index = () => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [callType, setCallType] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleStartCall = () => {
    setIsCallActive(true);
    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const handleEndCall = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsCallActive(false);
    setCallDuration(0);
  };

  return (
    <div className="h-screen w-full bg-slate-900 text-slate-100 flex flex-col">
      <header className="bg-slate-800 p-4 border-b border-slate-700">
        <h1 className="text-xl font-semibold text-center">Invisible AI Meeting Assistant</h1>
      </header>

      <div className="flex-grow overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Transcript Panel - Left Side */}
          <ResizablePanel 
            defaultSize={30} 
            minSize={20}
            className="bg-slate-800 p-4"
          >
            <TranscriptPanel isCallActive={isCallActive} />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Insights Panel - Center */}
          <ResizablePanel 
            defaultSize={40} 
            minSize={30}
            className="bg-slate-900 p-4"
          >
            <InsightsPanel isCallActive={isCallActive} />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Notes Panel - Right Side */}
          <ResizablePanel 
            defaultSize={30} 
            minSize={20}
            className="bg-slate-800 p-4"
          >
            <NotesPanel isCallActive={isCallActive} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Meeting Controls at Bottom */}
      <div className="bg-slate-800 border-t border-slate-700 p-4">
        <MeetingControls 
          isCallActive={isCallActive}
          callType={callType}
          callDuration={callDuration}
          onCallTypeChange={setCallType}
          onStartCall={handleStartCall}
          onEndCall={handleEndCall}
        />
      </div>
    </div>
  );
};

export default Index;
