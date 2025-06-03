import React, { useEffect, useRef } from "react";
import { List } from "lucide-react";
import TranscriptionStatus from "@/components/meeting/TranscriptionStatus";
import { TranscriptionWSStatus } from "@/hooks/useTranscriptionWebSocket";

interface TranscriptPanelProps {
  isCallActive: boolean;
  transcript?: string;
  // Add new props for transcription data
  realtimeText?: string;
  fullSentences?: string[];
  transcriptionStatus?: TranscriptionWSStatus;
  transcriptionError?: string | null;
  onReconnect?: () => void;
}

const TranscriptPanel = ({
  isCallActive,
  transcript,
  realtimeText = "",
  fullSentences = [],
  transcriptionStatus = "disconnected",
  transcriptionError = null,
  onReconnect = () => {}
}: TranscriptPanelProps) => {
  // Reference to the scroll container
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to the bottom when fullSentences change
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [fullSentences]);
  
  // Parse transcript into dialogue entries if provided
  const parseTranscript = () => {
    if (!transcript) return [];
    
    const entries = transcript.split('\n\n').filter(Boolean);
    return entries.map((entry, index) => {
      const [speaker, ...textParts] = entry.split(': ');
      const text = textParts.join(': ');
      return { id: index + 1, speaker, text };
    });
  };
  
  const dialogueEntries = parseTranscript();

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium flex items-center gap-2">
          <List size={18} /> Transcript
        </h2>
        {isCallActive && (
          <TranscriptionStatus
            status={transcriptionStatus}
            error={transcriptionError}
            onReconnect={onReconnect}
          />
        )}
      </div>

      {isCallActive ? (
        <div className="flex flex-col h-full">
          {/* Fixed Live transcript box at the top */}
          <div className="mb-4">
            {realtimeText ? (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 shadow-sm">
                <div className="flex items-center mb-2">
                  <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded">
                    Live
                  </span>
                </div>
                <p className="text-foreground">{realtimeText}</p>
              </div>
            ) : (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 shadow-sm text-muted-foreground italic">
                <div className="flex items-center mb-2">
                  <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded">
                    Live
                  </span>
                </div>
                <p>Waiting for speech...</p>
              </div>
            )}
          </div>
          
          {/* Scrollable container for sentence history with FIXED HEIGHT */}
          <div className="mb-2 text-xs font-medium text-muted-foreground">
            Transcript History
          </div>
          
          <div 
            ref={scrollContainerRef}
            className="h-[300px] overflow-y-auto border border-border rounded-md p-2 scroll-smooth"
          >
            <div className="space-y-3">
              {fullSentences.length > 0 ? (
                fullSentences.map((sentence, index) => (
                  <div 
                    key={index} 
                    className="p-3 bg-card/50 border border-border/50 rounded-md"
                    id={`sentence-${index}`}
                  >
                    <div className="text-xs font-medium mb-1 text-muted-foreground">
                      Speaker
                    </div>
                    <p className="text-foreground">{sentence}</p>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  <p>No transcript history yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-grow flex items-center justify-center text-muted-foreground">
          <p>Transcript will appear here when call is active</p>
        </div>
      )}
    </div>
  );
};

export default TranscriptPanel;
