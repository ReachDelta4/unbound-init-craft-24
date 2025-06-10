
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { useStreamValidation } from '@/hooks/useStreamValidation';
import { useVideoElement } from '@/hooks/useVideoElement';
import ScreenSharePlaceholder from './ScreenSharePlaceholder';
import ScreenShareLoadingState from './ScreenShareLoadingState';
import ScreenShareErrorState from './ScreenShareErrorState';
import ScreenShareVideoHeader from './ScreenShareVideoHeader';

interface ResizableScreenShareProps {
  stream: MediaStream | null;
  isActive: boolean;
}

const ResizableScreenShare = ({ stream, isActive }: ResizableScreenShareProps) => {
  const [error, setError] = useState<string | null>(null);
  
  const { validateStream, streamDetails, clearStreamDetails } = useStreamValidation();
  
  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };
  
  const handleLoadSuccess = () => {
    setError(null);
  };
  
  const { videoRef, isVideoLoaded, retryVideoLoad } = useVideoElement({
    stream,
    onError: handleError,
    onLoadSuccess: handleLoadSuccess
  });

  // Validate stream when it changes
  React.useEffect(() => {
    console.log('ResizableScreenShare: Props changed', {
      hasStream: !!stream,
      isActive,
      streamId: stream?.id
    });

    if (!stream) {
      setError(null);
      clearStreamDetails();
      return;
    }

    if (!validateStream(stream)) {
      setError('Invalid or inactive video stream');
      return;
    }
  }, [stream, isActive, validateStream, clearStreamDetails]);

  if (!stream) {
    return <ScreenSharePlaceholder />;
  }

  return (
    <Card className="w-full h-auto bg-background border border-border overflow-hidden">
      <div className="relative">
        <ScreenShareVideoHeader
          streamDetails={streamDetails}
          hasError={!!error}
          onRetry={retryVideoLoad}
        />
        
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-auto min-h-[200px] max-h-[400px] object-contain bg-black"
          style={{ display: isVideoLoaded ? 'block' : 'none' }}
        />
        
        {!isVideoLoaded && !error && (
          <ScreenShareLoadingState streamDetails={streamDetails} />
        )}
        
        {error && (
          <ScreenShareErrorState
            error={error}
            onRetry={retryVideoLoad}
            streamDetails={streamDetails}
          />
        )}
      </div>
    </Card>
  );
};

export default ResizableScreenShare;
