
import { useState, useEffect } from 'react';

export const useControlsVisibility = (isCallActive: boolean) => {
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    if (!isCallActive) {
      setShowControls(true);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const { clientY } = e;
      const windowHeight = window.innerHeight;
      
      if (clientY > windowHeight - 100) {
        setShowControls(true);
      } else {
        setShowControls(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isCallActive]);

  return { showControls, setShowControls };
};
