
import { useEffect, useRef, useState, useCallback } from 'react';

interface UseVideoElementProps {
  stream: MediaStream | null;
  onError: (error: string) => void;
  onLoadSuccess: () => void;
}

export const useVideoElement = ({ stream, onError, onLoadSuccess }: UseVideoElementProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  const retryVideoLoad = useCallback(() => {
    if (videoRef.current && stream) {
      console.log('useVideoElement: Retrying video load');
      onError('');
      setIsVideoLoaded(false);
      
      videoRef.current.srcObject = null;
      setTimeout(() => {
        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    }
  }, [stream, onError]);

  useEffect(() => {
    console.log('useVideoElement: Stream changed', {
      hasStream: !!stream,
      streamId: stream?.id
    });

    if (!stream) {
      setIsVideoLoaded(false);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      return;
    }

    const video = videoRef.current;
    if (!video) {
      console.error('useVideoElement: Video element not found');
      return;
    }

    try {
      const handleLoadedData = () => {
        console.log('useVideoElement: Video loaded successfully');
        setIsVideoLoaded(true);
        onLoadSuccess();
      };
      
      const handleLoadedMetadata = () => {
        console.log('useVideoElement: Video metadata loaded', {
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          duration: video.duration
        });
      };
      
      const handleCanPlay = () => {
        console.log('useVideoElement: Video can play');
        video.play().catch(err => {
          console.warn('useVideoElement: Auto-play failed:', err);
        });
      };
      
      const handleError = (e: Event) => {
        console.error('useVideoElement: Video error:', e);
        onError('Failed to load video stream');
        setIsVideoLoaded(false);
      };

      const handleLoadStart = () => {
        console.log('useVideoElement: Video load started');
      };

      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('error', handleError);
      video.addEventListener('loadstart', handleLoadStart);
      
      video.srcObject = stream;
      
      return () => {
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('error', handleError);
        video.removeEventListener('loadstart', handleLoadStart);
      };
    } catch (err) {
      console.error('useVideoElement: Error setting up video:', err);
      onError('Failed to set up video element');
      setIsVideoLoaded(false);
    }
  }, [stream, onError, onLoadSuccess]);

  return {
    videoRef,
    isVideoLoaded,
    retryVideoLoad
  };
};
