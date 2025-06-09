import React, { useEffect } from 'react';
import { usePhi3Context } from '@/contexts/Phi3Context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface Phi3InsightsProps {
  liveTranscript?: string;
  fullTranscript?: string;
}

const Phi3Insights: React.FC<Phi3InsightsProps> = ({ 
  liveTranscript,
  fullTranscript
}) => {
  const {
    isLoading,
    error,
    lastResponse,
    lastSummary,
    queueLength,
    isProcessing,
    isInitialized,
    processTranscriptSegment
  } = usePhi3Context();

  // Process new transcript segments when they arrive
  useEffect(() => {
    if (isInitialized && liveTranscript && liveTranscript.trim()) {
      processTranscriptSegment(liveTranscript);
    }
  }, [liveTranscript, processTranscriptSegment, isInitialized]);

  if (!isInitialized) {
    return (
      <Card className="h-full overflow-hidden flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Phi-3 Insights</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto pb-6">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Phi-3 model is not initialized. Please reload the page or try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full overflow-hidden flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Phi-3 Insights</CardTitle>
          <div className="flex gap-2">
            {isLoading && (
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                Processing
              </Badge>
            )}
            {queueLength > 0 && (
              <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                Queue: {queueLength}
              </Badge>
            )}
            {!isLoading && !isProcessing && queueLength === 0 && (
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                Ready
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto pb-6">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Error: {error.message}
            </AlertDescription>
          </Alert>
        )}

        {isLoading && !lastResponse && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        )}

        {lastResponse && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-1">Key Insights</h3>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                {lastResponse}
              </div>
            </div>
            
            {lastSummary && (
              <div>
                <h3 className="text-sm font-medium mb-1">Summary</h3>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {lastSummary}
                </div>
              </div>
            )}
          </div>
        )}

        {!isLoading && !lastResponse && !error && (
          <div className="text-sm text-muted-foreground">
            Waiting for transcript data to analyze...
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Phi3Insights; 