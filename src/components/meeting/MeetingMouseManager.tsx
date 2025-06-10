
import { useState, useEffect, useRef } from 'react';

export const useMeetingMouseManager = () => {
  const [showControls, setShowControls] = useState(true);
  const mouseTimeoutRef = useRef<number | null>(null);

  // Handle mouse movement to show/hide controls
  const handleMouseMove = (e: MouseEvent) => {
    const { clientY } = e;
    const windowHeight = window.innerHeight;
    
    // Show controls when mouse is near the bottom 100px of the screen
    const shouldShowControls = clientY > windowHeight - 100;
    
    if (shouldShowControls !== showControls) {
      setShowControls(shouldShowControls);
    }
    
    // Reset any existing timeout
    if (mouseTimeoutRef.current) {
      window.clearTimeout(mouseTimeoutRef.current);
      mouseTimeoutRef.current = null;
    }
  };

  // Set up mouse move listener
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (mouseTimeoutRef.current) {
        window.clearTimeout(mouseTimeoutRef.current);
      }
    };
  }, [showControls]);

  return { showControls };
};
