import { useState, useCallback, useRef, useEffect } from 'react';
import { isElectron, isScreenSharingSupported } from '@/lib/browser-detection';

interface WebRTCState {
  isScreenSharing: boolean;
  isAudioEnabled: boolean;
  stream: MediaStream | null;
  error: string | null;
}

export const useWebRTC = () => {
  const [state, setState] = useState<WebRTCState>({
    isScreenSharing: false,
    isAudioEnabled: false,
    stream: null,
    error: null,
  });

  // Keep a ref to the original screen stream
  const screenStreamRef = useRef<MediaStream | null>(null);
  // Keep a ref to the latest stopScreenShare function for use in event handlers
  const stopScreenShareRef = useRef<() => void>(() => {});

  // Stop all tracks in both the combined and original screen stream
  const stopScreenShare = useCallback(() => {
    console.log("useWebRTC: Stopping screen share...");
    
    if (state.stream) {
      state.stream.getTracks().forEach(track => {
        console.log(`useWebRTC: Stopping track: ${track.kind} - ${track.label}`);
        track.stop();
      });
    }
    
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => {
        console.log(`useWebRTC: Stopping original track: ${track.kind} - ${track.label}`);
        track.stop();
      });
      screenStreamRef.current = null;
    }
    
    setState({
      isScreenSharing: false,
      isAudioEnabled: false,
      stream: null,
      error: null,
    });
    
    console.log("useWebRTC: Screen share stopped");
  }, [state.stream]);
  stopScreenShareRef.current = stopScreenShare;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("useWebRTC: Hook unmounting, cleaning up streams");
      stopScreenShareRef.current();
    };
  }, []);

  const startScreenShare = useCallback(async (): Promise<MediaStream> => {
    // First, check if screen sharing is supported
    if (!isScreenSharingSupported()) {
      const errorMsg = isElectron() 
        ? 'Screen sharing is not working in this Electron build. Please check permissions.'
        : 'Screen sharing is not supported in this browser.';
      
      setState(prev => ({ 
        ...prev, 
        error: errorMsg,
        isScreenSharing: false
      }));
      
      throw new Error(errorMsg);
    }
    
    // Always stop any existing screen share before starting a new one
    stopScreenShareRef.current();
    
    console.log("useWebRTC: Starting screen capture process...");
    
    try {
      // Clear any previous error and set loading state
      setState(prev => ({ 
        ...prev, 
        error: null,
        isScreenSharing: true // Set this immediately to show loading state
      }));
      
      console.log("useWebRTC: Requesting display media...");
      
      let screenStream: MediaStream | null = null;

      try {
        // Try the standard API first
        screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: { ideal: 1920, max: 1920 },
            height: { ideal: 1080, max: 1080 },
            frameRate: { ideal: 30, max: 30 }
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        
        // Also try to capture microphone audio and combine streams
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            },
            video: false
          });
          
          // Create a new stream that combines both screen and mic
          const combinedStream = new MediaStream();
          
          // Add all tracks from screen stream
          screenStream.getTracks().forEach(track => {
            combinedStream.addTrack(track);
          });
          
          // Add mic audio track
          micStream.getAudioTracks().forEach(track => {
            combinedStream.addTrack(track);
          });
          
          // Use the combined stream instead
          screenStream = combinedStream;
          
          console.log('useWebRTC: Combined screen and microphone streams successfully');
        } catch (micError) {
          console.warn('useWebRTC: Failed to get microphone access, continuing with just screen audio:', micError);
          // Continue with just the screen stream
        }
      } catch (stdErr) {
        console.warn('useWebRTC: Standard getDisplayMedia failed, attempting Electron fallback...', stdErr);

        if (isElectron() && window.electronAPI && typeof window.electronAPI.getScreenSources === 'function') {
          try {
            const response = await window.electronAPI.getScreenSources({
              types: ['screen', 'window'],
              thumbnailSize: { width: 150, height: 150 },
              fetchWindowIcons: true,
            });
            
            console.log('useWebRTC: Electron getScreenSources response:', response);
            
            if (!response.success) {
              throw new Error(response.error || 'Failed to get screen sources from Electron');
            }
            
            const sources = response.sources;

            if (sources && sources.length > 0) {
              const src = sources.find((s: any) => s.name.toLowerCase().includes('screen')) || sources[0];
              // @ts-ignore
              screenStream = await (navigator.mediaDevices as any).getUserMedia({
                audio: {
                  mandatory: {
                    chromeMediaSource: 'desktop'
                  },
                  optional: [
                    { echoCancellation: true },
                    { noiseSuppression: true },
                    { autoGainControl: true }
                  ]
                },
                video: {
                  mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: src.id,
                    minWidth: 1280,
                    maxWidth: 1920,
                    minHeight: 720,
                    maxHeight: 1080,
                  },
                },
              });
              
              // Also try to capture microphone audio and combine streams
              try {
                const micStream = await navigator.mediaDevices.getUserMedia({
                  audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                  },
                  video: false
                });
                
                // Create a new stream that combines both screen and mic
                const combinedStream = new MediaStream();
                
                // Add all tracks from screen stream
                screenStream.getTracks().forEach(track => {
                  combinedStream.addTrack(track);
                });
                
                // Add mic audio track
                micStream.getAudioTracks().forEach(track => {
                  combinedStream.addTrack(track);
                });
                
                // Use the combined stream instead
                screenStream = combinedStream;
                
                console.log('useWebRTC: Combined Electron screen and microphone streams successfully');
              } catch (micError) {
                console.warn('useWebRTC: Failed to get microphone access in Electron, continuing with just screen audio:', micError);
                // Continue with just the screen stream
              }
            } else {
              throw new Error('No screen sources available in Electron');
            }
          } catch (electronErr) {
            console.error('useWebRTC: Electron fallback failed', electronErr);
            throw electronErr;
          }
        } else {
          throw stdErr;
        }
      }
      
      // Validate the stream
      if (!screenStream) {
        throw new Error('No screen stream received from getDisplayMedia');
      }
      
      // Check if video track exists and is active
      const videoTracks = screenStream.getVideoTracks();
      const audioTracks = screenStream.getAudioTracks();
      
      console.log('useWebRTC: Screen share stream created:', {
        id: screenStream.id,
        active: screenStream.active,
        videoTracks: videoTracks.length,
        audioTracks: audioTracks.length,
        videoTrackStates: videoTracks.map(t => ({
          label: t.label,
          enabled: t.enabled,
          readyState: t.readyState,
          kind: t.kind
        })),
        audioTrackStates: audioTracks.map(t => ({
          label: t.label,
          enabled: t.enabled,
          readyState: t.readyState,
          kind: t.kind
        }))
      });
      
      if (videoTracks.length === 0) {
        screenStream.getTracks().forEach(track => track.stop());
        throw new Error('No video track found in screen share stream');
      }
      
      // Verify the video track is actually working
      const videoTrack = videoTracks[0];
      if (videoTrack.readyState !== 'live') {
        console.warn('useWebRTC: Video track is not live:', videoTrack.readyState);
      }
      
      // Store references
      screenStreamRef.current = screenStream;
      
      // Update state with the new stream - this should trigger re-renders
      setState({
        isScreenSharing: true,
        isAudioEnabled: audioTracks.length > 0,
        stream: screenStream,
        error: null,
      });

      // Add event listeners for track ended events
      videoTracks.forEach((track, index) => {
        track.onended = () => {
          console.log(`useWebRTC: Video track ${index} ended by user`);
          stopScreenShareRef.current();
        };
      });

      audioTracks.forEach((track, index) => {
        track.onended = () => {
          console.log(`useWebRTC: Audio track ${index} ended`);
          // Don't stop everything just because audio ended
        };
      });

      console.log('useWebRTC: Screen share started successfully, returning stream');
      return screenStream;
      
    } catch (error) {
      console.error("useWebRTC: Screen share error:", error);
      
      let errorMessage = 'Failed to start screen sharing';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Screen sharing permission denied. Please allow screen sharing and try again.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No screen sharing source available.';
        } else if (error.name === 'NotSupportedError') {
          errorMessage = isElectron() 
            ? 'Screen sharing is not working in this Electron build. Please check permissions.'
            : 'Screen sharing is not supported in this browser.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setState(prev => ({
        ...prev,
        isScreenSharing: false,
        stream: null,
        error: errorMessage,
      }));
      
      throw new Error(errorMessage);
    }
  }, []);

  console.log('useWebRTC: Current state:', {
    isScreenSharing: state.isScreenSharing,
    hasStream: !!state.stream,
    streamId: state.stream?.id,
    error: state.error,
    streamActive: state.stream?.active,
    isElectron: isElectron(),
    screenSharingSupported: isScreenSharingSupported()
  });

  return {
    ...state,
    startScreenShare,
    stopScreenShare,
  };
};
