
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LeftInsightsPanelProps {
  isCallActive: boolean;
  emotions: Array<{ emotion: string; level: number }>;
  painPoints: string[];
}

const LeftInsightsPanel = ({ isCallActive, emotions, painPoints }: LeftInsightsPanelProps) => {
  if (!isCallActive) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <p className="text-sm">Emotions & pain points will appear during call</p>
      </div>
    );
  }

  // Filter out emotions with 0 level and empty arrays
  const activeEmotions = emotions.filter(emotion => emotion.level > 0);
  const activePainPoints = painPoints.filter(point => point && point.trim().length > 0);

  // If no data, show a waiting message
  if (activeEmotions.length === 0 && activePainPoints.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground p-4">
        <p className="text-sm text-center">AI is processing transcript data...<br />Insights will appear here.</p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-4">
      {/* Emotions Card - Only show if we have active emotions */}
      {activeEmotions.length > 0 && (
        <Card className="border-2 border-border shadow-sm">
          <CardHeader className="pb-2 border-b border-border">
            <CardTitle className="text-sm font-medium">Client Emotions</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {activeEmotions.map((item, index) => (
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
      )}

      {/* Pain Points Card - Only show if we have pain points */}
      {activePainPoints.length > 0 && (
        <Card className="border-2 border-border shadow-sm">
          <CardHeader className="pb-2 border-b border-border">
            <CardTitle className="text-sm font-medium">Pain Points</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ul className="space-y-2 text-sm">
              {activePainPoints.map((point, index) => (
                <li key={index} className="p-2 bg-muted rounded border border-border/50">
                  {point}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LeftInsightsPanel;
