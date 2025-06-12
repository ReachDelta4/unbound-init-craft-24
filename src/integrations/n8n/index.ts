/**
 * n8n Integration
 * Provides utilities for interacting with the n8n workflow automation tool
 */

interface N8nStatus {
  running: boolean;
  url: string;
}

/**
 * Check if n8n is running
 * @returns Promise with n8n status information
 */
export const getN8nStatus = async (): Promise<N8nStatus> => {
  if (window.electronAPI) {
    return await window.electronAPI.n8nStatus();
  }
  
  // Fallback for web environment - assume n8n is running on default port
  return {
    running: false, // We can't know for sure in web environment
    url: 'http://localhost:5678'
  };
};

/**
 * Get the n8n URL
 * @returns The URL where n8n is running
 */
export const getN8nUrl = async (): Promise<string> => {
  const status = await getN8nStatus();
  return status.url;
};

/**
 * Execute a workflow in n8n
 * @param workflowId The ID of the workflow to execute
 * @param data The data to pass to the workflow
 * @returns The workflow execution result
 */
export const executeWorkflow = async (workflowId: string, data: any): Promise<any> => {
  const url = await getN8nUrl();
  
  try {
    const response = await fetch(`${url}/webhook/${workflowId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`Error executing workflow: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to execute n8n workflow:', error);
    throw error;
  }
};

// Add type definitions for the Electron API
declare global {
  interface Window {
    electronAPI?: {
      n8nStatus: () => Promise<N8nStatus>;
      // Other Electron API methods
    };
  }
} 