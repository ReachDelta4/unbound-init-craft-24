import React from 'react';
import { useN8n } from '../../hooks/useN8n';

export function N8nStatus() {
  const { isRunning, n8nUrl, error, loading } = useN8n();

  if (loading) {
    return <div className="text-sm text-gray-500">Checking n8n status...</div>;
  }

  if (error) {
    return <div className="text-sm text-red-500">{error}</div>;
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500' : 'bg-red-500'}`} />
      <span className="text-sm">
        n8n: {isRunning ? 'Running' : 'Stopped'}
        {isRunning && n8nUrl && (
          <a 
            href={n8nUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="ml-2 text-blue-500 hover:underline"
          >
            Open UI
          </a>
        )}
      </span>
    </div>
  );
} 