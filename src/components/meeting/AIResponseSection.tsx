
import React from "react";

interface AIResponseSectionProps {
  response: string;
}

const AIResponseSection = ({ response }: AIResponseSectionProps) => {
  return (
    <div className="bg-card/95 backdrop-blur-sm border border-border/50 rounded-lg p-3">
      <h3 className="text-xs font-medium text-foreground mb-2">AI Response:</h3>
      <p className="text-sm text-foreground whitespace-pre-wrap break-words">
        {response || "Waiting for AI response..."}
      </p>
    </div>
  );
};

export default AIResponseSection;
