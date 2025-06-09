
import React from "react";

interface SimpleClientEmotionProps {
  currentEmotion: string;
}

const SimpleClientEmotion = ({ currentEmotion }: SimpleClientEmotionProps) => {
  return (
    <div className="bg-card/95 backdrop-blur-sm border border-border/50 rounded-lg p-3">
      <span className="text-xs font-medium text-foreground">
        Client Emotion: <span className="text-primary">{currentEmotion}</span>
      </span>
    </div>
  );
};

export default SimpleClientEmotion;
