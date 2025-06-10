
export const useMeetingInsights = () => {
  const insights = {
    emotions: [
      { emotion: "Interest", level: 75 },
      { emotion: "Confusion", level: 25 },
      { emotion: "Satisfaction", level: 60 },
    ],
    painPoints: [
      "Current process is too manual",
      "Lack of visibility into team productivity",
      "Integration issues with existing tools"
    ],
    objections: [
      "Price is too high compared to competitors",
      "Implementation timeline is too long",
      "Need approval from other stakeholders"
    ],
    recommendations: [
      "Focus on ROI and long-term value",
      "Offer implementation assistance",
      "Provide case studies from similar clients"
    ],
    nextActions: [
      "Schedule follow-up meeting with decision makers",
      "Send pricing comparison document",
      "Share implementation timeline"
    ]
  };

  return insights;
};
