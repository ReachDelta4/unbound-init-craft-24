import {
  GoogleGenerativeAI,
  GenerativeModel,
  ChatSession,
  GenerationConfig,
  Content,
} from "@google/generative-ai";
import { generalChatSystemPrompt } from "./SystemPrompts";
import { ChatMessage } from "@/hooks/useGeminiChat";
import GeminiClient from "./GeminiClient";

/**
 * A dedicated service for the global AI chat feature.
 * Manages a stateful chat session with a general-purpose system prompt.
 */
export class GeminiChatService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private chatSession: ChatSession | null = null;
  private apiKey: string | null = null;

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || null;

    if (!this.apiKey) {
      console.error(
        "GeminiChatService: API key not found. Please set VITE_GEMINI_API_KEY."
      );
      // Create dummy objects to prevent crashes
      this.genAI = {} as GoogleGenerativeAI;
      this.model = {} as GenerativeModel;
      return;
    }

    this.genAI = new GoogleGenerativeAI(this.apiKey);
    
    // Get model settings from GeminiClient
    const settings = GeminiClient.getSettings();
    
    this.model = this.genAI.getGenerativeModel({
      model: settings.model,
    });

    this.startChatSession([]); // Start with empty history initially
  }

  private startChatSession(initialHistory: Content[]) {
    if (!this.model) {
      console.error("GeminiChatService: Model not initialized.");
      return;
    }
    
    console.log("GeminiChatService: Starting new stateful chat session.");
    
    // Get model settings from GeminiClient
    const settings = GeminiClient.getSettings();
    
    this.chatSession = this.model.startChat({
      systemInstruction: {
        role: "system",
        parts: [{ text: generalChatSystemPrompt }],
      },
      history: initialHistory,
      generationConfig: {
        // Use settings from GeminiClient
        temperature: settings.temperature,
        topP: settings.topP,
        topK: settings.topK,
        maxOutputTokens: settings.maxOutputTokens,
        stopSequences: settings.stopSequences,
      } as GenerationConfig,
    });
  }

  /**
   * Starts a new chat session, optionally with a pre-existing history.
   * @param history An array of `ChatMessage` objects to initialize the chat with.
   */
  public startNewChat(history: ChatMessage[] = []) {
    const sdkHistory = history.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    })) as Content[];

    // Always get a fresh model with the latest settings
    if (this.genAI && this.apiKey) {
      const settings = GeminiClient.getSettings();
      console.log(`GeminiChatService: Using model ${settings.model} for new chat`);
      this.model = this.genAI.getGenerativeModel({
        model: settings.model,
      });
    }

    this.startChatSession(sdkHistory);
  }

  public async sendMessage(message: string): Promise<string> {
    if (!this.chatSession) {
      throw new Error("Chat session is not initialized.");
    }
    
    try {
      const result = await this.chatSession.sendMessage(message);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error("GeminiChatService: Error sending message:", error);
      // Attempt to restart the session on error
      this.startNewChat(); // Reset with empty history
      return "There was an issue with the connection. I've started a new chat session. Please try your message again.";
    }
  }

  public isAvailable(): boolean {
    return !!this.apiKey;
  }
} 