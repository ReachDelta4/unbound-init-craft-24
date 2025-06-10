import React from 'react';
import { Button } from '@/components/ui/button';
import { usePhi3Context } from '@/contexts/Phi3Context';

const Phi3TestButton: React.FC = () => {
  const { isLoaded, isLoading, loadError, processTranscript } = usePhi3Context();

  const handleTest = async () => {
    if (!isLoaded) {
      console.log('Model not loaded yet, please wait for it to finish loading');
      return;
    }

    const sampleTranscript = "Client: I'm really interested in this solution, but I'm concerned about the price. It seems expensive compared to our current setup.";
    
    console.log('Testing Phi-3 with sample transcript...');
    try {
      const results = await processTranscript(sampleTranscript);
      console.log('Test results:', results);
    } catch (error) {
      console.error('Test failed:', error);
    }
  };

  if (loadError) {
    return (
      <Button 
        onClick={() => window.location.reload()}
        variant="destructive"
        size="sm"
        className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border shadow-sm"
      >
        Error - Reload
      </Button>
    );
  }

  if (isLoading) {
    return (
      <Button 
        variant="outline"
        size="sm"
        className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border shadow-sm"
        disabled
      >
        Loading Model...
      </Button>
    );
  }

  return (
    <Button 
      onClick={handleTest}
      variant="outline"
      size="sm"
      className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border shadow-sm"
      disabled={!isLoaded}
    >
      {isLoaded ? 'Test AI' : 'AI Loading...'}
    </Button>
  );
};

export default Phi3TestButton;
