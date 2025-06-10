
import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Monitor, VideoOff } from 'lucide-react';

interface ResizableScreenShareProps {
  stream: MediaStream | null;
  isActive: boolean;
}

const ResizableScreenShare = ({ stream, isActive }: ResizableScreenShareProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('ResizableScreenShare: stream changed', {
      hasStream: !!stream,
      isActive,
      videoTracks: stream?.getVideoTracks().length || 0,
      audioTracks: stream?.getAudioTracks().length || 0,
    });

    if (videoRef.current && stream && isActive) {
      try {
        videoRef.current.srcObject = stream;
        setError(null);
        
        // Add event listeners to track video loading
        const video = videoRef.current;
        
        const handleLoadedData = () => {
          console.log('Video loaded successfully');
          setIsVideoLoaded(true);
        };
        
        const handleLoadedMetadata = () => {
          console.log('Video metadata loaded');
        };
        
        const handleError = (e: Event) => {
          console.error('Video error:', e);
          setError('Failed to load video stream');
          setIsVideoLoaded(false);
        };
        
        video.addEventListener('loadeddata', handleLoadedData);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('error', handleError);
        
        return () => {
          video.removeEventListener('loadeddata', handleLoadedData);
          video.removeEventListener('loadedmetadata', handleLoadedMetadata);
          video.removeEventListener('error', handleError);
        };
      } catch (err) {
        console.error('Error setting video source:', err);
        setError('Failed to set video source');
        setIsVideoLoaded(false);
      }
    } else {
      setIsVideoLoaded(false);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream, isActive]);

  // Show placeholder when not active or no stream
  if (!isActive || !stream) {
    return (
      <Card className="w-full h-64 flex items-center justify-center bg-muted/30 border border-border">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Monitor className="h-12 w-12" />
          <p className="text-sm">Screen share preview will appear here</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full h-auto bg-background border border-border overflow-hidden">
      <div className="relative">
        {/* Header */}
        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded z-10">
          Screen Share Preview
        </div>
        
        {/* Video Element */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-auto min-h-[200px] max-h-[400px] object-contain bg-black"
          style={{ display: isVideoLoaded ? 'block' : 'none' }}
        />
        
        {/* Loading/Error States */}
        {!isVideoLoaded && !error && (
          <div className="w-full h-64 flex items-center justify-center bg-muted/30">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Monitor className="h-8 w-8 animate-pulse" />
              <p className="text-sm">Loading screen share...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="w-full h-64 flex items-center justify-center bg-destructive/10">
            <div className="flex flex-col items-center gap-3 text-destructive">
              <VideoOff className="h-8 w-8" />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ResizableScreenShare;
