
import React, { useEffect, useRef, useState } from 'react';
import { Monitor } from 'lucide-react';

interface ScreenShareVideoProps {
  stream: MediaStream | null;
  isActive: boolean;
}

const ScreenShareVideo = ({ stream, isActive }: ScreenShareVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('ScreenShareVideo: Stream changed', {
      hasStream: !!stream,
      isActive,
      streamId: stream?.id
    });

    if (!stream || !isActive) {
      setIsLoaded(false);
      setError(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      console.log('ScreenShareVideo: Video loaded successfully');
      setIsLoaded(true);
      setError(null);
    };

    const handleError = () => {
      console.error('ScreenShareVideo: Video loading error');
      setError('Failed to load screen share');
      setIsLoaded(false);
    };

    const handleLoadStart = () => {
      console.log('ScreenShareVideo: Video load started');
      setError(null);
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);
    video.addEventListener('loadstart', handleLoadStart);

    try {
      video.srcObject = stream;
    } catch (err) {
      console.error('ScreenShareVideo: Error setting stream:', err);
      setError('Failed to set video stream');
    }

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadstart', handleLoadStart);
    };
  }, [stream, isActive]);

  if (!isActive || !stream) {
    return (
      <div className="w-full h-[400px] bg-muted/20 border-2 border-dashed border-muted-foreground/20 rounded-lg flex flex-col items-center justify-center">
        <Monitor className="w-16 h-16 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground/70 mb-2">Screen Share Preview</h3>
        <p className="text-sm text-muted-foreground/50">Start screen sharing to see content</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-black rounded-lg overflow-hidden border border-border">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-sm border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">Screen Share Preview</span>
        </div>
      </div>

      {/* Video Content */}
      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`w-full h-auto min-h-[300px] max-h-[500px] object-contain bg-black ${
            isLoaded ? 'block' : 'hidden'
          }`}
        />

        {/* Loading State */}
        {!isLoaded && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-white/70">Loading screen share...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center">
              <Monitor className="w-12 h-12 text-red-400 mx-auto mb-2" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScreenShareVideo;
