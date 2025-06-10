import { pipeline } from '@xenova/transformers';
import { PHI3_CONFIG, Phi3Insights, defaultPhi3Insights } from './phi3Config';

class Phi3Client {
  private model: any = null;
  private isLoading: boolean = false;
  private isLoaded: boolean = false;
  private loadError: string | null = null;

  // Initialize the model
  async initialize(): Promise<{ success: boolean; error?: string }> {
    if (this.isLoaded) {
      return { success: true };
    }

    if (this.isLoading) {
      return { success: false, error: "Model loading is already in progress" };
    }

    try {
      this.isLoading = true;
      this.loadError = null;

      // Load the model using pipeline
      console.log('Loading Phi-3 model...');
      this.model = await pipeline('text-generation', PHI3_CONFIG.modelId, {
        quantized: true, // Use quantized model for better performance
      });

      this.isLoaded = true;
      this.isLoading = false;
      return { success: true };
    } catch (error) {
      this.isLoading = false;
      this.loadError = error instanceof Error ? error.message : String(error);
      console.error('Failed to load Phi-3 model:', error);
      return { 
        success: false, 
        error: `Failed to load Phi-3 model: ${this.loadError}` 
      };
    }
  }

  // Get loading status
  getStatus(): { isLoaded: boolean; isLoading: boolean; error: string | null } {
    return {
      isLoaded: this.isLoaded,
      isLoading: this.isLoading,
      error: this.loadError
    };
  }

  // Generate responses from the model
  async generateResponse(
    prompt: string,
    maxTokens: number = PHI3_CONFIG.maxTokens
  ): Promise<string> {
    if (!this.isLoaded || !this.model) {
      throw new Error('Model is not loaded. Call initialize() first.');
    }

    try {
      // Format the message as a chat
      const formattedPrompt = `<|user|>${prompt}<|end|><|assistant|>`;

      // Generate response
      const result = await this.model(formattedPrompt, {
        max_new_tokens: maxTokens,
        temperature: PHI3_CONFIG.temperature,
        top_p: PHI3_CONFIG.topP,
        repetition_penalty: 1.1,
      });

      // Extract the assistant's response part
      const generatedText = result[0].generated_text;
      const assistantPart = generatedText.split('<|assistant|>')[1];
      return assistantPart ? assistantPart.trim().replace('<|end|>', '') : '';
    } catch (error) {
      console.error('Error generating response:', error);
      throw error;
    }
  }

  // Process transcript to extract insights
  async processTranscript(transcript: string): Promise<Phi3Insights> {
    if (!transcript.trim()) {
      return defaultPhi3Insights;
    }

    try {
      // Process emotions
      const emotionsPrompt = PHI3_CONFIG.prompts.emotions + "\n\nTranscript: " + transcript;
      const emotionsResponse = await this.generateResponse(emotionsPrompt);
      let emotions;
      try {
        emotions = JSON.parse(emotionsResponse);
      } catch (e) {
        console.error('Failed to parse emotions response:', emotionsResponse);
        emotions = defaultPhi3Insights.emotions;
      }

      // Process pain points
      const painPointsPrompt = PHI3_CONFIG.prompts.painPoints + "\n\nTranscript: " + transcript;
      const painPointsResponse = await this.generateResponse(painPointsPrompt);
      let painPoints;
      try {
        painPoints = JSON.parse(painPointsResponse);
      } catch (e) {
        console.error('Failed to parse pain points response:', painPointsResponse);
        painPoints = defaultPhi3Insights.painPoints;
      }

      // Process objections
      const objectionsPrompt = PHI3_CONFIG.prompts.objections + "\n\nTranscript: " + transcript;
      const objectionsResponse = await this.generateResponse(objectionsPrompt);
      let objections;
      try {
        objections = JSON.parse(objectionsResponse);
      } catch (e) {
        console.error('Failed to parse objections response:', objectionsResponse);
        objections = defaultPhi3Insights.objections;
      }

      // Process recommendations
      const recommendationsPrompt = PHI3_CONFIG.prompts.recommendations + "\n\nTranscript: " + transcript;
      const recommendationsResponse = await this.generateResponse(recommendationsPrompt);
      let recommendations;
      try {
        recommendations = JSON.parse(recommendationsResponse);
      } catch (e) {
        console.error('Failed to parse recommendations response:', recommendationsResponse);
        recommendations = defaultPhi3Insights.recommendations;
      }

      // Process next actions
      const nextActionsPrompt = PHI3_CONFIG.prompts.nextActions + "\n\nTranscript: " + transcript;
      const nextActionsResponse = await this.generateResponse(nextActionsPrompt);
      let nextActions;
      try {
        nextActions = JSON.parse(nextActionsResponse);
      } catch (e) {
        console.error('Failed to parse next actions response:', nextActionsResponse);
        nextActions = defaultPhi3Insights.nextActions;
      }

      // Process AI coaching
      const aiCoachingPrompt = PHI3_CONFIG.prompts.aiCoaching + "\n\nTranscript: " + transcript;
      const aiCoaching = await this.generateResponse(aiCoachingPrompt);

      // Process call stage
      const callStagePrompt = PHI3_CONFIG.prompts.callStage + "\n\nTranscript: " + transcript;
      const callStage = await this.generateResponse(callStagePrompt);

      return {
        emotions,
        painPoints,
        objections,
        recommendations,
        nextActions,
        aiCoaching,
        callStage
      };
    } catch (error) {
      console.error('Error processing transcript:', error);
      return defaultPhi3Insights;
    }
  }
  
  // Process transcript incrementally (one sentence at a time)
  async processIncrementalUpdate(
    newSentence: string,
    previousInsights: Phi3Insights,
    recentHistory: string[] = []
  ): Promise<Phi3Insights> {
    // Combine recent history with the new sentence for context
    const context = [...recentHistory, newSentence].join(" ");
    
    if (!context.trim()) {
      return previousInsights;
    }
    
    try {
      // For incremental updates, we do targeted analysis to reduce processing
      // Let's optimize by analyzing the most likely things to change
      
      // Always update AI coaching and call stage as they're small and important
      const aiCoachingPrompt = PHI3_CONFIG.prompts.aiCoaching + "\n\nRecent transcript: " + context;
      const aiCoaching = await this.generateResponse(aiCoachingPrompt);
      
      const callStagePrompt = PHI3_CONFIG.prompts.callStage + "\n\nRecent transcript: " + context;
      const callStage = await this.generateResponse(callStagePrompt);
      
      // Update emotions with every new sentence
      const emotionsPrompt = PHI3_CONFIG.prompts.emotions + "\n\nRecent transcript: " + context;
      const emotionsResponse = await this.generateResponse(emotionsPrompt);
      let emotions;
      try {
        emotions = JSON.parse(emotionsResponse);
      } catch (e) {
        console.error('Failed to parse emotions response:', emotionsResponse);
        emotions = previousInsights.emotions;
      }
      
      // For the other fields, check if the new sentence contains relevant keywords
      // that might indicate a change in these insights
      
      // Basic sentiment analysis to decide what to update
      const sentimentKeywords = {
        painPoints: ["problem", "issue", "challenge", "difficult", "struggle", "pain", "concern", "worry", "frustration"],
        objections: ["but", "however", "expensive", "cost", "price", "competitor", "alternative", "not sure", "hesitant"],
        recommendations: ["need", "should", "could", "recommend", "suggestion", "idea", "better"],
        nextActions: ["next", "follow", "schedule", "meeting", "call", "demo", "send", "share"]
      };
      
      // Initialize with previous values
      let painPoints = previousInsights.painPoints;
      let objections = previousInsights.objections;
      let recommendations = previousInsights.recommendations;
      let nextActions = previousInsights.nextActions;
      
      // Check for pain point keywords
      if (sentimentKeywords.painPoints.some(keyword => newSentence.toLowerCase().includes(keyword))) {
        const painPointsPrompt = PHI3_CONFIG.prompts.painPoints + "\n\nRecent transcript: " + context;
        const painPointsResponse = await this.generateResponse(painPointsPrompt);
        try {
          painPoints = JSON.parse(painPointsResponse);
        } catch (e) {
          console.error('Failed to parse pain points response:', painPointsResponse);
        }
      }
      
      // Check for objection keywords
      if (sentimentKeywords.objections.some(keyword => newSentence.toLowerCase().includes(keyword))) {
        const objectionsPrompt = PHI3_CONFIG.prompts.objections + "\n\nRecent transcript: " + context;
        const objectionsResponse = await this.generateResponse(objectionsPrompt);
        try {
          objections = JSON.parse(objectionsResponse);
        } catch (e) {
          console.error('Failed to parse objections response:', objectionsResponse);
        }
      }
      
      // Check for recommendation keywords
      if (sentimentKeywords.recommendations.some(keyword => newSentence.toLowerCase().includes(keyword))) {
        const recommendationsPrompt = PHI3_CONFIG.prompts.recommendations + "\n\nRecent transcript: " + context;
        const recommendationsResponse = await this.generateResponse(recommendationsPrompt);
        try {
          recommendations = JSON.parse(recommendationsResponse);
        } catch (e) {
          console.error('Failed to parse recommendations response:', recommendationsResponse);
        }
      }
      
      // Check for next action keywords
      if (sentimentKeywords.nextActions.some(keyword => newSentence.toLowerCase().includes(keyword))) {
        const nextActionsPrompt = PHI3_CONFIG.prompts.nextActions + "\n\nRecent transcript: " + context;
        const nextActionsResponse = await this.generateResponse(nextActionsPrompt);
        try {
          nextActions = JSON.parse(nextActionsResponse);
        } catch (e) {
          console.error('Failed to parse next actions response:', nextActionsResponse);
        }
      }
      
      return {
        emotions,
        painPoints,
        objections,
        recommendations,
        nextActions,
        aiCoaching,
        callStage
      };
    } catch (error) {
      console.error('Error processing incremental update:', error);
      return previousInsights;
    }
  }
}

// Create a singleton instance
const phi3Client = new Phi3Client();

export default phi3Client; 