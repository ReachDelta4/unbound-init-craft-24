import React from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, Phone, Monitor, Share2 } from "lucide-react";

interface MeetingControlsBarProps {
  showControls: boolean;
  isCallActive: boolean;
  isMicOn: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleCall: () => void;
}

const MeetingControlsBar = ({
  showControls,
  isCallActive,
  isMicOn,
  isVideoOn,
  isScreenSharing,
  onToggleMic,
  onToggleVideo,
  onToggleScreenShare,
  onToggleCall
}: MeetingControlsBarProps) => {
  return (
    <div 
      className="h-20 bg-card border-t-2 border-border shadow-lg flex items-center justify-center gap-4 transition-all duration-300"
      style={{
        transform: showControls ? 'translateY(0)' : 'translateY(100%)',
        opacity: showControls ? 1 : 0,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10
      }}
    >
      {/* Left Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant={isMicOn ? "default" : "outline"}
          size="icon"
          className="h-12 w-12 rounded-full border-2 border-border"
          onClick={onToggleMic}
        >
          {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </Button>
        
        <Button
          variant={isVideoOn ? "default" : "outline"}
          size="icon"
          className="h-12 w-12 rounded-full border-2 border-border"
          onClick={onToggleVideo}
        >
          {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </Button>
      </div>
      
      {/* Center Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant={isScreenSharing ? "default" : "outline"}
          size="icon"
          className="h-12 w-12 rounded-full border-2 border-border"
          onClick={onToggleScreenShare}
        >
          {isScreenSharing ? <Monitor className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
        </Button>
      </div>
      
      {/* Right Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant={isCallActive ? "destructive" : "default"}
          size="lg"
          className="rounded-full px-8 border-2 border-border"
          onClick={onToggleCall}
        >
          <Phone className="h-5 w-5 mr-2" />
          {isCallActive ? "End Call" : "Start Call"}
        </Button>
      </div>
    </div>
  );
};

export default MeetingControlsBar;
