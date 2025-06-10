
import React from 'react';
import { Button } from '@/components/ui/button';
import { usePhi3Context } from '@/contexts/Phi3Context';

const Phi3TestButton: React.FC = () => {
  const { isLoaded, processTranscript } = usePhi3Context();

  const handleTest = async () => {
    const sampleTranscript = "Client: I'm really interested in this solution, but I'm concerned about the price. It seems expensive compared to our current setup. This implementation looks challenging. Agent: I understand your concern about pricing. Let me show you the ROI calculations. Client: That would be helpful. I'm also worried about implementation time and whether my team can adopt this quickly.";
    
    console.log('Testing Phi-3 with sample transcript...');
    try {
      const results = await processTranscript(sampleTranscript);
      console.log('Test results:', results);
    } catch (error) {
      console.error('Test failed:', error);
    }
  };

  if (!isLoaded) {
    return (
      <Button 
        variant="outline"
        size="sm"
        className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border shadow-sm"
        disabled
      >
        Model Loading...
      </Button>
    );
  }

  return (
    <Button 
      onClick={handleTest}
      variant="outline"
      size="sm"
      className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border shadow-sm"
    >
      Test AI
    </Button>
  );
};

export default Phi3TestButton;
