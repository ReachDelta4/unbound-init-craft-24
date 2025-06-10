
import React from 'react';
import { VideoOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScreenShareErrorStateProps {
  error: string;
  onRetry: () => void;
  streamDetails: {
    videoTrackState: string;
    hasVideo: boolean;
    hasAudio: boolean;
  } | null;
}

const ScreenShareErrorState = ({ error, onRetry, streamDetails }: ScreenShareErrorStateProps) => {
  return (
    <div className="w-full h-64 flex items-center justify-center bg-destructive/10">
      <div className="flex flex-col items-center gap-3 text-destructive">
        <VideoOff className="h-8 w-8" />
        <p className="text-sm text-center">{error}</p>
        {streamDetails && (
          <p className="text-xs opacity-75 text-center">
            Debug: {streamDetails.videoTrackState} | 
            Video: {streamDetails.hasVideo ? 'Yes' : 'No'} | 
            Audio: {streamDetails.hasAudio ? 'Yes' : 'No'}
          </p>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={onRetry}
          className="mt-2"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
      </div>
    </div>
  );
};

export default ScreenShareErrorState;
