
import { useState, useCallback } from 'react';

interface N8nHookReturn {
  sendWebhook: (data: any) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const useN8n = (): N8nHookReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendWebhook = useCallback(async (data: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Placeholder for N8n webhook functionality
      console.log('Sending data to N8n webhook:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send webhook');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    sendWebhook,
    isLoading,
    error
  };
};
