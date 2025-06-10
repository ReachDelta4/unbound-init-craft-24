
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

interface RightInsightsPanelProps {
  isCallActive: boolean;
  objections: string[];
  recommendations: string[];
  nextActions: string[];
}

const RightInsightsPanel = ({ 
  isCallActive, 
  objections, 
  recommendations, 
  nextActions 
}: RightInsightsPanelProps) => {
  if (!isCallActive) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <p className="text-sm">Objections & recommendations will appear during call</p>
      </div>
    );
  }

  // Filter out empty strings and null values
  const activeObjections = objections.filter(obj => obj && obj.trim().length > 0);
  const activeRecommendations = recommendations.filter(rec => rec && rec.trim().length > 0);
  const activeNextActions = nextActions.filter(action => action && action.trim().length > 0);

  // If no data, show a waiting message
  if (activeObjections.length === 0 && activeRecommendations.length === 0 && activeNextActions.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground p-4">
        <p className="text-sm text-center">AI is processing transcript data...<br />Insights will appear here.</p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-4">
      {/* Objections Card - Only show if we have objections */}
      {activeObjections.length > 0 && (
        <Card className="border-2 border-border shadow-sm">
          <CardHeader className="pb-2 border-b border-border">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertCircle className="w-4 h-4 mr-1.5 text-amber-500" />
              Objections
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ul className="space-y-2 text-sm">
              {activeObjections.map((objection, index) => (
                <li key={index} className="p-2 bg-amber-500/10 rounded border border-amber-500/30">
                  {objection}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Recommendations Card - Only show if we have recommendations */}
      {activeRecommendations.length > 0 && (
        <Card className="border-2 border-border shadow-sm">
          <CardHeader className="pb-2 border-b border-border">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1.5 text-green-500" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ul className="space-y-2 text-sm">
              {activeRecommendations.map((recommendation, index) => (
                <li key={index} className="p-2 bg-green-500/10 rounded border border-green-500/30">
                  {recommendation}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Next Actions Card - Only show if we have next actions */}
      {activeNextActions.length > 0 && (
        <Card className="border-2 border-border shadow-sm">
          <CardHeader className="pb-2 border-b border-border">
            <CardTitle className="text-sm font-medium flex items-center">
              <ArrowRight className="w-4 h-4 mr-1.5 text-blue-500" />
              Next Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ul className="space-y-2 text-sm">
              {activeNextActions.map((action, index) => (
                <li key={index} className="p-2 bg-blue-500/10 rounded border border-blue-500/30">
                  {action}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RightInsightsPanel;
