import { useState, useCallback, useRef, useEffect } from 'react';
import { phi3Client, ChatMessage } from '@/integrations/phi3/phi3Client';

interface Phi3State {
  isLoading: boolean;
  error: Error | null;
  lastResponse: string | null;
  lastSummary: string | null;
  transcriptHistory: string;
  processingQueue: string[];
  isProcessing: boolean;
  isInitialized: boolean;
}

export function usePhi3() {
  const [state, setState] = useState<Phi3State>({
    isLoading: false,
    error: null,
    lastResponse: null,
    lastSummary: null,
    transcriptHistory: '',
    processingQueue: [],
    isProcessing: false,
    isInitialized: false,
  });
  
  // Use a ref to track the latest state without triggering rerenders
  const stateRef = useRef(state);
  stateRef.current = state;

  // Initialize the client safely
  useEffect(() => {
    let mounted = true;
    
    const initializeClient = async () => {
      try {
        // Just try to import the client to see if it works
        await import('@xenova/transformers');
        
        if (mounted) {
          setState(prev => ({
            ...prev,
            isInitialized: true
          }));
        }
      } catch (error) {
        console.error('Failed to initialize Phi-3 client:', error);
        if (mounted) {
          setState(prev => ({
            ...prev,
            error: error instanceof Error ? error : new Error('Failed to initialize Phi-3 client'),
            isInitialized: false
          }));
        }
      }
    };
    
    initializeClient();
    
    return () => {
      mounted = false;
    };
  }, []);

  /**
   * Process a new transcript segment incrementally
   */
  const processTranscriptSegment = useCallback(async (newSegment: string) => {
    if (!newSegment.trim() || !state.isInitialized) return;
    
    // Add to queue
    setState(prev => ({
      ...prev,
      processingQueue: [...prev.processingQueue, newSegment]
    }));
    
    // Process queue if not already processing
    processQueue();
  }, [state.isInitialized]);

  /**
   * Process the queue of transcript segments
   */
  const processQueue = useCallback(async () => {
    // If already processing or queue is empty, return
    if (stateRef.current.isProcessing || stateRef.current.processingQueue.length === 0) {
      return;
    }
    
    // Set processing flag
    setState(prev => ({
      ...prev,
      isProcessing: true
    }));
    
    try {
      // Get the next segment from the queue
      const currentSegment = stateRef.current.processingQueue[0];
      
      // Process the segment
      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null
      }));
      
      const result = await phi3Client.processIncrementalTranscript(
        stateRef.current.transcriptHistory,
        currentSegment,
        stateRef.current.lastSummary || ''
      );
      
      // Update state with results
      const updatedTranscriptHistory = stateRef.current.transcriptHistory 
        ? `${stateRef.current.transcriptHistory}\n\n${currentSegment}`
        : currentSegment;
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        lastResponse: result.insights,
        lastSummary: result.summary,
        transcriptHistory: updatedTranscriptHistory,
        processingQueue: prev.processingQueue.slice(1), // Remove processed segment
        error: null
      }));
      
    } catch (error) {
      console.error('Error processing transcript with Phi-3:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Unknown error processing transcript'),
        processingQueue: prev.processingQueue.slice(1) // Remove failed segment
      }));
    } finally {
      // Clear processing flag
      setState(prev => ({
        ...prev,
        isProcessing: false
      }));
      
      // Process next item in queue if any
      setTimeout(() => {
        if (stateRef.current.processingQueue.length > 0) {
          processQueue();
        }
      }, 0);
    }
  }, []);

  /**
   * Generate a response to a custom prompt
   */
  const generateResponse = useCallback(async (
    prompt: string,
    systemPrompt: string = 'You are a helpful AI assistant.'
  ) => {
    if (!state.isInitialized) {
      throw new Error('Phi-3 client is not initialized');
    }
    
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }));
    
    try {
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ];
      
      const response = await phi3Client.processIncrementalText(messages);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        lastResponse: response,
        error: null
      }));
      
      return response;
    } catch (error) {
      console.error('Error generating response with Phi-3:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Unknown error generating response')
      }));
      
      throw error;
    }
  }, [state.isInitialized]);

  /**
   * Reset the transcript history and state
   */
  const resetTranscriptHistory = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      lastResponse: null,
      lastSummary: null,
      transcriptHistory: '',
      processingQueue: [],
      isProcessing: false,
      isInitialized: state.isInitialized,
    });
  }, [state.isInitialized]);

  return {
    isLoading: state.isLoading,
    error: state.error,
    lastResponse: state.lastResponse,
    lastSummary: state.lastSummary,
    transcriptHistory: state.transcriptHistory,
    queueLength: state.processingQueue.length,
    isProcessing: state.isProcessing,
    isInitialized: state.isInitialized,
    processTranscriptSegment,
    generateResponse,
    resetTranscriptHistory
  };
} 