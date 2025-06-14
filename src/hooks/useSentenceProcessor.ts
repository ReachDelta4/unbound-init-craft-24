import { useCallback, useState, useEffect, useRef } from 'react';
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
  
  // Store processed sentences to avoid duplicates
  const processedSentencesRef = useRef<Set<string>>(new Set());

  // Check if GeminiClient is properly initialized when the hook mounts
  useEffect(() => {
    console.log('SentenceProcessor: Initializing with GeminiClient available:', !!GeminiClient);
    if (!GeminiClient) {
      console.error('SentenceProcessor: GeminiClient is not initialized properly');
      setError('GeminiClient is not initialized properly');
    }
    
    // Clear processed sentences on unmount
    return () => {
      processedSentencesRef.current.clear();
    };
  }, []);
  
  // Normalize a sentence for comparison (trim and lowercase)
  const normalizeSentence = useCallback((sentence: string): string => {
    return sentence.trim().toLowerCase();
  }, []);
  
  // Check if a sentence is similar to one we've already processed
  const isSimilarToProcessed = useCallback((sentence: string): boolean => {
    const normalized = normalizeSentence(sentence);
    
    // Exact match check
    if (processedSentencesRef.current.has(normalized)) {
      console.log('SentenceProcessor: Exact duplicate detected:', sentence);
      return true;
    }
    
    // Check for high similarity with any processed sentence
    for (const processed of processedSentencesRef.current) {
      // If one is a substring of the other with high overlap
      if (processed.length > 5 && (
          normalized.includes(processed) || 
          processed.includes(normalized))) {
        console.log('SentenceProcessor: Similar sentence already processed:', {
          new: sentence,
          existing: processed
        });
        return true;
      }
    }
    
    return false;
  }, [normalizeSentence]);

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
    
    // Check for duplicates or similar sentences
    if (isSimilarToProcessed(sentence)) {
      console.log('SentenceProcessor: Skipping duplicate/similar sentence:', sentence);
      return;
    }
    
    try {
      setIsProcessing(true);
      setError(null);
      setLastProcessedSentence(sentence);
      
      // Add to processed set before API call to prevent race conditions
      const normalized = normalizeSentence(sentence);
      processedSentencesRef.current.add(normalized);
      
      // Limit the size of our processed set to avoid memory leaks
      if (processedSentencesRef.current.size > 100) {
        // Remove the oldest entries (convert to array, slice, then back to Set)
        const array = Array.from(processedSentencesRef.current);
        processedSentencesRef.current = new Set(array.slice(-50));
      }
      
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
  }, [isSimilarToProcessed, normalizeSentence]);

  return {
    processSentence,
    isProcessing,
    lastProcessedSentence,
    lastResponse,
    error
  };
} 