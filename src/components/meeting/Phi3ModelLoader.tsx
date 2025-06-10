import React, { useState, useEffect } from 'react';
import { usePhi3Context } from '@/contexts/Phi3Context';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface Phi3ModelLoaderProps {
  onLoad?: () => void;
  hideWhenLoaded?: boolean;
}

const Phi3ModelLoader: React.FC<Phi3ModelLoaderProps> = ({
  onLoad,
  hideWhenLoaded = false,
}) => {
  const { isLoaded, isLoading, loadError, initialize } = usePhi3Context();
  const [isInitiating, setIsInitiating] = useState(false);

  // Auto-load the model when component mounts
  useEffect(() => {
    const loadModel = async () => {
      if (!isLoaded && !isLoading && !isInitiating) {
        setIsInitiating(true);
        try {
          console.log('Phi3ModelLoader: Auto-initializing model...');
          const result = await initialize();
          if (result.success && onLoad) {
            onLoad();
          }
        } finally {
          setIsInitiating(false);
        }
      }
    };
    
    loadModel();
  }, [isLoaded, isLoading, isInitiating, initialize, onLoad]);

  // Don't display if model is loaded and we want to hide
  if (isLoaded && hideWhenLoaded) {
    return null;
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
      <div className="flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Phi-3 Mini AI Model</h3>
          <div className="flex items-center space-x-2">
            {isLoaded ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-500">Loaded</span>
              </>
            ) : isLoading || isInitiating ? (
              <>
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
                <span className="text-sm">Loading...</span>
              </>
            ) : loadError ? (
              <>
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive">Error</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 bg-muted-foreground/60 rounded-full" />
                <span className="text-sm text-muted-foreground">Not loaded</span>
              </>
            )}
          </div>
        </div>

        {!isLoaded && !isLoading && !isInitiating && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              The Phi-3 Mini AI model is being loaded to analyze meeting transcripts.
              This may take a few moments and requires around 2GB of memory.
            </p>
          </div>
        )}

        {isLoaded && (
          <p className="text-sm text-muted-foreground">
            The Phi-3 Mini AI model is loaded and ready to analyze your meeting transcripts.
          </p>
        )}

        {loadError && (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md">
            <p className="text-sm text-destructive">{loadError}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Phi3ModelLoader; 