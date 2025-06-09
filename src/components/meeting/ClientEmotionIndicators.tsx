
import React from "react";
import { Badge } from "@/components/ui/badge";

interface ClientEmotionIndicatorsProps {
  currentEmotion: string;
  emotions: string[];
}

const ClientEmotionIndicators = ({ currentEmotion, emotions }: ClientEmotionIndicatorsProps) => {
  const emotionColors: Record<string, string> = {
    "Interested": "bg-green-500/20 text-green-400 border-green-500/30",
    "Not Interested": "bg-red-500/20 text-red-400 border-red-500/30",
    "Skeptical": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    "Budget Constraints": "bg-orange-500/20 text-orange-400 border-orange-500/30",
    "Excited": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "Confused": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  };

  return (
    <div className="bg-card/95 backdrop-blur-sm border border-border/50 rounded-lg p-4 mb-4">
      <h3 className="text-sm font-medium text-foreground mb-3">Client Emotion</h3>
      <div className="flex flex-wrap gap-2">
        {emotions.map((emotion) => (
          <Badge
            key={emotion}
            variant="outline"
            className={`${
              emotion === currentEmotion
                ? emotionColors[emotion] || "bg-primary/20 text-primary border-primary/30"
                : "bg-muted/50 text-muted-foreground border-muted"
            } transition-all duration-200`}
          >
            {emotion}
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default ClientEmotionIndicators;
