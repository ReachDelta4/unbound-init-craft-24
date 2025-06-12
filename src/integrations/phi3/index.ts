/**
 * Phi-3 Integration Module
 * 
 * This module will provide integration with the Phi-3 model
 * using llama.cpp for local inference.
 */

export interface Phi3Config {
  modelPath: string;
  contextSize?: number;
  threads?: number;
  apiUrl?: string;
}

export interface LlamaStatus {
  running: boolean;
  url: string;
}

export class Phi3Client {
  private config: Phi3Config;
  private apiUrl: string;
  
  constructor(config: Phi3Config) {
    this.config = config;
    this.apiUrl = config.apiUrl || 'http://127.0.0.1:8080';
  }
  
  /**
   * Check if the llama.cpp server is running
   * @returns Promise with llama.cpp status information
   */
  async getStatus(): Promise<LlamaStatus> {
    if (window.electronAPI?.llamaStatus) {
      return await window.electronAPI.llamaStatus();
    }
    
    // Fallback for web environment - try to ping the server
    try {
      const response = await fetch(`${this.apiUrl}/health`, { 
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      return {
        running: response.ok,
        url: this.apiUrl
      };
    } catch (error) {
      console.error('Error checking llama.cpp server status:', error);
      return {
        running: false,
        url: this.apiUrl
      };
    }
  }
  
  /**
   * Initialize the client and verify connection to llama.cpp server
   */
  async initialize(): Promise<boolean> {
    console.log('Phi3Client: Initializing with config', this.config);
    const status = await this.getStatus();
    return status.running;
  }
  
  /**
   * Generate text using the Phi-3 model via llama.cpp server
   * @param prompt The prompt to generate text from
   * @param options Optional generation parameters
   * @returns The generated text response
   */
  async generateText(
    prompt: string, 
    options: {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      stop?: string[];
    } = {}
  ): Promise<string> {
    const status = await this.getStatus();
    
    if (!status.running) {
      throw new Error('llama.cpp server is not running');
    }
    
    try {
      const response = await fetch(`${status.url}/completion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          temperature: options.temperature ?? 0.7,
          n_predict: options.maxTokens ?? 256,
          top_p: options.topP ?? 0.9,
          stop: options.stop ?? [],
          stream: false
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.content || '';
    } catch (error) {
      console.error('Error generating text with Phi-3:', error);
      throw error;
    }
  }
}

// Add type definitions for the Electron API
declare global {
  interface Window {
    electronAPI?: {
      llamaStatus: () => Promise<LlamaStatus>;
      // Other Electron API methods
    };
  }
}

export default Phi3Client; 