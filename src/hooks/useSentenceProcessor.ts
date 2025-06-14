import { useCallback, useState, useEffect } from 'react';
import GeminiClient from '@/integrations/gemini/GeminiClient';

interface UseSentenceProcessorResult {
  processSentence: (sentence: string) => Promise<void>;
  isProcessing: boolean;
  lastProcessedSentence: string | null;
  lastResponse: string | null;
  error: string | null;
}

/**
 * Hook for processing transcribed sentences with Gemini
 * 
 * This hook sends newly completed transcription sentences to the Gemini LLM
 * and logs the results, without displaying them in the chat interface.
 */
export function useSentenceProcessor(): UseSentenceProcessorResult {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastProcessedSentence, setLastProcessedSentence] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if GeminiClient is properly initialized when the hook mounts
  useEffect(() => {
    console.log('SentenceProcessor: Initializing with GeminiClient available:', !!GeminiClient);
    if (!GeminiClient) {
      console.error('SentenceProcessor: GeminiClient is not initialized properly');
      setError('GeminiClient is not initialized properly');
    }
  }, []);

  const processSentence = useCallback(async (sentence: string) => {
    console.log('SentenceProcessor: processSentence called with:', sentence);
    
    if (!sentence.trim()) {
      console.warn('SentenceProcessor: Empty sentence received, skipping');
      return;
    }
    
    if (!GeminiClient) {
      console.error('SentenceProcessor: Cannot process sentence - GeminiClient is not available');
      setError('GeminiClient is not available');
      return;
    }
    
    try {
      setIsProcessing(true);
      setError(null);
      setLastProcessedSentence(sentence);
      
      console.log('SentenceProcessor: Processing sentence with Gemini:', sentence);
      
      // Process with Gemini
      console.log('SentenceProcessor: Calling GeminiClient.sendMessage...');
      const response = await GeminiClient.sendMessage(sentence);
      
      // Log the result
      console.log('SentenceProcessor: Gemini response received:', response);
      setLastResponse(response);
      
      // Here you could add additional processing logic if needed
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error processing sentence';
      console.error('SentenceProcessor: Error processing sentence:', errorMessage);
      console.error('SentenceProcessor: Error details:', err);
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
      console.log('SentenceProcessor: Processing completed');
    }
  }, []);

  return {
    processSentence,
    isProcessing,
    lastProcessedSentence,
    lastResponse,
    error
  };
} 