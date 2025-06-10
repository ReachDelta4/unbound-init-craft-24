
import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScreenShareVideoHeaderProps {
  streamDetails: {
    hasVideo: boolean;
    hasAudio: boolean;
    videoTrackState: string;
  } | null;
  hasError: boolean;
  onRetry: () => void;
}

const ScreenShareVideoHeader = ({ streamDetails, hasError, onRetry }: ScreenShareVideoHeaderProps) => {
  return (
    <>
      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded z-10 flex items-center gap-2">
        <span>Screen Share Preview</span>
        {streamDetails && (
          <span className="opacity-75">
            ({streamDetails.hasVideo ? 'V' : ''}
            {streamDetails.hasAudio ? 'A' : ''} 
            {streamDetails.videoTrackState})
          </span>
        )}
      </div>
      
      {hasError && (
        <div className="absolute top-2 right-2 z-10">
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            className="h-8 px-2 bg-black/70 border-white/20 text-white hover:bg-black/90"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      )}
    </>
  );
};

export default ScreenShareVideoHeader;
