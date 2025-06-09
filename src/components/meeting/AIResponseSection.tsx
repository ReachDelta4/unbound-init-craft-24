import React from "react";
import { Sparkles } from "lucide-react";

interface AIResponseSectionProps {
  response: string;
}

const AIResponseSection = ({ response }: AIResponseSectionProps) => {
  return (
    <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-3 shadow-sm">
      <div className="flex items-start gap-2">
        <div className="bg-primary/10 p-1.5 rounded-md border border-primary/30">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center mb-1">
            <h3 className="text-xs font-semibold text-primary">AI COACH SUGGESTION</h3>
          </div>
          <p className="text-sm">{response}</p>
        </div>
      </div>
    </div>
  );
};

export default AIResponseSection;
