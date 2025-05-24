
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
    if (isActive) {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => {
          const newDuration = prev + 1;
          onDurationChange(newDuration);
          return newDuration;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive, onDurationChange]);

  return null; // This is a logic-only component
};

export default CallTimer;
