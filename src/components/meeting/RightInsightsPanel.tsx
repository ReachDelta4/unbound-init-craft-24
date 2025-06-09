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
  // Sample data for demonstration
  const sampleObjections = [
    "Price is too high compared to competitors",
    "Concerned about implementation timeline",
    "Need approval from other stakeholders"
  ];

  const sampleRecommendations = [
    "Focus on ROI and long-term value",
    "Offer implementation assistance",
    "Provide case studies from similar clients"
  ];

  const sampleNextActions = [
    "Schedule follow-up meeting with decision makers",
    "Send pricing comparison document",
    "Share implementation timeline"
  ];

  // Use provided data or fallback to sample data
  const displayObjections = objections.length > 0 ? objections : sampleObjections;
  const displayRecommendations = recommendations.length > 0 ? recommendations : sampleRecommendations;
  const displayNextActions = nextActions.length > 0 ? nextActions : sampleNextActions;

  if (!isCallActive) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <p className="text-sm">Objections & recommendations will appear during call</p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-4">
      {/* Objections Card */}
      <Card className="border-2 border-border shadow-sm">
        <CardHeader className="pb-2 border-b border-border">
          <CardTitle className="text-sm font-medium flex items-center">
            <AlertCircle className="w-4 h-4 mr-1.5 text-amber-500" />
            Objections
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <ul className="space-y-2 text-sm">
            {displayObjections.map((objection, index) => (
              <li key={index} className="p-2 bg-amber-500/10 rounded border border-amber-500/30">
                {objection}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Recommendations Card */}
      <Card className="border-2 border-border shadow-sm">
        <CardHeader className="pb-2 border-b border-border">
          <CardTitle className="text-sm font-medium flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-1.5 text-green-500" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <ul className="space-y-2 text-sm">
            {displayRecommendations.map((recommendation, index) => (
              <li key={index} className="p-2 bg-green-500/10 rounded border border-green-500/30">
                {recommendation}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Next Actions Card */}
      <Card className="border-2 border-border shadow-sm">
        <CardHeader className="pb-2 border-b border-border">
          <CardTitle className="text-sm font-medium flex items-center">
            <ArrowRight className="w-4 h-4 mr-1.5 text-blue-500" />
            Next Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <ul className="space-y-2 text-sm">
            {displayNextActions.map((action, index) => (
              <li key={index} className="p-2 bg-blue-500/10 rounded border border-blue-500/30">
                {action}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default RightInsightsPanel;
