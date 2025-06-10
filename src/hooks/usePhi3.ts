import { useState, useEffect, useCallback } from 'react';
import phi3Client from '@/integrations/phi3/phi3Client';
import { Phi3Insights, defaultPhi3Insights } from '@/integrations/phi3/phi3Config';

interface UsePhi3Return {
  isLoaded: boolean;
  isLoading: boolean;
  loadError: string | null;
  insights: Phi3Insights;
  processTranscript: (transcript: string) => Promise<Phi3Insights>;
  processIncrementalUpdate: (newSentence: string, recentHistory?: string[]) => Promise<void>;
  initialize: () => Promise<{ success: boolean; error?: string }>;
}

const HISTORY_LENGTH = 5; // Keep the last 5 sentences for context

export function usePhi3(): UsePhi3Return {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [insights, setInsights] = useState<Phi3Insights>(defaultPhi3Insights);
  const [recentSentences, setRecentSentences] = useState<string[]>([]);

  // Initialize the model
  const initialize = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const result = await phi3Client.initialize();
      
      if (result.success) {
        setIsLoaded(true);
        setLoadError(null);
      } else {
        setLoadError(result.error || 'Unknown error initializing Phi-3');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setLoadError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update status from client when component mounts
  useEffect(() => {
    const status = phi3Client.getStatus();
    setIsLoaded(status.isLoaded);
    setIsLoading(status.isLoading);
    setLoadError(status.error);
  }, []);

  // Process full transcript
  const processTranscript = useCallback(async (transcript: string): Promise<Phi3Insights> => {
    if (!isLoaded) {
      console.warn('Phi-3 model is not loaded, cannot process transcript');
      return defaultPhi3Insights;
    }
    
    try {
      const newInsights = await phi3Client.processTranscript(transcript);
      setInsights(newInsights);
      return newInsights;
    } catch (error) {
      console.error('Error processing transcript with Phi-3:', error);
      return insights;
    }
  }, [isLoaded, insights]);

  // Process incremental updates (sentence by sentence)
  const processIncrementalUpdate = useCallback(async (
    newSentence: string,
    providedHistory?: string[]
  ): Promise<void> => {
    if (!isLoaded || !newSentence.trim()) {
      return;
    }
    
    try {
      // Use provided history or recent sentences from state
      const history = providedHistory || recentSentences;
      
      // Process the update
      const updatedInsights = await phi3Client.processIncrementalUpdate(
        newSentence, 
        insights,
        history
      );
      
      // Update recent sentences for next time
      const updatedSentences = [...history, newSentence].slice(-HISTORY_LENGTH);
      
      // Update state
      setInsights(updatedInsights);
      setRecentSentences(updatedSentences);
    } catch (error) {
      console.error('Error processing incremental update with Phi-3:', error);
    }
  }, [isLoaded, insights, recentSentences]);

  return {
    isLoaded,
    isLoading,
    loadError,
    insights,
    processTranscript,
    processIncrementalUpdate,
    initialize
  };
} 