import React from "react";
import { Map } from "lucide-react";

interface CallStageIndicatorProps {
  currentStage: string;
}

const CallStageIndicator = ({ currentStage }: CallStageIndicatorProps) => {
  // Define the stages and their order
  const stages = ["Introduction", "Discovery", "Presentation", "Handling Objections", "Closing"];
  
  // Find the current stage index
  const currentIndex = stages.findIndex(stage => stage === currentStage);
  
  return (
    <div className="border-2 border-border rounded-lg p-2 flex items-center gap-2 shadow-sm">
      <div className="bg-card p-1.5 rounded-md border border-border">
        <Map className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <div className="flex items-center">
          <span className="text-xs font-medium">Call Stage</span>
        </div>
        <p className="text-sm font-medium">{currentStage}</p>
      </div>
      
      {/* Progress indicator */}
      <div className="flex items-center gap-1 ml-2">
        {stages.map((_, index) => (
          <div 
            key={index} 
            className={`w-1.5 h-1.5 rounded-full border ${
              index <= currentIndex 
                ? 'bg-primary border-primary' 
                : 'bg-muted border-border'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default CallStageIndicator;
