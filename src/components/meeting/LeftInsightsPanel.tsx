
import React from "react";

interface LeftInsightsPanelProps {
  isCallActive: boolean;
  emotions: { emotion: string; level: number }[];
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

  return (
    <div className="h-full space-y-4">
      {/* Client Emotions */}
      <div className="bg-card/95 backdrop-blur-sm border border-border/50 rounded-lg p-4">
        <h3 className="text-sm font-medium mb-3 text-indigo-400">Client Emotions</h3>
        <div className="space-y-3">
          {emotions.length > 0 ? (
            emotions.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs">{item.emotion}</span>
                  <span className="text-xs font-medium">{item.level}%</span>
                </div>
                <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" 
                    style={{ width: `${item.level}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No emotions detected yet</p>
          )}
        </div>
      </div>

      {/* Pain Points */}
      <div className="bg-card/95 backdrop-blur-sm border border-border/50 rounded-lg p-4">
        <h3 className="text-sm font-medium mb-3 text-red-400">Pain Points</h3>
        <div className="space-y-2">
          {painPoints.length > 0 ? (
            painPoints.map((point, index) => (
              <div key={index} className="text-xs p-2 bg-red-500/10 border border-red-500/20 rounded">
                {point}
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No pain points identified yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeftInsightsPanel;
