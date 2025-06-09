
import React from "react";

interface RightInsightsPanelProps {
  isCallActive: boolean;
  objections: string[];
  recommendations: string[];
  nextActions: string[];
}

const RightInsightsPanel = ({ isCallActive, objections, recommendations, nextActions }: RightInsightsPanelProps) => {
  if (!isCallActive) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <p className="text-sm">Objections & recommendations will appear during call</p>
      </div>
    );
  }

  return (
    <div className="h-full space-y-4">
      {/* Potential Objections */}
      <div className="bg-card/95 backdrop-blur-sm border border-border/50 rounded-lg p-4">
        <h3 className="text-sm font-medium mb-3 text-amber-400">Potential Objections</h3>
        <div className="space-y-2">
          {objections.length > 0 ? (
            objections.map((objection, index) => (
              <div key={index} className="text-xs p-2 bg-amber-500/10 border border-amber-500/20 rounded">
                {objection}
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No objections detected yet</p>
          )}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-card/95 backdrop-blur-sm border border-border/50 rounded-lg p-4">
        <h3 className="text-sm font-medium mb-3 text-emerald-400">Follow-up Recommendations</h3>
        <div className="space-y-2">
          {recommendations.length > 0 ? (
            recommendations.map((rec, index) => (
              <div key={index} className="text-xs p-2 bg-emerald-500/10 border border-emerald-500/20 rounded">
                {rec}
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No recommendations yet</p>
          )}
        </div>
      </div>

      {/* Next Actions */}
      <div className="bg-card/95 backdrop-blur-sm border border-border/50 rounded-lg p-4">
        <h3 className="text-sm font-medium mb-3 text-blue-400">Action Items</h3>
        <div className="space-y-2">
          {nextActions.length > 0 ? (
            nextActions.map((action, index) => (
              <div key={index} className="text-xs p-2 bg-blue-500/10 border border-blue-500/20 rounded">
                {action}
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No action items yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RightInsightsPanel;
