import { ChatMessage } from './useGeminiChat';

export interface StoredChat {
  id: string;
  startTime: number;
  title: string;
  messages: ChatMessage[];
}

const HISTORY_KEY = 'unbound-ai-chat-history';

/**
 * Manages chat history in local storage.
 */
class ChatHistoryManager {
  /**
   * Retrieves the entire chat history from local storage.
   */
  public getHistory(): StoredChat[] {
    try {
      const storedHistory = localStorage.getItem(HISTORY_KEY);
      return storedHistory ? JSON.parse(storedHistory) : [];
    } catch (error) {
      console.error("Error reading chat history from local storage:", error);
      return [];
    }
  }

  /**
   * Saves a single chat session to the history.
   * If the chat already exists, it will be updated.
   */
  public saveChat(chat: StoredChat): void {
    try {
      const history = this.getHistory();
      const chatIndex = history.findIndex(c => c.id === chat.id);

      if (chatIndex > -1) {
        // Update existing chat
        history[chatIndex] = chat;
      } else {
        // Add new chat to the beginning of the list
        history.unshift(chat);
      }
      
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error("Error saving chat to local storage:", error);
    }
  }

  /**
   * Deletes a chat session from the history.
   */
  public deleteChat(chatId: string): void {
    try {
      const history = this.getHistory();
      const updatedHistory = history.filter(c => c.id !== chatId);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error("Error deleting chat from local storage:", error);
    }
  }

  /**
   * Clears the entire chat history from local storage.
   */
  public clearHistory(): void {
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch (error) {
      console.error("Error clearing chat history from local storage:", error);
    }
  }
}

export const chatHistoryManager = new ChatHistoryManager(); 