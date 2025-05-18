
import React from "react";
import { List } from "lucide-react";

interface TranscriptPanelProps {
  isCallActive: boolean;
}

const TranscriptPanel = ({ isCallActive }: TranscriptPanelProps) => {
  const sampleTranscript = [
    { id: 1, speaker: "You", text: "Hello, thanks for joining the call today. How are you doing?" },
    { id: 2, speaker: "Client", text: "I'm doing well, thank you for asking. I'm excited to discuss your product and see if it fits our needs." },
    { id: 3, speaker: "You", text: "That's great to hear. I'd love to understand your current challenges and how we might be able to address them." },
    { id: 4, speaker: "Client", text: "Well, our main issue is increasing productivity while keeping our costs manageable. Our team is growing but our tools aren't scaling well." },
    { id: 5, speaker: "You", text: "That's a common challenge. Can you tell me more about your current workflow?" },
    { id: 6, speaker: "Client", text: "Currently we use several disconnected tools. It's causing communication issues and duplication of effort in many cases." },
    { id: 7, speaker: "You", text: "I understand. Integration between tools is definitely important for efficiency." },
    { id: 8, speaker: "Client", text: "Exactly. We need something that brings everything together and helps us stay on the same page." },
    { id: 9, speaker: "You", text: "Based on what you're describing, I think our platform could be a great fit because it integrates with all the tools you mentioned." },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium flex items-center gap-2">
          <List size={18} /> Transcript
        </h2>
        {isCallActive && (
          <span className="text-xs bg-green-700/30 text-green-400 px-2 py-1 rounded-full">
            Live Transcription
          </span>
        )}
      </div>

      <div className="flex-grow overflow-y-auto pr-2 space-y-4">
        {isCallActive ? (
          sampleTranscript.map((item) => (
            <div key={item.id} className="mb-3">
              <div className={`font-medium mb-1 ${item.speaker === "Client" ? "text-indigo-400" : "text-emerald-400"}`}>
                {item.speaker}
              </div>
              <p className="text-slate-300">{item.text}</p>
            </div>
          ))
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500">
            <p>Transcript will appear here when call is active</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TranscriptPanel;
