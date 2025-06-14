import { useState, useCallback, useRef, useEffect } from 'react';
import geminiClientInstance from '../integrations/gemini/GeminiClient';
import { ModelSettings } from "@/types";

export interface ChatMessage {
  role: 'user' | 'assistant' | 'model';
  parts: { text: string }[];
}

export function useGeminiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClientAvailable, setIsClientAvailable] = useState(false);
  const [modelSettings, setModelSettings] = useState<ModelSettings | null>(null);

  // Check if API key is available and load settings
  useEffect(() => {
    // Check if the client is available
    if (geminiClientInstance) {
      setIsClientAvailable(true);
      
      // Get current settings from the client
      try {
        const settings = geminiClientInstance.getSettings();
        setModelSettings(settings);
      } catch (error) {
        console.error('Failed to get model settings:', error);
      }
    } else {
      setIsClientAvailable(false);
      setError('Gemini API client is not available. Please check your API key in the .env.local file.');
    }
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !isClientAvailable) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Add user message to the chat
      const userMessage: ChatMessage = { role: 'user', parts: [{ text: content }] };
      setMessages(prev => [...prev, userMessage]);
      
      // Get response from Gemini
      if (!geminiClientInstance) {
        throw new Error('Gemini client is not available');
      }
      
      const response = await geminiClientInstance.sendStatelessMessage(content);
      
      // Add assistant message to the chat
      const assistantMessage: ChatMessage = { role: 'assistant', parts: [{ text: response }] };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while communicating with Gemini');
    } finally {
      setIsLoading(false);
    }
  }, [isClientAvailable]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const updateModelSettings = useCallback((newSettings: ModelSettings) => {
    if (geminiClientInstance) {
      try {
        geminiClientInstance.updateSettings(newSettings);
        setModelSettings(newSettings);
      } catch (error) {
        console.error('Failed to update model settings:', error);
        setError('Failed to update model settings');
      }
    }
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
    isClientAvailable,
    modelSettings,
    updateModelSettings
  };
} 