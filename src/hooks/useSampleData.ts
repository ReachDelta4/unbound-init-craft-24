
import { useState } from "react";

export interface InsightsData {
  emotions: Array<{ emotion: string; level: number }>;
  painPoints: string[];
  objections: string[];
  recommendations: string[];
  nextActions: string[];
}

export const useSampleData = () => {
  // Sample insights for the current call
  const [insights, setInsights] = useState<InsightsData>({
    emotions: [
      { emotion: "Interest", level: 80 },
      { emotion: "Concern", level: 40 },
      { emotion: "Enthusiasm", level: 65 },
      { emotion: "Skepticism", level: 30 },
    ],
    painPoints: [
      "Integration issues between existing tools",
      "Team communication challenges",
      "Cost management with current solutions",
      "Scalability concerns for growing team",
    ],
    objections: [
      "Budget constraints this quarter",
      "Concerned about implementation time",
      "Questions about technical support availability",
    ],
    recommendations: [
      "Highlight how our integration reduces total cost of ownership",
      "Address implementation timeline - emphasize quick onboarding",
      "Discuss the dedicated support team availability",
      "Demonstrate scalability features for growing teams",
    ],
    nextActions: [
      "Send pricing proposal by Friday",
      "Schedule technical demo with their IT team",
      "Share case studies of similar-sized companies"
    ]
  });

  // Sample transcript - this would come from a real transcription service
  const [transcript, setTranscript] = useState(
    "You: Hello, thanks for joining the call today. How are you doing?\n\n" +
    "Client: I'm doing well, thank you for asking. I'm excited to discuss your product and see if it fits our needs.\n\n" +
    "You: That's great to hear. I'd love to understand your current challenges and how we might be able to address them.\n\n" +
    "Client: Well, our main issue is increasing productivity while keeping our costs manageable. Our team is growing but our tools aren't scaling well."
  );

  // Generate a summary from transcript - in a real app, this would use AI
  const generateSummary = () => {
    return "The client expressed interest in our solution to help with scaling their team while managing costs. They're experiencing integration issues between their existing tools and have concerns about implementation time and support availability.";
  };

  return {
    insights,
    setInsights,
    transcript,
    setTranscript,
    generateSummary
  };
};
