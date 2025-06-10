
import React from 'react';
import { Monitor } from 'lucide-react';

interface ScreenShareLoadingStateProps {
  streamDetails: {
    streamId: string;
    hasVideo: boolean;
    hasAudio: boolean;
  } | null;
}

const ScreenShareLoadingState = ({ streamDetails }: ScreenShareLoadingStateProps) => {
  return (
    <div className="w-full h-64 flex items-center justify-center bg-muted/30">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Monitor className="h-8 w-8 animate-pulse" />
        <p className="text-sm">Loading screen share...</p>
        {streamDetails && (
          <p className="text-xs opacity-75">
            Stream: {streamDetails.streamId.slice(0, 8)}...
            {streamDetails.hasVideo ? ' ✓Video' : ' ✗Video'}
            {streamDetails.hasAudio ? ' ✓Audio' : ' ✗Audio'}
          </p>
        )}
      </div>
    </div>
  );
};

export default ScreenShareLoadingState;
