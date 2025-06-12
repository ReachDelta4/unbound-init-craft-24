import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { isElectron } from '@/lib/browser-detection';

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
      let stream: MediaStream | null = null;
      
      // Use Electron's desktop capturer if in Electron environment
      if (isElectron()) {
        // In most recent Electron versions, navigator.mediaDevices.getDisplayMedia works
        // and shows the system picker dialog automatically.
        // Using it avoids extra IPC complexity and permission issues.
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        });
      } else {
        // Standard browser screen sharing
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        });
      }
      
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
        description: isElectron() 
          ? 'Screen sharing is not working in this Electron build. Please check permissions.'
          : 'Screen sharing is not supported in this browser.',
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
      disabled={loading}
    >
      {loading ? 'Starting...' : isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
    </Button>
  );
}
