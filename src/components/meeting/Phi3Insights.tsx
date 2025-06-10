
import React, { useEffect } from 'react';
import { usePhi3Context } from '@/contexts/Phi3Context';
import Phi3ModelLoader from './Phi3ModelLoader';

interface Phi3InsightsProps {
  liveText: string;
  transcriptHistory: string[];
  onInsightsUpdated?: (insights: any) => void;
  className?: string;
}

const Phi3Insights: React.FC<Phi3InsightsProps> = ({
  liveText,
  transcriptHistory,
  onInsightsUpdated,
  className,
}) => {
  const { isLoaded, insights, processIncrementalUpdate } = usePhi3Context();

  // Process new sentences when they are added to the transcript history
  useEffect(() => {
    console.log('Phi3Insights: Effect triggered', {
      isLoaded,
      transcriptHistoryLength: transcriptHistory.length,
      lastSentence: transcriptHistory[transcriptHistory.length - 1]
    });

    if (isLoaded && transcriptHistory.length > 0) {
      const lastSentence = transcriptHistory[transcriptHistory.length - 1];
      
      // Use the rest of the history as context, limiting to recent sentences
      const recentHistory = transcriptHistory.slice(0, -1).slice(-5);
      
      console.log('Phi3Insights: Processing sentence:', lastSentence);
      
      // Process the new sentence
      processIncrementalUpdate(lastSentence, recentHistory);
    }
  }, [isLoaded, transcriptHistory, processIncrementalUpdate]);

  // Notify parent component when insights are updated
  useEffect(() => {
    console.log('Phi3Insights: Insights updated:', insights);
    if (onInsightsUpdated) {
      onInsightsUpdated(insights);
    }
  }, [insights, onInsightsUpdated]);

  return (
    <div className={className}>
      {/* If model is not loaded, show the loader */}
      {!isLoaded && <Phi3ModelLoader />}
      
      {/* No visible output in this component - it just processes the transcript 
          and updates the insights through the context */}
    </div>
  );
};

export default Phi3Insights;
