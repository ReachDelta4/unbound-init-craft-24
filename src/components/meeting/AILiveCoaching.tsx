
import React from "react";
import { Lightbulb } from "lucide-react";

interface AILiveCoachingProps {
  suggestion: string;
  isActive: boolean;
}

const AILiveCoaching = ({ suggestion, isActive }: AILiveCoachingProps) => {
  if (!isActive) return null;

  return (
    <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <Lightbulb className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-medium text-primary mb-1">What to say next</h3>
          <p className="text-sm text-foreground">{suggestion}</p>
        </div>
      </div>
    </div>
  );
};

export default AILiveCoaching;
