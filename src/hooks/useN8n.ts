import { useState, useEffect } from 'react';
import { getN8nStatus, executeWorkflow } from '../integrations/n8n';

interface UseN8nResult {
  isRunning: boolean;
  n8nUrl: string | null;
  executeWorkflow: (workflowId: string, data: any) => Promise<any>;
  error: string | null;
  loading: boolean;
}

/**
 * React hook to interact with n8n
 * @returns Object with n8n status and methods
 */
export function useN8n(): UseN8nResult {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [n8nUrl, setN8nUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkN8nStatus = async () => {
      try {
        setLoading(true);
        const status = await getN8nStatus();
        setIsRunning(status.running);
        setN8nUrl(status.url);
        setError(null);
      } catch (err) {
        setError('Failed to connect to n8n');
        console.error('Error checking n8n status:', err);
      } finally {
        setLoading(false);
      }
    };

    checkN8nStatus();
    
    // Poll for status every 30 seconds
    const intervalId = setInterval(checkN8nStatus, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  const runWorkflow = async (workflowId: string, data: any) => {
    if (!isRunning) {
      throw new Error('n8n is not running');
    }
    
    try {
      return await executeWorkflow(workflowId, data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Workflow execution failed: ${errorMessage}`);
      throw err;
    }
  };

  return {
    isRunning,
    n8nUrl,
    executeWorkflow: runWorkflow,
    error,
    loading
  };
} 