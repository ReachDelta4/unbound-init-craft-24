
import { pipeline } from '@huggingface/transformers';
import { PHI3_CONFIG, Phi3Insights, defaultPhi3Insights } from './phi3Config';

class Phi3Client {
  private model: any = null;
  private isLoading: boolean = false;
  private isLoaded: boolean = false;
  private loadError: string | null = null;

  // Initialize the model
  async initialize(): Promise<{ success: boolean; error?: string }> {
    if (this.isLoaded) {
      console.log('Phi-3 model already loaded');
      return { success: true };
    }

    if (this.isLoading) {
      console.log('Phi-3 model loading already in progress');
      return { success: false, error: "Model loading is already in progress" };
    }

    try {
      this.isLoading = true;
      this.loadError = null;

      console.log('Starting Phi-3 model initialization...');
      // Load the model using pipeline
      this.model = await pipeline('text-generation', PHI3_CONFIG.modelId, {
        quantized: true, // Use quantized model for better performance
        device: 'cpu', // Start with CPU, can be upgraded to webgpu later
      });

      this.isLoaded = true;
      this.isLoading = false;
      console.log('Phi-3 model loaded successfully!');
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
      console.log('Generating response for prompt:', prompt.substring(0, 100) + '...');
      
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
      const response = assistantPart ? assistantPart.trim().replace('<|end|>', '') : '';
      
      console.log('Generated response:', response.substring(0, 100) + '...');
      return response;
    } catch (error) {
      console.error('Error generating response:', error);
      throw error;
    }
  }

  // Process transcript to extract insights
  async processTranscript(transcript: string): Promise<Phi3Insights> {
    if (!transcript.trim()) {
      console.log('Empty transcript, returning default insights');
      return defaultPhi3Insights;
    }

    console.log('Processing full transcript with Phi-3:', transcript.substring(0, 100) + '...');

    try {
      // Process emotions
      const emotionsPrompt = PHI3_CONFIG.prompts.emotions + "\n\nTranscript: " + transcript;
      const emotionsResponse = await this.generateResponse(emotionsPrompt);
      let emotions;
      try {
        emotions = JSON.parse(emotionsResponse);
        console.log('Parsed emotions:', emotions);
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
        console.log('Parsed pain points:', painPoints);
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
        console.log('Parsed objections:', objections);
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
        console.log('Parsed recommendations:', recommendations);
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
        console.log('Parsed next actions:', nextActions);
      } catch (e) {
        console.error('Failed to parse next actions response:', nextActionsResponse);
        nextActions = defaultPhi3Insights.nextActions;
      }

      // Process AI coaching
      const aiCoachingPrompt = PHI3_CONFIG.prompts.aiCoaching + "\n\nTranscript: " + transcript;
      const aiCoaching = await this.generateResponse(aiCoachingPrompt);
      console.log('AI coaching response:', aiCoaching);

      // Process call stage
      const callStagePrompt = PHI3_CONFIG.prompts.callStage + "\n\nTranscript: " + transcript;
      const callStage = await this.generateResponse(callStagePrompt);
      console.log('Call stage response:', callStage);

      const finalInsights = {
        emotions,
        painPoints,
        objections,
        recommendations,
        nextActions,
        aiCoaching,
        callStage
      };
      
      console.log('Final processed insights:', finalInsights);
      return finalInsights;
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
    
    console.log('Processing incremental update:', newSentence);
    
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
      
      const updatedInsights = {
        emotions,
        painPoints,
        objections,
        recommendations,
        nextActions,
        aiCoaching,
        callStage
      };
      
      console.log('Updated insights from incremental processing:', updatedInsights);
      return updatedInsights;
    } catch (error) {
      console.error('Error processing incremental update:', error);
      return previousInsights;
    }
  }
}

// Create a singleton instance
const phi3Client = new Phi3Client();

export default phi3Client;
