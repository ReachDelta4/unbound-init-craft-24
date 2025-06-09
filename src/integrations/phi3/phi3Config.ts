/**
 * Configuration for the Phi-3 model
 */

// Model ID to use
export const MODEL_ID = 'microsoft/Phi-3-mini-128k-instruct';

// Environment configuration
export const ENV_CONFIG = {
  allowLocalModels: true,
  cacheModels: true,
  numThreads: 4, // Adjust based on available CPU cores
  quantized: true, // Use quantized model for better performance
};

// Default generation parameters
export const DEFAULT_GENERATION_PARAMS = {
  maxNewTokens: 256,
  temperature: 0.7,
  topK: 50,
  topP: 0.95,
  doSample: true,
};

// System prompts for different tasks
export const SYSTEM_PROMPTS = {
  default: 'You are a helpful AI assistant.',
  transcriptAnalysis: 'You are a helpful AI assistant that analyzes meeting transcripts and provides concise, valuable insights. Focus on key points, action items, and important decisions.',
  incrementalAnalysis: 'You are a helpful AI assistant that analyzes meeting transcripts incrementally. Update the insights based on new information while maintaining context from previous segments.',
};

// Model capabilities
export const MODEL_CAPABILITIES = {
  maxContextLength: 128000, // 128k context window
  streamingSupport: false, // Currently not supporting streaming with transformers.js
  incrementalProcessing: true, // Support for incremental processing
};

// Export default config
export const phi3Config = {
  modelId: MODEL_ID,
  env: ENV_CONFIG,
  generation: DEFAULT_GENERATION_PARAMS,
  systemPrompts: SYSTEM_PROMPTS,
  capabilities: MODEL_CAPABILITIES,
}; 