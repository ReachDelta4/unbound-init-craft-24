import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LeftInsightsPanelProps {
  isCallActive: boolean;
  emotions: Array<{ emotion: string; level: number }>;
  painPoints: string[];
}

const LeftInsightsPanel = ({ isCallActive, emotions, painPoints }: LeftInsightsPanelProps) => {
  // Sample data for demonstration
  const sampleEmotions = [
    { emotion: "Interest", level: 80 },
    { emotion: "Confusion", level: 30 },
    { emotion: "Satisfaction", level: 60 },
  ];

  const samplePainPoints = [
    "Current process is too manual and time-consuming",
    "Lack of visibility into team productivity",
    "Integration issues with existing tools",
  ];

  // Use provided data or fallback to sample data
  const displayEmotions = emotions.length > 0 ? emotions : sampleEmotions;
  const displayPainPoints = painPoints.length > 0 ? painPoints : samplePainPoints;

  if (!isCallActive) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <p className="text-sm">Emotions & pain points will appear during call</p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-4">
      {/* Emotions Card */}
      <Card className="border-2 border-border shadow-sm">
        <CardHeader className="pb-2 border-b border-border">
          <CardTitle className="text-sm font-medium">Client Emotions</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-3">
            {displayEmotions.map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span>{item.emotion}</span>
                  <span className="font-mono">{item.level}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden border border-border/50">
                  <div 
                    className="h-full bg-primary rounded-full" 
                    style={{ width: `${item.level}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pain Points Card */}
      <Card className="border-2 border-border shadow-sm">
        <CardHeader className="pb-2 border-b border-border">
          <CardTitle className="text-sm font-medium">Pain Points</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <ul className="space-y-2 text-sm">
            {displayPainPoints.map((point, index) => (
              <li key={index} className="p-2 bg-muted rounded border border-border/50">
                {point}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeftInsightsPanel;
