
import React, { useState } from 'react';
import { Monitor, MonitorStop, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ScreenShareControlProps {
  isSharing: boolean;
  onStartSharing: () => Promise<void>;
  onStopSharing: () => void;
  onChangeScreen?: () => Promise<void>;
}

const ScreenShareControl = ({ 
  isSharing, 
  onStartSharing, 
  onStopSharing,
  onChangeScreen 
}: ScreenShareControlProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const handleStartSharing = async () => {
    setIsLoading(true);
    try {
      await onStartSharing();
    } catch (error) {
      console.error('Failed to start screen sharing:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeScreen = async () => {
    if (onChangeScreen) {
      setIsLoading(true);
      try {
        await onChangeScreen();
        setShowOptions(false);
      } catch (error) {
        console.error('Failed to change screen:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleStopSharing = () => {
    onStopSharing();
    setShowOptions(false);
  };

  if (!isSharing) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="h-12 w-12 rounded-full border-2 border-border"
        onClick={handleStartSharing}
        disabled={isLoading}
      >
        <Monitor className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Popover open={showOptions} onOpenChange={setShowOptions}>
      <PopoverTrigger asChild>
        <Button
          variant="default"
          size="icon"
          className="h-12 w-12 rounded-full border-2 border-border bg-primary"
        >
          <Monitor className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" side="top">
        <div className="space-y-1">
          {onChangeScreen && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={handleChangeScreen}
              disabled={isLoading}
            >
              <Settings className="h-4 w-4 mr-2" />
              Change what you're sharing
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={handleStopSharing}
          >
            <MonitorStop className="h-4 w-4 mr-2" />
            Stop sharing
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ScreenShareControl;
