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

export function Phi3Provider({ children, autoInitialize = false, callActive = false }: { 
  children: ReactNode;
  autoInitialize?: boolean;
  callActive?: boolean;
}) {
  const phi3 = usePhi3();
  const [initAttempted, setInitAttempted] = useState(false);

  // Auto-initialize if requested or when call becomes active
  useEffect(() => {
    if ((autoInitialize || callActive) && !initAttempted && !phi3.isLoaded && !phi3.isLoading) {
      console.log('Phi3Provider: Auto-initializing model...');
      phi3.initialize().then(result => {
        console.log('Phi3Provider: Auto-initialization result:', result);
      });
      setInitAttempted(true);
    }
  }, [autoInitialize, callActive, initAttempted, phi3.isLoaded, phi3.isLoading, phi3.initialize]);

  // Log status changes
  useEffect(() => {
    console.log('Phi3Provider: Status update:', {
      isLoaded: phi3.isLoaded,
      isLoading: phi3.isLoading,
      loadError: phi3.loadError
    });
  }, [phi3.isLoaded, phi3.isLoading, phi3.loadError]);

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
