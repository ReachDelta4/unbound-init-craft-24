
import React from 'react';
import { Button } from '@/components/ui/button';
import { usePhi3Context } from '@/contexts/Phi3Context';

const Phi3TestButton: React.FC = () => {
  const { isLoaded, processTranscript } = usePhi3Context();

  const handleTest = async () => {
    const sampleTranscript = "Client: I'm really interested in this solution, but I'm concerned about the price. It seems expensive compared to our current setup. Agent: I understand your concern about pricing. Let me show you the ROI calculations. Client: That would be helpful. I'm also worried about implementation time.";
    
    console.log('Testing Phi-3 with sample transcript...');
    try {
      const results = await processTranscript(sampleTranscript);
      console.log('Test results:', results);
    } catch (error) {
      console.error('Test failed:', error);
    }
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <Button 
      onClick={handleTest}
      variant="outline"
      size="sm"
      className="absolute top-4 right-4 z-20"
    >
      Test AI
    </Button>
  );
};

export default Phi3TestButton;
