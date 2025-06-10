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
      console.log('Model ID:', PHI3_CONFIG.modelId);
      
      // Load the model using pipeline with simple configuration
      this.model = await pipeline('text-generation', PHI3_CONFIG.modelId, {
        device: 'cpu'
      });

      this.isLoaded = true;
      this.isLoading = false;
      console.log('Phi-3 model loaded successfully!');
      return { success: true };
    } catch (error) {
      this.isLoading = false;
      this.loadError = error instanceof Error ? error.message : String(error);
      console.error('Failed to load Phi-3 model:', error);
      console.error('Error details:', {
        message: this.loadError,
        stack: error instanceof Error ? error.stack : undefined
      });
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
      
      // Simple prompt format for better compatibility
      const result = await this.model(prompt, {
        max_new_tokens: maxTokens,
        temperature: PHI3_CONFIG.temperature,
        do_sample: true,
        return_full_text: false
      });

      const response = result[0].generated_text.trim();
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
      // Simplified processing - start with just emotions
      const emotionsPrompt = `Analyze this sales call transcript for client emotions. Return only a JSON array like: [{"emotion": "Interest", "level": 75}]

Transcript: ${transcript}

JSON response:`;
      
      const emotionsResponse = await this.generateResponse(emotionsPrompt, 200);
      console.log('Raw emotions response:', emotionsResponse);
      
      let emotions = [];
      try {
        // Try to extract JSON from response
        const jsonMatch = emotionsResponse.match(/\[.*\]/);
        if (jsonMatch) {
          emotions = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error('Failed to parse emotions response:', emotionsResponse);
        emotions = [{ emotion: "Interest", level: 50 }]; // Fallback
      }

      // For now, return simplified insights to test if the model works
      const insights = {
        emotions,
        painPoints: ["Price concerns", "Implementation complexity"],
        objections: ["Budget constraints"],
        recommendations: ["Show ROI calculation"],
        nextActions: ["Schedule follow-up"],
        aiCoaching: "Ask about their current challenges",
        callStage: "Discovery"
      };
      
      console.log('Processed insights:', insights);
      return insights;
    } catch (error) {
      console.error('Error processing transcript:', error);
      return defaultPhi3Insights;
    }
  }
  
  // Process transcript incrementally using the Phi-3 model
  async processIncrementalUpdate(
    newSentence: string,
    previousInsights: Phi3Insights,
    recentHistory: string[] = []
  ): Promise<Phi3Insights> {
    if (!newSentence.trim()) {
      return previousInsights;
    }
    
    console.log('Processing incremental update:', newSentence);
    
    if (!this.isLoaded || !this.model) {
      console.warn('Phi-3 model is not loaded, cannot process update');
      return previousInsights;
    }
    
    try {
      // Combine recent history with new sentence for context
      const context = [...recentHistory, newSentence].join(' ');
      
      // Process emotions
      const emotionsPrompt = `Analyze this part of a sales call transcript for client emotions. Return only a JSON array like: [{"emotion": "Interest", "level": 75}]

Transcript: ${context}

JSON response:`;
      
      const emotionsResponse = await this.generateResponse(emotionsPrompt, 200);
      let emotions = previousInsights.emotions;
      
      try {
        // Try to extract JSON from response
        const jsonMatch = emotionsResponse.match(/\[.*\]/);
        if (jsonMatch) {
          emotions = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error('Failed to parse emotions response:', emotionsResponse);
      }
      
      // Process pain points
      const painPointsPrompt = `Identify potential pain points from this sales call transcript segment. Return only a JSON array of strings.

Transcript: ${context}

JSON response:`;
      
      const painPointsResponse = await this.generateResponse(painPointsPrompt, 150);
      let painPoints = previousInsights.painPoints;
      
      try {
        const jsonMatch = painPointsResponse.match(/\[.*\]/);
        if (jsonMatch) {
          const newPainPoints = JSON.parse(jsonMatch[0]);
          // Merge with existing pain points, avoiding duplicates
          painPoints = [...new Set([...painPoints, ...newPainPoints])].slice(0, 5);
        }
      } catch (e) {
        console.error('Failed to parse pain points response:', painPointsResponse);
      }
      
      // Process objections
      const objectionsPrompt = `Identify any objections or concerns from this sales call transcript segment. Return only a JSON array of strings.

Transcript: ${context}

JSON response:`;
      
      const objectionsResponse = await this.generateResponse(objectionsPrompt, 150);
      let objections = previousInsights.objections;
      
      try {
        const jsonMatch = objectionsResponse.match(/\[.*\]/);
        if (jsonMatch) {
          const newObjections = JSON.parse(jsonMatch[0]);
          // Merge with existing objections, avoiding duplicates
          objections = [...new Set([...objections, ...newObjections])].slice(0, 5);
        }
      } catch (e) {
        console.error('Failed to parse objections response:', objectionsResponse);
      }
      
      // Generate AI coaching suggestion
      const coachingPrompt = `As an AI sales coach, suggest one specific question or talking point based on this sales call transcript segment:

Transcript: ${context}

Respond with only a brief, actionable suggestion (max 15 words):`;
      
      const aiCoaching = await this.generateResponse(coachingPrompt, 100);
      
      // Determine call stage
      const stagePrompt = `Based on this sales call transcript segment, identify which stage the call is in. Choose only one from: Discovery, Presentation, Handling Objections, Closing, Follow-up.

Transcript: ${context}

Stage:`;
      
      const callStage = await this.generateResponse(stagePrompt, 50);
      
      // Generate recommendations
      const recommendationsPrompt = `Based on this sales call transcript segment, what should the salesperson focus on next? Return only a JSON array of brief recommendation strings.

Transcript: ${context}

JSON response:`;
      
      const recommendationsResponse = await this.generateResponse(recommendationsPrompt, 150);
      let recommendations = previousInsights.recommendations;
      
      try {
        const jsonMatch = recommendationsResponse.match(/\[.*\]/);
        if (jsonMatch) {
          recommendations = JSON.parse(jsonMatch[0]).slice(0, 3);
        }
      } catch (e) {
        console.error('Failed to parse recommendations response:', recommendationsResponse);
      }
      
      // Generate next actions
      const nextActionsPrompt = `Based on this sales call transcript segment, suggest specific next actions for the salesperson. Return only a JSON array of brief action strings.

Transcript: ${context}

JSON response:`;
      
      const nextActionsResponse = await this.generateResponse(nextActionsPrompt, 150);
      let nextActions = previousInsights.nextActions;
      
      try {
        const jsonMatch = nextActionsResponse.match(/\[.*\]/);
        if (jsonMatch) {
          nextActions = JSON.parse(jsonMatch[0]).slice(0, 3);
        }
      } catch (e) {
        console.error('Failed to parse next actions response:', nextActionsResponse);
      }
      
      // Return updated insights
      return {
        emotions,
        painPoints,
        objections,
        recommendations,
        nextActions,
        aiCoaching: aiCoaching.split('\n')[0].trim(),
        callStage: callStage.split('\n')[0].trim()
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
