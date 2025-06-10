
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
  
  // Process transcript incrementally (simplified for testing)
  async processIncrementalUpdate(
    newSentence: string,
    previousInsights: Phi3Insights,
    recentHistory: string[] = []
  ): Promise<Phi3Insights> {
    if (!newSentence.trim()) {
      return previousInsights;
    }
    
    console.log('Processing incremental update:', newSentence);
    
    try {
      // For testing, just update emotions with simple logic
      const emotions = previousInsights.emotions.map(emotion => ({
        ...emotion,
        level: Math.min(100, emotion.level + Math.floor(Math.random() * 10))
      }));
      
      return {
        ...previousInsights,
        emotions,
        aiCoaching: `Consider asking about: "${newSentence.split(' ').slice(0, 3).join(' ')}..."`
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
