import React, { createContext, useContext, ReactNode, useState } from 'react';
import { usePhi3 } from '@/hooks/usePhi3';

interface Phi3ContextType {
  isLoading: boolean;
  error: Error | null;
  lastResponse: string | null;
  lastSummary: string | null;
  transcriptHistory: string;
  queueLength: number;
  isProcessing: boolean;
  isInitialized: boolean;
  processTranscriptSegment: (newSegment: string) => void;
  generateResponse: (prompt: string, systemPrompt?: string) => Promise<string>;
  resetTranscriptHistory: () => void;
}

// Create a default context value for better type safety
const defaultContextValue: Phi3ContextType = {
  isLoading: false,
  error: null,
  lastResponse: null,
  lastSummary: null,
  transcriptHistory: '',
  queueLength: 0,
  isProcessing: false,
  isInitialized: false,
  processTranscriptSegment: () => {},
  generateResponse: async () => '',
  resetTranscriptHistory: () => {},
};

const Phi3Context = createContext<Phi3ContextType>(defaultContextValue);

export const usePhi3Context = () => {
  const context = useContext(Phi3Context);
  return context;
};

interface Phi3ProviderProps {
  children: ReactNode;
}

export const Phi3Provider: React.FC<Phi3ProviderProps> = ({ children }) => {
  // Use a simpler implementation for debugging
  const [isInitialized] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error] = useState<Error | null>(null);
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [lastSummary, setLastSummary] = useState<string | null>(null);
  
  const processTranscriptSegment = (newSegment: string) => {
    console.log('Processing transcript segment:', newSegment);
    setIsLoading(true);
    
    // Simulate processing
    setTimeout(() => {
      setLastResponse('This is a simulated response for debugging purposes.');
      setLastSummary('This is a simulated summary for debugging purposes.');
      setIsLoading(false);
    }, 1000);
  };
  
  const generateResponse = async () => {
    return 'This is a simulated response for debugging purposes.';
  };
  
  const resetTranscriptHistory = () => {
    setLastResponse(null);
    setLastSummary(null);
  };
  
  const contextValue: Phi3ContextType = {
    isLoading,
    error,
    lastResponse,
    lastSummary,
    transcriptHistory: '',
    queueLength: 0,
    isProcessing: false,
    isInitialized,
    processTranscriptSegment,
    generateResponse,
    resetTranscriptHistory,
  };

  return (
    <Phi3Context.Provider value={contextValue}>
      {children}
    </Phi3Context.Provider>
  );
}; 