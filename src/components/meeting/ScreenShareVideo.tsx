
import React, { useEffect, useRef, useState } from 'react';
import { Monitor, AlertCircle, Loader2 } from 'lucide-react';

interface ScreenShareVideoProps {
  stream: MediaStream | null;
  isActive: boolean;
}

const ScreenShareVideo = ({ stream, isActive }: ScreenShareVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log('ScreenShareVideo: Props changed:', {
      hasStream: !!stream,
      isActive,
      streamId: stream?.id,
      videoTracks: stream?.getVideoTracks().length || 0,
      audioTracks: stream?.getAudioTracks().length || 0,
      streamActive: stream?.active,
      videoTrackStates: stream?.getVideoTracks().map(t => `${t.label}:${t.readyState}:${t.enabled}`).join(', ') || 'none'
    });

    // Reset states when props change
    if (!stream || !isActive) {
      console.log('ScreenShareVideo: No stream or not active, clearing video');
      setIsLoaded(false);
      setError(null);
      setIsLoading(false);
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

    setIsLoading(true);
    setError(null);

    const handleLoadedData = () => {
      console.log('ScreenShareVideo: Video loaded successfully');
      setIsLoaded(true);
      setError(null);
      setIsLoading(false);
    };

    const handleError = (e: Event) => {
      console.error('ScreenShareVideo: Video loading error:', e);
      setError('Failed to load screen share video');
      setIsLoaded(false);
      setIsLoading(false);
    };

    const handleLoadStart = () => {
      console.log('ScreenShareVideo: Video load started');
      setIsLoading(true);
      setError(null);
    };

    const handleCanPlay = () => {
      console.log('ScreenShareVideo: Video can play');
      setIsLoading(false);
    };

    const handlePlaying = () => {
      console.log('ScreenShareVideo: Video is playing');
      setIsLoaded(true);
      setIsLoading(false);
    };

    const handleWaiting = () => {
      console.log('ScreenShareVideo: Video is waiting for data');
      setIsLoading(true);
    };

    // Add event listeners
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('waiting', handleWaiting);

    try {
      console.log('ScreenShareVideo: Setting srcObject to stream:', stream.id);
      video.srcObject = stream;
      
      // Attempt to play the video
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('ScreenShareVideo: Video play started successfully');
          })
          .catch(error => {
            console.error('ScreenShareVideo: Video play failed:', error);
            setError('Failed to play video stream');
            setIsLoading(false);
          });
      }
    } catch (err) {
      console.error('ScreenShareVideo: Error setting stream:', err);
      setError('Failed to set video stream');
      setIsLoading(false);
    }

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('waiting', handleWaiting);
    };
  }, [stream, isActive]);

  // Show placeholder when not active or no stream
  if (!isActive || !stream) {
    return (
      <div className="w-full h-[400px] bg-muted/20 border-2 border-dashed border-muted-foreground/20 rounded-lg flex flex-col items-center justify-center">
        <Monitor className="w-16 h-16 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground/70 mb-2">Screen Share Preview</h3>
        <p className="text-sm text-muted-foreground/50">Start a call to see screen share content</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-black rounded-lg overflow-hidden border border-border">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-sm border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          {isLoading ? (
            <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
          ) : isLoaded ? (
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          ) : error ? (
            <AlertCircle className="w-3 h-3 text-red-500" />
          ) : (
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          )}
          
          <span className="text-sm font-medium">
            {isLoading ? 'Loading Screen Share...' : 
             isLoaded ? 'Screen Share Active' :
             error ? 'Screen Share Error' :
             'Screen Share Preview'}
          </span>
          
          {process.env.NODE_ENV === 'development' && (
            <span className="text-xs text-muted-foreground ml-auto">
              Stream: {stream?.id?.slice(0, 8)}... | 
              Video: {stream?.getVideoTracks().length || 0} |
              Audio: {stream?.getAudioTracks().length || 0}
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
            isLoaded && !isLoading ? 'block' : 'hidden'
          }`}
        />

        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
              <p className="text-sm text-white/70">Loading screen share...</p>
              <p className="text-xs text-white/50 mt-1">Setting up video stream</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-2" />
              <p className="text-sm text-red-400 mb-2">{error}</p>
              <p className="text-xs text-red-300">Check console for more details</p>
            </div>
          </div>
        )}

        {/* Initial State (has stream but not loaded yet) */}
        {!isLoaded && !isLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center">
              <Monitor className="w-12 h-12 text-blue-400 mx-auto mb-2" />
              <p className="text-sm text-blue-400">Preparing screen share...</p>
              <p className="text-xs text-blue-300 mt-1">Stream ready, loading video</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScreenShareVideo;
