// Import only what we need and handle potential browser compatibility issues
import { env } from '@xenova/transformers';
import { 
  MODEL_ID, 
  ENV_CONFIG, 
  DEFAULT_GENERATION_PARAMS, 
  SYSTEM_PROMPTS 
} from './phi3Config';

// Configure the environment
env.allowLocalModels = ENV_CONFIG.allowLocalModels;
if (env.backends && env.backends.onnx && env.backends.onnx.wasm) {
  env.backends.onnx.wasm.numThreads = ENV_CONFIG.numThreads;
}

// Interface for the chat message format
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

class Phi3Client {
  private model: any = null;
  private isModelLoading: boolean = false;
  private modelLoadingPromise: Promise<void> | null = null;

  constructor() {
    // Don't initialize the model immediately to avoid errors on initial load
  }

  /**
   * Loads the Phi-3 model
   */
  private async loadModel(): Promise<void> {
    if (this.model) return;
    
    if (this.isModelLoading) {
      return this.modelLoadingPromise;
    }
    
    this.isModelLoading = true;
    
    this.modelLoadingPromise = new Promise<void>(async (resolve, reject) => {
      try {
        console.log('Loading Phi-3 model...');
        
        // Dynamically import the pipeline to avoid issues during SSR or initial load
        const { pipeline } = await import('@xenova/transformers');
        
        this.model = await pipeline('text-generation', MODEL_ID, {
          quantized: ENV_CONFIG.quantized,
        });
        
        console.log('Phi-3 model loaded successfully');
        this.isModelLoading = false;
        resolve();
      } catch (error) {
        console.error('Failed to load Phi-3 model:', error);
        this.isModelLoading = false;
        reject(error);
      }
    });
    
    return this.modelLoadingPromise;
  }

  /**
   * Ensures the model is loaded before performing inference
   */
  private async ensureModelLoaded(): Promise<void> {
    if (!this.model) {
      await this.loadModel();
    }
  }

  /**
   * Processes text incrementally with the Phi-3 model
   * @param messages Array of chat messages
   * @param options Generation options
   * @returns Generated text
   */
  async processIncrementalText(
    messages: ChatMessage[],
    options: {
      maxNewTokens?: number;
      temperature?: number;
      topK?: number;
      topP?: number;
    } = {}
  ): Promise<string> {
    await this.ensureModelLoaded();
    
    const formattedPrompt = this.formatMessages(messages);
    
    const result = await this.model(formattedPrompt, {
      max_new_tokens: options.maxNewTokens || DEFAULT_GENERATION_PARAMS.maxNewTokens,
      temperature: options.temperature || DEFAULT_GENERATION_PARAMS.temperature,
      top_k: options.topK || DEFAULT_GENERATION_PARAMS.topK,
      top_p: options.topP || DEFAULT_GENERATION_PARAMS.topP,
      do_sample: DEFAULT_GENERATION_PARAMS.doSample,
    });
    
    // Extract the generated text, removing the input prompt
    const generatedText = result[0].generated_text.slice(formattedPrompt.length).trim();
    return generatedText;
  }

  /**
   * Formats messages into the prompt format expected by Phi-3
   * @param messages Array of chat messages
   * @returns Formatted prompt string
   */
  private formatMessages(messages: ChatMessage[]): string {
    let formattedPrompt = '';
    
    for (const message of messages) {
      switch (message.role) {
        case 'system':
          formattedPrompt += `<|system|>\n${message.content}<|end|>\n`;
          break;
        case 'user':
          formattedPrompt += `<|user|>\n${message.content}<|end|>\n`;
          break;
        case 'assistant':
          formattedPrompt += `<|assistant|>\n${message.content}<|end|>\n`;
          break;
      }
    }
    
    // Add the assistant prefix for the response
    formattedPrompt += `<|assistant|>\n`;
    
    return formattedPrompt;
  }

  /**
   * Process a transcript and generate insights
   * @param transcript The meeting transcript to analyze
   * @returns Generated insights
   */
  async processTranscript(transcript: string): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: SYSTEM_PROMPTS.transcriptAnalysis
      },
      {
        role: 'user',
        content: `Please analyze this meeting transcript and provide key insights:\n\n${transcript}`
      }
    ];
    
    return this.processIncrementalText(messages, {
      maxNewTokens: 512,
      temperature: 0.7
    });
  }
  
  /**
   * Process a transcript history incrementally
   * @param previousTranscript Previous transcript content
   * @param newTranscriptSegment New transcript segment to analyze
   * @param previousSummary Previous summary (if available)
   * @returns Updated insights and summary
   */
  async processIncrementalTranscript(
    previousTranscript: string,
    newTranscriptSegment: string,
    previousSummary: string = ''
  ): Promise<{
    insights: string;
    summary: string;
  }> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: SYSTEM_PROMPTS.incrementalAnalysis
      },
      {
        role: 'user',
        content: `
Previous transcript summary: ${previousSummary || 'No previous summary available.'}

Previous transcript: ${previousTranscript || 'No previous transcript available.'}

New transcript segment: ${newTranscriptSegment}

Please provide:
1. Updated insights based on the new information
2. A concise summary of the entire conversation so far
`
      }
    ];
    
    const response = await this.processIncrementalText(messages, {
      maxNewTokens: 512,
      temperature: 0.7
    });
    
    // Extract insights and summary from the response
    const parts = response.split('\n\n');
    let insights = '';
    let summary = '';
    
    if (parts.length >= 2) {
      insights = parts[0].replace(/^(Updated insights|Insights):\s*/i, '').trim();
      summary = parts[1].replace(/^(Summary|Updated summary):\s*/i, '').trim();
    } else {
      insights = response;
      summary = previousSummary;
    }
    
    return { insights, summary };
  }
}

// Export a singleton instance
export const phi3Client = new Phi3Client(); 