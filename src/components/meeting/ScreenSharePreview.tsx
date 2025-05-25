import React, { useEffect, useRef } from 'react';

interface ScreenSharePreviewProps {
  stream: MediaStream | null;
  isActive: boolean;
}

const ScreenSharePreview = ({ stream, isActive }: ScreenSharePreviewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!isActive || !stream) {
    return null;
  }

  return (
    <div className="fixed bottom-24 right-4 w-64 h-48 bg-black rounded-lg shadow-lg overflow-hidden z-50">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-contain"
      />
      <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
        Screen Share
      </div>
    </div>
  );
};

export default ScreenSharePreview; 