
import React, { useRef, useEffect, useState } from "react";

interface CallTimerProps {
  isActive: boolean;
  onDurationChange: (duration: number) => void;
  initialDuration?: number;
}

const CallTimer = ({ isActive, onDurationChange, initialDuration = 0 }: CallTimerProps) => {
  const [callDuration, setCallDuration] = useState(initialDuration);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing timer first to prevent multiple timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (isActive) {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => {
          const newDuration = prev + 1;
          onDurationChange(newDuration);
          return newDuration;
        });
      }, 1000);
    }

    // Cleanup function to ensure timer is cleared
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isActive, onDurationChange]);

  // Reset the timer when it becomes inactive
  useEffect(() => {
    if (!isActive && callDuration !== initialDuration) {
      setCallDuration(initialDuration);
    }
  }, [isActive, initialDuration, callDuration]);

  return null; // This is a logic-only component
};

export default CallTimer;
