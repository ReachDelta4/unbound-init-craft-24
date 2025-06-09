
import React from "react";

interface CallStageIndicatorProps {
  currentStage: string;
}

const CallStageIndicator = ({ currentStage }: CallStageIndicatorProps) => {
  return (
    <div className="bg-card/95 backdrop-blur-sm border border-border/50 rounded-lg p-3">
      <span className="text-xs font-medium text-foreground">
        Call Stage: <span className="text-primary">{currentStage}</span>
      </span>
    </div>
  );
};

export default CallStageIndicator;
