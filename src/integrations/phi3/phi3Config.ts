export const PHI3_CONFIG = {
  // Model configuration
  modelId: "Xenova/phi-3-mini-4k-instruct",
  maxTokens: 512,
  temperature: 0.7,
  topP: 0.95,
  
  // System prompts for different analysis types
  prompts: {
    emotions: `
      Analyze the following meeting transcript and identify the client's emotions.
      Focus on detecting: Interest, Concern, Enthusiasm, and Skepticism.
      Rate each detected emotion on a scale from 0-100.
      Keep your response concise and formatted as JSON with this structure:
      [{"emotion": "Interest", "level": 75}, {"emotion": "Concern", "level": 30}]
    `,
    
    painPoints: `
      Analyze the following meeting transcript and identify potential client pain points.
      Focus on problems, challenges, or frustrations the client mentions.
      Format your response as a JSON array of strings, limit to 5 key points maximum.
      Example: ["Difficulty integrating with existing tools", "Team adoption concerns"]
    `,
    
    objections: `
      Analyze the following meeting transcript and identify any objections or hesitations.
      Focus on concerns about price, implementation, timing, or competition.
      Format your response as a JSON array of strings, limit to 5 key points maximum.
      Example: ["Concerned about implementation timeline", "Price seems high compared to alternatives"]
    `,
    
    recommendations: `
      Based on the meeting transcript, suggest helpful recommendations.
      Focus on addressing client needs, providing solutions to problems mentioned.
      Format your response as a JSON array of strings, limit to 5 key points maximum.
      Example: ["Demonstrate ROI calculation", "Offer implementation support options"]
    `,
    
    nextActions: `
      Based on the meeting transcript, suggest concrete next steps.
      Focus on actionable items to move the sales process forward.
      Format your response as a JSON array of strings, limit to 3 items maximum.
      Example: ["Schedule technical demo", "Send case study on similar implementation"]
    `,
    
    aiCoaching: `
      As an AI coach for this sales call, provide a single helpful suggestion based on the transcript.
      Focus on questions to ask, points to emphasize, or techniques to use right now.
      Keep it under 20 words, conversational, and immediately actionable.
      Example: "Ask about their current workflow to identify more pain points."
    `,
    
    callStage: `
      Based on the meeting transcript, determine the current stage of this sales call.
      Choose ONE of: Introduction, Discovery, Presentation, Handling Objections, Closing.
      Respond with just the stage name, nothing else.
    `
  }
};

// Typing for Phi3 responses
export interface Phi3Insights {
  emotions: Array<{ emotion: string; level: number }>;
  painPoints: string[];
  objections: string[];
  recommendations: string[];
  nextActions: string[];
  aiCoaching: string;
  callStage: string;
}

// Default empty insights
export const defaultPhi3Insights: Phi3Insights = {
  emotions: [
    { emotion: "Interest", level: 0 },
    { emotion: "Concern", level: 0 },
    { emotion: "Enthusiasm", level: 0 },
    { emotion: "Skepticism", level: 0 }
  ],
  painPoints: [],
  objections: [],
  recommendations: [],
  nextActions: [],
  aiCoaching: "",
  callStage: "Introduction"
}; 