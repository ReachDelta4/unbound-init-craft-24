
import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LiveTranscriptDisplayProps {
  liveText: string;
  transcriptHistory: string[];
}

const LiveTranscriptDisplay = ({ liveText, transcriptHistory }: LiveTranscriptDisplayProps) => {
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

  return (
    <div className="bg-card/95 backdrop-blur-sm border border-border/50 rounded-lg p-4">
      {/* Live Transcript */}
      <div className="mb-4">
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <span className="text-xs font-semibold bg-primary/20 text-primary px-2 py-0.5 rounded mr-2">
              LIVE
            </span>
            <span className="text-xs text-muted-foreground">Current transcription</span>
          </div>
          <p className="text-primary font-medium">
            {liveText || "Waiting for speech..."}
          </p>
        </div>
      </div>

      {/* Transcript History Toggle */}
      <div className="border-t border-border/50 pt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
          className="w-full justify-between p-2 h-auto"
        >
          <span className="text-sm font-medium">Transcript History ({transcriptHistory.length})</span>
          {isHistoryExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>

        {/* Collapsible History */}
        {isHistoryExpanded && (
          <div className="mt-3 animate-accordion-down">
            <ScrollArea className="h-48 w-full">
              <div className="space-y-2">
                {transcriptHistory.length > 0 ? (
                  transcriptHistory.map((sentence, index) => (
                    <div 
                      key={index} 
                      className="p-3 bg-muted/50 border border-border/30 rounded-md text-sm"
                    >
                      <span className="text-xs text-muted-foreground block mb-1">
                        Sentence {index + 1}
                      </span>
                      {sentence}
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <p className="text-sm">No transcript history yet</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTranscriptDisplay;
