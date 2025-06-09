
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

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

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

  if (!isActive || !stream) {
    return (
      <div 
        ref={containerRef}
        className="bg-card/50 border border-border/50 rounded-lg flex items-center justify-center relative"
        style={{ height: `${height}px` }}
      >
        <div className="text-center text-muted-foreground">
          <div className="w-16 h-16 mx-auto mb-4 opacity-50">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" 
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <p>Screen share preview will appear here</p>
        </div>
        {/* Resize handle */}
        <div 
          className={`absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize bg-border/30 hover:bg-border/60 transition-colors ${isResizing ? 'bg-primary/50' : ''}`}
          onMouseDown={handleMouseDown}
        />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="bg-black rounded-lg overflow-hidden border border-border/50 shadow-lg relative"
      style={{ height: `${height}px` }}
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-contain"
      />
      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
        Screen Share Preview
      </div>
      {/* Resize handle */}
      <div 
        className={`absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize bg-transparent hover:bg-white/20 transition-colors ${isResizing ? 'bg-primary/50' : ''}`}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
};

export default ResizableScreenShare;
