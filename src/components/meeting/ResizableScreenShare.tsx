import React, { useRef, useEffect, useState } from "react";

interface ResizableScreenShareProps {
  stream: MediaStream | null;
  isActive: boolean;
}

const ResizableScreenShare = ({ stream, isActive }: ResizableScreenShareProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false); // Debug mode toggle

  useEffect(() => {
    console.log("ResizableScreenShare - Stream changed:", {
      stream: !!stream,
      videoTracks: stream?.getVideoTracks().length || 0,
      audioTracks: stream?.getAudioTracks().length || 0,
      isActive
    });
    
    if (videoRef.current && stream) {
      // Force display even if there are no video tracks detected
      // This ensures we at least try to show something
      setHasVideo(true);
      setVideoError(null);
      
      try {
        videoRef.current.srcObject = stream;
        
        // Ensure the video plays and log any errors
        videoRef.current.play().catch(err => {
          console.error("Error playing video:", err);
          setVideoError(err.message || "Failed to play video");
        });
      } catch (err) {
        console.error("Error setting srcObject:", err);
        setVideoError(err instanceof Error ? err.message : "Error setting video source");
      }
    } else {
      setHasVideo(false);
    }
  }, [stream, isActive]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    
    const startY = e.clientY;
    const startHeight = height;
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - startY;
      const newHeight = Math.max(200, Math.min(600, startHeight + deltaY));
      setHeight(newHeight);
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Toggle debug mode with double click
  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
  };

  // Debug information panel
  const DebugPanel = () => {
    if (!debugMode) return null;
    
    return (
      <div className="absolute top-8 left-2 right-2 bg-black/90 text-white text-xs p-2 rounded overflow-auto max-h-[200px] border border-white/20">
        <h4 className="font-bold mb-1">Screen Share Debug Info:</h4>
        <div className="space-y-1">
          <p>Active: {isActive ? 'Yes' : 'No'}</p>
          <p>Stream: {stream ? 'Present' : 'Missing'}</p>
          <p>Video Tracks: {stream?.getVideoTracks().length || 0}</p>
          <p>Audio Tracks: {stream?.getAudioTracks().length || 0}</p>
          <p>Has Video State: {hasVideo ? 'Yes' : 'No'}</p>
          <p>Video Error: {videoError || 'None'}</p>
          {stream?.getVideoTracks().map((track, i) => (
            <div key={i} className="pl-2 border-l border-gray-700 mt-1">
              <p>Track {i}: {track.label}</p>
              <p className="pl-2">Enabled: {track.enabled ? 'Yes' : 'No'}</p>
              <p className="pl-2">State: {track.readyState}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Show the placeholder if not active, no stream, or we have an error
  if (!isActive || !stream) {
    return (
      <div 
        ref={containerRef}
        className="bg-card border-2 border-border rounded-lg flex items-center justify-center relative"
        style={{ height: `${height}px` }}
        onDoubleClick={toggleDebugMode}
      >
        <div className="text-center text-muted-foreground">
          <div className="w-16 h-16 mx-auto mb-4 opacity-50">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" 
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <p>Screen share preview will appear here</p>
          {videoError && <p className="text-red-500 text-xs mt-2">{videoError}</p>}
        </div>
        {debugMode && <DebugPanel />}
        {/* Resize handle */}
        <div 
          className={`absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize bg-border hover:bg-border/80 transition-colors ${isResizing ? 'bg-primary/50' : ''}`}
          onMouseDown={handleMouseDown}
        />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="bg-black rounded-lg overflow-hidden border-2 border-border shadow-lg relative"
      style={{ height: `${height}px` }}
      onDoubleClick={toggleDebugMode}
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-contain"
      />
      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded border border-white/20">
        Screen Share Preview
      </div>
      {debugMode && <DebugPanel />}
      {/* Resize handle */}
      <div 
        className={`absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize bg-border/50 hover:bg-border transition-colors ${isResizing ? 'bg-primary/50' : ''}`}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
};

export default ResizableScreenShare;
