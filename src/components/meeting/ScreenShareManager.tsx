import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { isScreenSharingSupported } from '@/lib/browser-detection';

interface ScreenShareManagerProps {
  onScreenShare: (stream: MediaStream | null) => void;
  isScreenSharing: boolean;
}

export default function ScreenShareManager({ onScreenShare, isScreenSharing }: ScreenShareManagerProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const stopScreenShare = useCallback(() => {
    onScreenShare(null);
  }, [onScreenShare]);

  const startScreenShare = useCallback(async () => {
    setLoading(true);
    try {
      // Standard browser screen sharing
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      
      if (stream) {
        // Add handler for when user stops sharing via browser UI
        stream.getVideoTracks()[0].onended = () => {
          stopScreenShare();
        };
        
        onScreenShare(stream);
      }
    } catch (error) {
      console.error('Failed to start screen sharing:', error);
      toast({
        title: 'Failed to start call',
        description: 'Screen sharing is not supported in this browser or permission was denied.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [onScreenShare, stopScreenShare, toast]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopScreenShare();
    };
  }, [stopScreenShare]);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={isScreenSharing ? stopScreenShare : startScreenShare}
      disabled={loading || !isScreenSharingSupported()}
    >
      {loading ? 'Starting...' : isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
    </Button>
  );
}
