import React from "react";
import { SmilePlus } from "lucide-react";

interface SimpleClientEmotionProps {
  currentEmotion: string;
}

const SimpleClientEmotion = ({ currentEmotion }: SimpleClientEmotionProps) => {
  // Get emotion color based on the emotion type
  const getEmotionColor = (emotion: string) => {
    const emotionMap: Record<string, string> = {
      "Interested": "bg-green-500",
      "Neutral": "bg-blue-500",
      "Confused": "bg-amber-500",
      "Concerned": "bg-orange-500",
      "Skeptical": "bg-red-500",
      "Excited": "bg-purple-500"
    };
    
    return emotionMap[emotion] || "bg-gray-500";
  };
  
  const emotionColor = getEmotionColor(currentEmotion);
  
  return (
    <div className="border-2 border-border rounded-lg p-2 flex items-center gap-2 shadow-sm">
      <div className="bg-card p-1.5 rounded-md border border-border">
        <SmilePlus className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <div className="flex items-center">
          <span className="text-xs font-medium">Client Emotion</span>
          <div className={`ml-2 w-2 h-2 rounded-full ${emotionColor}`} />
        </div>
        <p className="text-sm font-medium">{currentEmotion}</p>
      </div>
    </div>
  );
};

export default SimpleClientEmotion;
