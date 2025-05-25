import React, { useEffect, useRef } from "react";
import { useMeetingState } from "@/hooks/use-meeting-state";

interface CallTimerProps {
  isActive: boolean;
  onDurationChange: (duration: number) => void;
}

const CallTimer = ({ isActive, onDurationChange }: CallTimerProps) => {
  const { callStartTime } = useMeetingState();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isActive || !callStartTime) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      onDurationChange(0);
      return;
    }
    // Update every second
    timerRef.current = setInterval(() => {
      const duration = Math.floor((Date.now() - callStartTime) / 1000);
      onDurationChange(duration);
    }, 1000);
    // Initial call
    onDurationChange(Math.floor((Date.now() - callStartTime) / 1000));
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isActive, callStartTime, onDurationChange]);

  return null;
};

export default CallTimer;
