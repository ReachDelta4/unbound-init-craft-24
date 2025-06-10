import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { usePhi3 } from '@/hooks/usePhi3';
import { Phi3Insights, defaultPhi3Insights } from '@/integrations/phi3/phi3Config';

interface Phi3ContextType {
  isLoaded: boolean;
  isLoading: boolean;
  loadError: string | null;
  insights: Phi3Insights;
  processTranscript: (transcript: string) => Promise<Phi3Insights>;
  processIncrementalUpdate: (newSentence: string, recentHistory?: string[]) => Promise<void>;
  initialize: () => Promise<{ success: boolean; error?: string }>;
}

const Phi3Context = createContext<Phi3ContextType | undefined>(undefined);

export function Phi3Provider({ children, autoInitialize = false }: { 
  children: ReactNode;
  autoInitialize?: boolean;
}) {
  const phi3 = usePhi3();
  const [initAttempted, setInitAttempted] = useState(false);

  // Auto-initialize if requested
  useEffect(() => {
    if (autoInitialize && !initAttempted && !phi3.isLoaded && !phi3.isLoading) {
      phi3.initialize();
      setInitAttempted(true);
    }
  }, [autoInitialize, initAttempted, phi3.isLoaded, phi3.isLoading, phi3.initialize]);

  return (
    <Phi3Context.Provider value={phi3}>
      {children}
    </Phi3Context.Provider>
  );
}

export function usePhi3Context(): Phi3ContextType {
  const context = useContext(Phi3Context);
  
  if (context === undefined) {
    throw new Error('usePhi3Context must be used within a Phi3Provider');
  }
  
  return context;
} 