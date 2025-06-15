import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Play, StopCircle, Mic, Video, Loader2 } from "lucide-react";

interface MeetingControlsProps {
  isCallActive: boolean;
  callType: string | null;
  callDuration: number;
  setCallDuration?: (duration: number) => void;
  onCallTypeChange?: (value: string) => void;
  onShowStartCallDialog: (callType: string) => void;
  onEndCall: () => void;
  isCreatingMeeting?: boolean;
  isSavingMeeting?: boolean;
}

const MeetingControls = ({
  isCallActive,
  callType: propCallType,
  callDuration,
  onShowStartCallDialog,
  onEndCall,
  isCreatingMeeting = false,
  isSavingMeeting = false,
}: MeetingControlsProps) => {
  // Local state for call type selection
  const [selectedCallType, setSelectedCallType] = useState<string>(propCallType || "");

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCallTypeChange = (value: string) => {
    setSelectedCallType(value);
  };

  const handleStartCall = () => {
    if (selectedCallType) {
      onShowStartCallDialog(selectedCallType);
    }
  };

  return (
    <div className="flex justify-center items-center gap-3 max-w-3xl mx-auto">
      {isCallActive && (
        <div className="flex items-center gap-2 bg-muted py-1 px-3 rounded-full">
          <span className="animate-pulse text-green-500">●</span>
          <span className="text-sm font-mono">{formatTime(callDuration)}</span>
        </div>
      )}
      
      <Select
        value={isCallActive ? propCallType || "" : selectedCallType}
        onValueChange={handleCallTypeChange}
        disabled={isCallActive || isCreatingMeeting}
      >
        <SelectTrigger className="w-[180px] h-9">
          <SelectValue placeholder="Select call type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="video" className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Video size={16} />
              <span>Video Meeting</span>
            </div>
          </SelectItem>
          <SelectItem value="audio" className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Mic size={16} />
              <span>Audio Call</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {isCallActive ? (
        <Button 
          onClick={onEndCall} 
          variant="destructive" 
          size="sm"
          className="gap-2 h-9 px-4"
          disabled={isSavingMeeting}
        >
          {isSavingMeeting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <StopCircle size={16} />
              End Call
            </>
          )}
        </Button>
      ) : (
        <Button 
          onClick={handleStartCall} 
          variant="default" 
          size="sm"
          disabled={!selectedCallType || isCreatingMeeting}
          className="bg-indigo-600 hover:bg-indigo-700 gap-2 h-9 px-4"
        >
          {isCreatingMeeting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Starting...
            </>
          ) : (
            <>
              <Play size={16} />
              Start Call
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default MeetingControls;
