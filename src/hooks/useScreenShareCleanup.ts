
import { useCallback, useRef } from 'react';

export const useScreenShareCleanup = () => {
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const setupHealthCheck = useCallback((stream: MediaStream, onFailure: () => void, validateStream: (stream: MediaStream) => boolean) => {
    // Clear any existing interval
    if (cleanupIntervalRef.current) {
      clearInterval(cleanupIntervalRef.current);
    }

    // Monitor stream health
    const healthCheckInterval = setInterval(() => {
      if (stream && !validateStream(stream)) {
        console.warn("ScreenShareCleanup: Stream health check failed, stopping");
        clearInterval(healthCheckInterval);
        onFailure();
      }
    }, 5000);

    cleanupIntervalRef.current = healthCheckInterval;
    (stream as any)._healthCheckInterval = healthCheckInterval;
  }, []);

  const cleanupStream = useCallback((stream: MediaStream | null) => {
    if (!stream) return;

    console.log("ScreenShareCleanup: Cleaning up stream");
    
    // Clear health check interval if it exists
    if ((stream as any)._healthCheckInterval) {
      clearInterval((stream as any)._healthCheckInterval);
    }
    
    if (cleanupIntervalRef.current) {
      clearInterval(cleanupIntervalRef.current);
      cleanupIntervalRef.current = null;
    }
    
    // Stop all tracks
    stream.getTracks().forEach(track => {
      console.log(`ScreenShareCleanup: Stopping track: ${track.kind} - ${track.label}`);
      track.stop();
    });
  }, []);

  const cleanup = useCallback(() => {
    if (cleanupIntervalRef.current) {
      clearInterval(cleanupIntervalRef.current);
      cleanupIntervalRef.current = null;
    }
  }, []);

  return {
    setupHealthCheck,
    cleanupStream,
    cleanup
  };
};
