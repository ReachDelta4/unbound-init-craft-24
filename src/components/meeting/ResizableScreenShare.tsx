
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Monitor, VideoOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ResizableScreenShareProps {
  stream: MediaStream | null;
  isActive: boolean;
}

const ResizableScreenShare = ({ stream, isActive }: ResizableScreenShareProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamDetails, setStreamDetails] = useState<{
    hasVideo: boolean;
    hasAudio: boolean;
    videoTrackState: string;
    streamId: string;
  } | null>(null);

  // Enhanced stream validation
  const validateStream = useCallback((mediaStream: MediaStream | null) => {
    if (!mediaStream) {
      console.log('ResizableScreenShare: No stream provided');
      return false;
    }

    const videoTracks = mediaStream.getVideoTracks();
    const audioTracks = mediaStream.getAudioTracks();
    
    const details = {
      hasVideo: videoTracks.length > 0,
      hasAudio: audioTracks.length > 0,
      videoTrackState: videoTracks[0]?.readyState || 'no-track',
      streamId: mediaStream.id
    };
    
    setStreamDetails(details);
    
    console.log('ResizableScreenShare: Stream validation', {
      ...details,
      videoTrackEnabled: videoTracks[0]?.enabled,
      videoTrackLabel: videoTracks[0]?.label,
      totalTracks: mediaStream.getTracks().length
    });

    // Stream is valid if it has at least one video track that's live
    const isValid = details.hasVideo && details.videoTrackState === 'live';
    
    if (!isValid) {
      console.warn('ResizableScreenShare: Stream validation failed', details);
    }
    
    return isValid;
  }, []);

  // Retry loading the video
  const retryVideoLoad = useCallback(() => {
    if (videoRef.current && stream) {
      console.log('ResizableScreenShare: Retrying video load');
      setError(null);
      setIsVideoLoaded(false);
      
      // Force reload by setting srcObject to null first, then back to stream
      videoRef.current.srcObject = null;
      setTimeout(() => {
        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    }
  }, [stream]);

  useEffect(() => {
    console.log('ResizableScreenShare: Props changed', {
      hasStream: !!stream,
      isActive,
      streamId: stream?.id
    });

    if (!isActive || !stream) {
      setIsVideoLoaded(false);
      setError(null);
      setStreamDetails(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      return;
    }

    // Validate the stream first
    if (!validateStream(stream)) {
      setError('Invalid or inactive video stream');
      setIsVideoLoaded(false);
      return;
    }

    const video = videoRef.current;
    if (!video) {
      console.error('ResizableScreenShare: Video element not found');
      return;
    }

    try {
      // Set up event listeners first
      const handleLoadedData = () => {
        console.log('ResizableScreenShare: Video loaded successfully');
        setIsVideoLoaded(true);
        setError(null);
      };
      
      const handleLoadedMetadata = () => {
        console.log('ResizableScreenShare: Video metadata loaded', {
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          duration: video.duration
        });
      };
      
      const handleCanPlay = () => {
        console.log('ResizableScreenShare: Video can play');
        video.play().catch(err => {
          console.warn('ResizableScreenShare: Auto-play failed:', err);
        });
      };
      
      const handleError = (e: Event) => {
        console.error('ResizableScreenShare: Video error:', e);
        setError('Failed to load video stream');
        setIsVideoLoaded(false);
      };

      const handleLoadStart = () => {
        console.log('ResizableScreenShare: Video load started');
      };

      // Add all event listeners
      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('error', handleError);
      video.addEventListener('loadstart', handleLoadStart);
      
      // Set the stream
      video.srcObject = stream;
      
      return () => {
        // Clean up event listeners
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('error', handleError);
        video.removeEventListener('loadstart', handleLoadStart);
      };
    } catch (err) {
      console.error('ResizableScreenShare: Error setting up video:', err);
      setError('Failed to set up video element');
      setIsVideoLoaded(false);
    }
  }, [stream, isActive, validateStream]);

  // Show placeholder when not active or no stream
  if (!isActive || !stream) {
    return (
      <Card className="w-full h-64 flex items-center justify-center bg-muted/30 border border-border">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Monitor className="h-12 w-12" />
          <p className="text-sm">Screen share preview will appear here</p>
          {!isActive && <p className="text-xs">Call not active</p>}
          {isActive && !stream && <p className="text-xs">No stream available</p>}
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full h-auto bg-background border border-border overflow-hidden">
      <div className="relative">
        {/* Header with debug info */}
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
        
        {/* Retry button when there's an error */}
        {error && (
          <div className="absolute top-2 right-2 z-10">
            <Button
              size="sm"
              variant="outline"
              onClick={retryVideoLoad}
              className="h-8 px-2 bg-black/70 border-white/20 text-white hover:bg-black/90"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        )}
        
        {/* Video Element */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-auto min-h-[200px] max-h-[400px] object-contain bg-black"
          style={{ display: isVideoLoaded ? 'block' : 'none' }}
        />
        
        {/* Loading State */}
        {!isVideoLoaded && !error && (
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
        )}
        
        {/* Error State */}
        {error && (
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
                onClick={retryVideoLoad}
                className="mt-2"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ResizableScreenShare;
