
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
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    const debug = `ScreenShareVideo Debug:
- hasStream: ${!!stream}
- isActive: ${isActive}
- streamId: ${stream?.id || 'none'}
- videoTracks: ${stream?.getVideoTracks().length || 0}
- audioTracks: ${stream?.getAudioTracks().length || 0}
- streamActive: ${stream?.active}
- videoTrackStates: ${stream?.getVideoTracks().map(t => `${t.label}:${t.readyState}:${t.enabled}`).join(', ') || 'none'}`;
    
    setDebugInfo(debug);
    console.log(debug);

    if (!stream || !isActive) {
      console.log('ScreenShareVideo: No stream or not active, clearing video');
      setIsLoaded(false);
      setError(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      return;
    }

    const video = videoRef.current;
    if (!video) {
      console.error('ScreenShareVideo: Video element not found');
      return;
    }

    const handleLoadedData = () => {
      console.log('ScreenShareVideo: Video loaded successfully');
      setIsLoaded(true);
      setError(null);
    };

    const handleError = (e: Event) => {
      console.error('ScreenShareVideo: Video loading error:', e);
      setError('Failed to load screen share');
      setIsLoaded(false);
    };

    const handleLoadStart = () => {
      console.log('ScreenShareVideo: Video load started');
      setError(null);
    };

    const handleCanPlay = () => {
      console.log('ScreenShareVideo: Video can play');
    };

    const handlePlaying = () => {
      console.log('ScreenShareVideo: Video is playing');
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('playing', handlePlaying);

    try {
      console.log('ScreenShareVideo: Setting srcObject to:', stream);
      video.srcObject = stream;
      
      // Force play attempt
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('ScreenShareVideo: Video play started successfully');
          })
          .catch(error => {
            console.error('ScreenShareVideo: Video play failed:', error);
            setError('Failed to play video stream');
          });
      }
    } catch (err) {
      console.error('ScreenShareVideo: Error setting stream:', err);
      setError('Failed to set video stream');
    }

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('playing', handlePlaying);
    };
  }, [stream, isActive]);

  // Show placeholder when not active or no stream
  if (!isActive || !stream) {
    return (
      <div className="w-full h-[400px] bg-muted/20 border-2 border-dashed border-muted-foreground/20 rounded-lg flex flex-col items-center justify-center">
        <Monitor className="w-16 h-16 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground/70 mb-2">Screen Share Preview</h3>
        <p className="text-sm text-muted-foreground/50">Start screen sharing to see content</p>
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 text-xs text-muted-foreground/40 font-mono whitespace-pre-line text-center">
            {debugInfo}
          </div>
        )}
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
          {process.env.NODE_ENV === 'development' && (
            <span className="text-xs text-muted-foreground ml-auto">
              {stream?.getVideoTracks().length || 0} video tracks
            </span>
          )}
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
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-2 text-xs text-white/50 font-mono whitespace-pre-line">
                  {debugInfo}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center">
              <Monitor className="w-12 h-12 text-red-400 mx-auto mb-2" />
              <p className="text-sm text-red-400">{error}</p>
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-2 text-xs text-red-300 font-mono whitespace-pre-line">
                  {debugInfo}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScreenShareVideo;
