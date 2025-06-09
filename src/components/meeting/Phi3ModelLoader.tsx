import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { usePhi3Context } from '@/contexts/Phi3Context';

interface Phi3ModelLoaderProps {
  onLoadComplete?: () => void;
}

const Phi3ModelLoader: React.FC<Phi3ModelLoaderProps> = ({ onLoadComplete }) => {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [modelStatus, setModelStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  
  const { isInitialized, error } = usePhi3Context();

  useEffect(() => {
    let mounted = true;
    let progressInterval: NodeJS.Timeout | null = null;
    
    const loadModel = async () => {
      try {
        setLoading(true);
        setModelStatus('loading');
        
        // Start progress animation
        let currentProgress = 0;
        progressInterval = setInterval(() => {
          currentProgress += Math.random() * 3;
          if (currentProgress > 95) {
            currentProgress = 95;
            clearInterval(progressInterval!);
          }
          if (mounted) {
            setProgress(currentProgress);
          }
        }, 300);
        
        // Check for initialization status
        if (isInitialized) {
          // Model initialized successfully
          clearInterval(progressInterval!);
          
          if (mounted) {
            setProgress(100);
            setLoading(false);
            setModelStatus('ready');
            if (onLoadComplete) {
              onLoadComplete();
            }
          }
        } else if (error) {
          // Error during initialization
          clearInterval(progressInterval!);
          
          if (mounted) {
            setLoading(false);
            setModelStatus('error');
          }
        }
      } catch (err) {
        console.error('Failed to load Phi-3 model:', err);
        if (mounted) {
          setLoading(false);
          setModelStatus('error');
        }
      }
    };
    
    loadModel();
    
    return () => {
      mounted = false;
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [isInitialized, error, onLoadComplete]);

  const retryLoading = () => {
    setProgress(0);
    setLoading(true);
    setModelStatus('loading');
    
    // Force reload the page to retry loading the model
    window.location.reload();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Phi-3 Model</CardTitle>
        <CardDescription>
          {modelStatus === 'loading' && 'Loading the Phi-3 model for local inference...'}
          {modelStatus === 'ready' && 'Phi-3 model loaded successfully!'}
          {modelStatus === 'error' && 'Failed to load the Phi-3 model.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {modelStatus === 'loading' && (
          <>
            <Progress value={progress} className="h-2 mb-2" />
            <p className="text-sm text-muted-foreground">
              This may take a moment. The model is being downloaded and initialized...
            </p>
          </>
        )}
        
        {modelStatus === 'error' && (
          <div className="text-sm text-destructive">
            <p>Error: {error?.message || 'Unknown error'}</p>
            <p className="mt-2">
              This could be due to network issues or insufficient memory. Please try again.
            </p>
          </div>
        )}
        
        {modelStatus === 'ready' && (
          <p className="text-sm text-muted-foreground">
            The model is now ready to process meeting transcripts and provide insights.
          </p>
        )}
      </CardContent>
      
      {modelStatus === 'error' && (
        <CardFooter>
          <Button onClick={retryLoading} className="w-full">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Retry Loading
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default Phi3ModelLoader; 