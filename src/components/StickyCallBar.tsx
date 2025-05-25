import React, { useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMeetingState } from "@/hooks/use-meeting-state";

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const StickyCallBar: React.FC = () => {
  const { activeMeeting, callStartTime } = useMeetingState();
  const navigate = useNavigate();
  const location = useLocation();
  const isCallActive = !!(activeMeeting && activeMeeting.status === "active" && callStartTime);

  // Timer calculation
  const [duration, setDuration] = React.useState(0);
  React.useEffect(() => {
    if (!isCallActive || !callStartTime) {
      setDuration(0);
      return;
    }
    setDuration(Math.floor((Date.now() - callStartTime) / 1000));
    const interval = setInterval(() => {
      setDuration(Math.floor((Date.now() - callStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isCallActive, callStartTime]);

  if (!isCallActive) return null;
  // Don't show on the dashboard/call page
  if (location.pathname === "/") return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      background: "#22c55e",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0.5rem 1.5rem",
      fontWeight: 500,
      boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
    }}>
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontWeight: 700, marginRight: 12 }}>Call in Progress</span>
        <span style={{ fontFamily: "monospace", background: "rgba(0,0,0,0.12)", borderRadius: 4, padding: "2px 8px" }}>{formatTime(duration)}</span>
      </span>
      <button
        style={{
          background: "#fff",
          color: "#22c55e",
          border: "none",
          borderRadius: 4,
          padding: "6px 16px",
          fontWeight: 600,
          cursor: "pointer",
          fontSize: 15,
        }}
        onClick={() => navigate("/")}
      >
        Return to Call
      </button>
    </div>
  );
};

export default StickyCallBar; 