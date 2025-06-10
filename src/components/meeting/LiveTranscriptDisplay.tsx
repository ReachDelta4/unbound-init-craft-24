
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
    <div className="bg-card border-2 border-border rounded-lg p-4 shadow-sm">
      {/* Live Transcript */}
      <div className="mb-4">
        <div className="bg-green-50 dark:bg-green-950/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-xs font-semibold bg-green-500 text-white px-2 py-1 rounded-md shadow-sm">
              LIVE
            </span>
            <p className="text-foreground font-medium flex-1 min-h-[1.5rem]">
              {liveText || "Waiting for speech..."}
            </p>
          </div>
        </div>
      </div>

      {/* Transcript History Toggle */}
      <div className="border-t-2 border-border pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
          className="w-full justify-between p-2 h-auto border border-border"
        >
          <span className="text-sm font-medium">Transcript History ({transcriptHistory.length})</span>
          {isHistoryExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>

        {/* Collapsible History */}
        {isHistoryExpanded && (
          <div className="mt-3 animate-accordion-down border border-border rounded-lg p-2">
            <ScrollArea className="h-48 w-full">
              <div className="space-y-2">
                {transcriptHistory.length > 0 ? (
                  transcriptHistory.map((sentence, index) => (
                    <div 
                      key={index} 
                      className="p-3 bg-muted border border-border/70 rounded-md text-sm"
                    >
                      <span className="text-xs text-muted-foreground block mb-1 border-b border-border/50 pb-1">
                        Sentence {index + 1}
                      </span>
                      {sentence}
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8 border border-dashed border-border rounded-lg">
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
