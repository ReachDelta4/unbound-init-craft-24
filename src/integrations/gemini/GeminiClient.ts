import { GoogleGenAI } from "@google/genai";

// Define types for model settings
interface ModelSettings {
  model: string;
  thinkingMode: "off" | "auto" | "on";
  temperature: number;
  topP: number;
  topK: number;
  maxOutputTokens: number;
  stopSequences: string[];
  safetySettings: {
    harassment: string;
    hateSpeech: string;
    sexuallyExplicit: string;
    dangerous: string;
  };
}

// Default settings
const defaultSettings: ModelSettings = {
  model: "gemini-2.5-flash-preview-05-20",
  thinkingMode: "off",
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 2048,
  stopSequences: [],
  safetySettings: {
    harassment: "block_medium_and_above",
    hateSpeech: "block_medium_and_above",
    sexuallyExplicit: "block_medium_and_above",
    dangerous: "block_medium_and_above"
  }
};

/**
 * Client for interacting with the Gemini API
 */
class GeminiClient {
  private ai: GoogleGenAI;
  private settings: ModelSettings;
  private isInitialized: boolean = false;
  
  constructor() {
    console.log('GeminiClient: Constructor called');
    
    // Get API key from environment variables
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || 
                  'AIzaSyDLzE1QRGxF1jLIFtvrUlFpua78VruMNjM'; // Fallback to hardcoded key as last resort
    
    console.log('GeminiClient: API key available:', !!apiKey, 'Length:', apiKey?.length || 0);
    
    if (!apiKey) {
      console.error('GeminiClient: API key not found in environment variables');
      throw new Error('Gemini API key not found. Please check your .env file and make sure VITE_GEMINI_API_KEY is set.');
    }
    
    // Load settings from localStorage or use defaults
    try {
      const savedSettings = localStorage.getItem("geminiModelSettings");
      this.settings = savedSettings ? JSON.parse(savedSettings) : defaultSettings;
      console.log('GeminiClient: Using model settings:', this.settings.model, 'with temperature:', this.settings.temperature);
    } catch (error) {
      console.warn('GeminiClient: Failed to load model settings from localStorage, using defaults:', error);
      this.settings = defaultSettings;
    }
    
    try {
      console.log('GeminiClient: Initializing GoogleGenAI with API key');
      this.ai = new GoogleGenAI({ apiKey });
      this.isInitialized = true;
      console.log('GeminiClient: Successfully initialized GoogleGenAI');
    } catch (error) {
      console.error('GeminiClient: Failed to initialize GoogleGenAI:', error);
      this.isInitialized = false;
      throw error;
    }
  }
  
  /**
   * Send a message to Gemini and get a response
   */
  async sendMessage(message: string): Promise<string> {
    console.log('GeminiClient: sendMessage called with message:', message.substring(0, 50) + (message.length > 50 ? '...' : ''));
    
    if (!this.isInitialized) {
      console.error('GeminiClient: Cannot send message - client is not initialized');
      throw new Error('GeminiClient is not initialized');
    }
    
    try {
      // Convert safety settings to the format expected by the API
      const safetySettings = Object.entries(this.settings.safetySettings).map(([category, threshold]) => ({
        category: category.toUpperCase(),
        threshold
      }));
      
      // Create request configuration based on settings
      const config = {
        temperature: this.settings.temperature,
        topP: this.settings.topP,
        topK: this.settings.topK,
        maxOutputTokens: this.settings.maxOutputTokens,
        stopSequences: this.settings.stopSequences,
        safetySettings
      };
      
      // Add thinking mode if it's not "auto"
      if (this.settings.thinkingMode !== "auto") {
        Object.assign(config, {
          thinking: this.settings.thinkingMode === "on"
        });
      }
      
      console.log('GeminiClient: Sending request to Gemini API with model:', this.settings.model);
      
      const response = await this.ai.models.generateContent({
        model: this.settings.model,
        contents: message,
        generationConfig: config
      });
      
      console.log('GeminiClient: Response received from Gemini API');
      
      if (!response.text) {
        console.warn('GeminiClient: Empty response received from Gemini API');
        return "No response received";
      }
      
      console.log('GeminiClient: Response text:', response.text.substring(0, 50) + (response.text.length > 50 ? '...' : ''));
      return response.text;
    } catch (error) {
      console.error('GeminiClient: Error sending message to Gemini:', error);
      throw error;
    }
  }
  
  /**
   * Get the current model settings
   */
  getSettings(): ModelSettings {
    return { ...this.settings };
  }
  
  /**
   * Update the model settings
   */
  updateSettings(newSettings: ModelSettings): void {
    console.log('GeminiClient: Updating settings to model:', newSettings.model);
    this.settings = { ...newSettings };
    localStorage.setItem("geminiModelSettings", JSON.stringify(this.settings));
  }
  
  /**
   * Check if the client is properly initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

// Create a singleton instance
const geminiClientInstance = (() => {
  console.log('GeminiClient: Creating singleton instance');
  try {
    const instance = new GeminiClient();
    console.log('GeminiClient: Singleton instance created successfully');
    return instance;
  } catch (error) {
    console.error('GeminiClient: Failed to create singleton instance:', error);
    return null;
  }
})();

export default geminiClientInstance; 