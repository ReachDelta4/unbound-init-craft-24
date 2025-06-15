import { useState, useCallback, useEffect, useMemo } from 'react';
import { GeminiChatService } from '../integrations/gemini/GeminiChatService';
import { chatHistoryManager, StoredChat } from './chatHistoryManager';
import { v4 as uuidv4 } from 'uuid';
import GeminiClient from '../integrations/gemini/GeminiClient';
import { ModelSettings } from '@/types';

export type { ModelSettings } from '@/types';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Instantiate the chat service. A new instance will be created for each hook usage.
// This ensures that each chat component instance has its own isolated chat session.
const chatService = new GeminiChatService();

export function useGeminiChat() {
  const [history, setHistory] = useState<StoredChat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClientAvailable, setIsClientAvailable] = useState(false);
  const [modelSettings, setModelSettings] = useState<ModelSettings | null>(null);

  // Memoize the active chat to prevent unnecessary re-calculations
  const activeChat = useMemo(() => {
    return history.find(c => c.id === activeChatId) || null;
  }, [history, activeChatId]);

  // Load history and model settings from storage on initial mount
  useEffect(() => {
    const storedHistory = chatHistoryManager.getHistory();
    setHistory(storedHistory);
      
    // Set the first chat as active, or create a new one
    if (storedHistory.length > 0) {
      setActiveChatId(storedHistory[0].id);
      chatService.startNewChat(storedHistory[0].messages);
    } else {
      startNewChat();
    }
    
    setIsClientAvailable(chatService.isAvailable());
    
    // Load model settings from GeminiClient
    if (GeminiClient.isReady()) {
      const settings = GeminiClient.getSettings();
      setModelSettings(settings);
    }
    
    // Try to load settings from localStorage as fallback
    const savedSettings = localStorage.getItem("geminiModelSettings");
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setModelSettings(parsedSettings);
      } catch (e) {
        console.error("Failed to parse saved model settings:", e);
      }
    }
  }, []);

  const updateModelSettings = useCallback((newSettings: ModelSettings) => {
    if (GeminiClient.isReady()) {
      GeminiClient.updateSettings(newSettings);
      setModelSettings(newSettings);
      console.log(`useGeminiChat: Updated model settings to ${newSettings.model}`);
      
      // Restart the chat service with new settings
      chatService.startNewChat();
    }
  }, []);

  // Function to reload model settings from GeminiClient
  const reloadModelSettings = useCallback(() => {
    if (GeminiClient.isReady()) {
      const settings = GeminiClient.getSettings();
      setModelSettings(settings);
      return settings;
    }
    return null;
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !isClientAvailable || !activeChat) return;
    
      setIsLoading(true);
      setError(null);
      
    const userMessage: ChatMessage = { role: 'user', content };
    const updatedMessages = [...activeChat.messages, userMessage];
      
    // Update the chat title with the first user message if it's new
    const updatedTitle = activeChat.messages.length === 0 
      ? content.substring(0, 30) 
      : activeChat.title;

    const updatedChat = { ...activeChat, messages: updatedMessages, title: updatedTitle };
    
    // Optimistically update the UI
    setHistory(prev => prev.map(c => c.id === activeChatId ? updatedChat : c));

    try {
      const response = await chatService.sendMessage(content);
      const assistantMessage: ChatMessage = { role: 'assistant', content: response };
      
      const finalChat = { ...updatedChat, messages: [...updatedMessages, assistantMessage] };
      setHistory(prev => prev.map(c => c.id === activeChatId ? finalChat : c));
      chatHistoryManager.saveChat(finalChat);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isClientAvailable, activeChat, activeChatId]);

  const startNewChat = useCallback(() => {
    const newChat: StoredChat = {
      id: uuidv4(),
      startTime: Date.now(),
      title: 'New Chat',
      messages: [],
    };
    
    chatService.startNewChat();
    setHistory(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    chatHistoryManager.saveChat(newChat); // Save the new empty chat
  }, []);

  const switchChat = useCallback((chatId: string) => {
    const chatToLoad = history.find(c => c.id === chatId);
    if (chatToLoad) {
      chatService.startNewChat(chatToLoad.messages);
      setActiveChatId(chatId);
    }
  }, [history]);
  
  const deleteChat = useCallback((chatId: string) => {
    setHistory(prev => prev.filter(c => c.id !== chatId));
    chatHistoryManager.deleteChat(chatId);

    // If the deleted chat was active, switch to another one or create a new one
    if (activeChatId === chatId) {
      const remainingHistory = history.filter(c => c.id !== chatId);
      if (remainingHistory.length > 0) {
        switchChat(remainingHistory[0].id);
      } else {
        startNewChat();
      }
    }
  }, [activeChatId, history, startNewChat, switchChat]);

  return {
    messages: activeChat?.messages || [],
    history,
    activeChatId,
    isLoading,
    error,
    sendMessage,
    startNewChat,
    switchChat,
    deleteChat,
    isClientAvailable,
    modelSettings,
    updateModelSettings,
    reloadModelSettings,
  };
} 
