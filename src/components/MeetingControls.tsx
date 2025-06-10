
import React from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, Phone, Share2, Monitor } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ScreenShareControl from "@/components/meeting/ScreenShareControl";
import { useWebRTC } from "@/hooks/useWebRTC";

interface MeetingControlsProps {
  isCallActive: boolean;
  callType: string | null;
  callDuration: number;
  onCallTypeChange: (type: string) => void;
  onStartCall: () => void;
  onEndCall: () => void;
  isLoading?: boolean;
  isSaving?: boolean;
}

const MeetingControls = ({
  isCallActive,
  callType,
  callDuration,
  onCallTypeChange,
  onStartCall,
  onEndCall,
  isLoading = false,
  isSaving = false
}: MeetingControlsProps) => {
  const {
    startScreenShare,
    stopScreenShare,
    isScreenSharing
  } = useWebRTC();

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChangeScreen = async () => {
    // Stop current sharing and start new one
    stopScreenShare();
    setTimeout(async () => {
      try {
        await startScreenShare();
      } catch (error) {
        console.error('Failed to change screen share:', error);
      }
    }, 100);
  };

  return (
    <div className="flex items-center justify-between w-full px-4">
      {/* Left side - Call controls */}
      <div className="flex items-center gap-3">
        {!isCallActive ? (
          <>
            <Select value={callType || ""} onValueChange={onCallTypeChange}>
              <SelectTrigger className="w-40 border-2 border-border">
                <SelectValue placeholder="Select call type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="video">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Video Call
                  </div>
                </SelectItem>
                <SelectItem value="audio">
                  <div className="flex items-center gap-2">
                    <Mic className="h-4 w-4" />
                    Audio Call
                  </div>
                </SelectItem>
                <SelectItem value="screenshare">
                  <div className="flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    Screen Share
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              onClick={onStartCall}
              disabled={!callType || isLoading}
              className="bg-green-600 hover:bg-green-700 text-white border-2 border-border"
            >
              <Phone className="h-4 w-4 mr-2" />
              {isLoading ? "Starting..." : "Start Call"}
            </Button>
          </>
        ) : (
          <>
            {/* Audio control */}
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full border-2 border-border"
            >
              <Mic className="h-5 w-5" />
            </Button>
            
            {/* Video control */}
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full border-2 border-border"
            >
              <Video className="h-5 w-5" />
            </Button>

            {/* Screen sharing control */}
            <ScreenShareControl
              isSharing={isScreenSharing}
              onStartSharing={startScreenShare}
              onStopSharing={stopScreenShare}
              onChangeScreen={handleChangeScreen}
            />
          </>
        )}
      </div>

      {/* Center - Call duration */}
      {isCallActive && (
        <div className="text-sm font-medium text-muted-foreground">
          {formatDuration(callDuration)}
        </div>
      )}

      {/* Right side - End call */}
      {isCallActive && (
        <Button
          onClick={onEndCall}
          disabled={isSaving}
          className="bg-red-600 hover:bg-red-700 text-white border-2 border-border"
        >
          <Phone className="h-4 w-4 mr-2" />
          {isSaving ? "Ending..." : "End Call"}
        </Button>
      )}
    </div>
  );
};

export default MeetingControls;
