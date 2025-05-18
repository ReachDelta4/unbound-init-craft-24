
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Play, StopCircle, Mic, Video } from "lucide-react";

interface MeetingControlsProps {
  isCallActive: boolean;
  callType: string | null;
  callDuration: number;
  onCallTypeChange: (value: string) => void;
  onStartCall: () => void;
  onEndCall: () => void;
}

const MeetingControls = ({
  isCallActive,
  callType,
  callDuration,
  onCallTypeChange,
  onStartCall,
  onEndCall,
}: MeetingControlsProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex justify-center items-center gap-4">
      {isCallActive && (
        <div className="flex items-center gap-2 bg-muted py-1 px-3 rounded-full">
          <span className="animate-pulse text-green-500">●</span>
          <span className="text-sm font-mono">{formatTime(callDuration)}</span>
        </div>
      )}
      
      <Select
        value={callType || ""}
        onValueChange={onCallTypeChange}
        disabled={isCallActive}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select call type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="video" className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Video size={16} />
              <span>Video Meeting (Google Meet/Zoom)</span>
            </div>
          </SelectItem>
          <SelectItem value="audio" className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Mic size={16} />
              <span>Audio Call (Zoho, Salesforce)</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {isCallActive ? (
        <Button 
          onClick={onEndCall} 
          variant="destructive" 
          size="lg"
          className="gap-2"
        >
          <StopCircle size={18} />
          End Call
        </Button>
      ) : (
        <Button 
          onClick={onStartCall} 
          variant="default" 
          size="lg"
          disabled={!callType}
          className="bg-indigo-600 hover:bg-indigo-700 gap-2"
        >
          <Play size={18} />
          Start Call
        </Button>
      )}
    </div>
  );
};

export default MeetingControls;
