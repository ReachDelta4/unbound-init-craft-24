import React, { useState, useEffect } from 'react';

const DebugInfo: React.FC = () => {
  const [errors, setErrors] = useState<string[]>([]);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  
  useEffect(() => {
    // Capture console errors
    const originalConsoleError = console.error;
    const originalConsoleLog = console.log;
    
    console.error = (...args: any[]) => {
      const errorMessage = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      
      setErrors(prev => [...prev, errorMessage].slice(-10)); // Keep last 10 errors
      originalConsoleError.apply(console, args);
    };
    
    console.log = (...args: any[]) => {
      const logMessage = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      
      setConsoleOutput(prev => [...prev, logMessage].slice(-10)); // Keep last 10 logs
      originalConsoleLog.apply(console, args);
    };
    
    // Capture unhandled errors
    const handleError = (event: ErrorEvent) => {
      setErrors(prev => [...prev, `Unhandled Error: ${event.message} at ${event.filename}:${event.lineno}`].slice(-10));
    };
    
    window.addEventListener('error', handleError);
    
    return () => {
      console.error = originalConsoleError;
      console.log = originalConsoleLog;
      window.removeEventListener('error', handleError);
    };
  }, []);
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      left: '10px',
      zIndex: 9999,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      maxWidth: '80vw',
      maxHeight: '30vh',
      overflow: 'auto',
      fontSize: '12px',
      fontFamily: 'monospace'
    }}>
      <h3 style={{ margin: '0 0 5px 0', color: '#ff6b6b' }}>Debug Info</h3>
      
      {errors.length > 0 && (
        <div>
          <h4 style={{ margin: '5px 0', color: '#ff6b6b' }}>Errors:</h4>
          <ul style={{ margin: '0', padding: '0 0 0 20px' }}>
            {errors.map((error, index) => (
              <li key={index} style={{ marginBottom: '3px' }}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      
      {consoleOutput.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          <h4 style={{ margin: '5px 0', color: '#4ecdc4' }}>Console Output:</h4>
          <ul style={{ margin: '0', padding: '0 0 0 20px' }}>
            {consoleOutput.map((log, index) => (
              <li key={index} style={{ marginBottom: '3px' }}>{log}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DebugInfo; 