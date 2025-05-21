
import React from "react";
import { List } from "lucide-react";

interface TranscriptPanelProps {
  isCallActive: boolean;
  transcript?: string;
}

const TranscriptPanel = ({ isCallActive, transcript }: TranscriptPanelProps) => {
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
          <span className="text-xs bg-green-700/30 text-green-400 dark:text-green-400 dark:bg-green-700/30 px-2 py-1 rounded-full">
            Live Transcription
          </span>
        )}
      </div>

      <div className="flex-grow overflow-y-auto pr-2 space-y-4">
        {isCallActive && dialogueEntries.length > 0 ? (
          dialogueEntries.map((item) => (
            <div key={item.id} className="mb-3">
              <div className={`font-medium mb-1 ${item.speaker === "Client" ? "text-indigo-400 dark:text-indigo-400" : "text-emerald-400 dark:text-emerald-400"}`}>
                {item.speaker}
              </div>
              <p className="text-foreground">{item.text}</p>
            </div>
          ))
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <p>Transcript will appear here when call is active</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TranscriptPanel;
