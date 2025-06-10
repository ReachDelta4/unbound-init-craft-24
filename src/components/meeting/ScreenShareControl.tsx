
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Monitor, Square, ChevronDown } from "lucide-react";

interface ScreenShareControlProps {
  isScreenSharing: boolean;
  onStartScreenShare: () => Promise<void>;
  onStopScreenShare: () => void;
  onChangeScreenShare: () => Promise<void>;
  disabled?: boolean;
}

const ScreenShareControl = ({
  isScreenSharing,
  onStartScreenShare,
  onStopScreenShare,
  onChangeScreenShare,
  disabled = false,
}: ScreenShareControlProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleStartShare = async () => {
    setIsLoading(true);
    try {
      await onStartScreenShare();
    } catch (error) {
      console.error("Failed to start screen share:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeShare = async () => {
    setIsLoading(true);
    try {
      await onChangeScreenShare();
    } catch (error) {
      console.error("Failed to change screen share:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopShare = () => {
    onStopScreenShare();
  };

  if (!isScreenSharing) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="h-12 w-12 rounded-full border-2 border-border"
        onClick={handleStartShare}
        disabled={disabled || isLoading}
      >
        <Monitor className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="default"
          className="h-12 px-4 rounded-full border-2 border-border gap-2"
          disabled={disabled || isLoading}
        >
          <Monitor className="h-5 w-5" />
          <span className="text-sm">Sharing</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="mb-2">
        <DropdownMenuItem onClick={handleChangeShare} disabled={isLoading}>
          <Monitor className="h-4 w-4 mr-2" />
          Change what you're sharing
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleStopShare} disabled={isLoading}>
          <Square className="h-4 w-4 mr-2" />
          Stop sharing
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ScreenShareControl;
