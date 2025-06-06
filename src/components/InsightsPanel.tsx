import React from "react";

interface InsightsData {
  emotions: { emotion: string; level: number }[];
  painPoints: string[];
  objections: string[];
  recommendations: string[];
  nextActions?: string[];
}

interface InsightsPanelProps {
  isCallActive: boolean;
  insights?: InsightsData;
}

const InsightsPanel = ({ isCallActive, insights }: InsightsPanelProps) => {
  // Use provided insights or default empty state
  const displayInsights = insights || {
    emotions: [],
    painPoints: [],
    objections: [],
    recommendations: [],
    nextActions: []
  };

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-xl font-semibold mb-6 text-center">AI Insights</h2>

      {isCallActive ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
          {/* Emotion Analysis */}
          {displayInsights.emotions.length > 0 && (
            <div className="bg-slate-800 rounded-xl p-4">
              <h3 className="text-lg font-medium mb-3 text-indigo-300">Client Emotions</h3>
              <div className="space-y-2">
                {displayInsights.emotions.map((item, index) => (
                  <div key={index} className="mb-2">
                    <div className="flex justify-between mb-1">
                      <span>{item.emotion}</span>
                      <span>{item.level}%</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" 
                        style={{ width: `${item.level}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pain Points */}
          {displayInsights.painPoints.length > 0 && (
            <div className="bg-slate-800 rounded-xl p-4">
              <h3 className="text-lg font-medium mb-3 text-red-300">Pain Points</h3>
              <ul className="list-disc pl-5 space-y-2">
                {displayInsights.painPoints.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Objections */}
          {displayInsights.objections.length > 0 && (
            <div className="bg-slate-800 rounded-xl p-4">
              <h3 className="text-lg font-medium mb-3 text-amber-300">Potential Objections</h3>
              <ul className="list-disc pl-5 space-y-2">
                {displayInsights.objections.map((objection, index) => (
                  <li key={index}>{objection}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {displayInsights.recommendations.length > 0 && (
            <div className="bg-slate-800 rounded-xl p-4">
              <h3 className="text-lg font-medium mb-3 text-emerald-300">Focus Next</h3>
              <ul className="list-disc pl-5 space-y-2">
                {displayInsights.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Next Actions */}
          {displayInsights.nextActions && displayInsights.nextActions.length > 0 && (
            <div className="bg-slate-800 rounded-xl p-4">
              <h3 className="text-lg font-medium mb-3 text-blue-300">Next Actions</h3>
              <ul className="list-disc pl-5 space-y-2">
                {displayInsights.nextActions.map((action, index) => (
                  <li key={index}>{action}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center p-8 max-w-md">
            <div className="mb-4 text-slate-500">
              <svg 
                className="w-16 h-16 mx-auto opacity-50" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="1.5" 
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <h3 className="text-xl text-slate-400 mb-2">AI insights available during call</h3>
            <p className="text-slate-500">
              Start a call to receive real-time insights, including client emotions, pain points, potential objections, and recommendations.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsightsPanel;
