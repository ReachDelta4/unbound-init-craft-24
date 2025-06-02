import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface WebSocketConnectionPopupProps {
  isOpen: boolean;
  onTimeout: () => void;
  timeoutMs?: number;
  message?: string;
  title?: string;
}

const WebSocketConnectionPopup = ({
  isOpen,
  onTimeout,
  timeoutMs = 30000, // Default 30 seconds timeout
  message = "Connecting to the transcription service...",
  title = "Establishing Connection"
}: WebSocketConnectionPopupProps) => {
  useEffect(() => {
    if (isOpen) {
      const timeoutId = setTimeout(() => {
        onTimeout();
      }, timeoutMs);
      
      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [isOpen, onTimeout, timeoutMs]);

  return (
    <Dialog open={isOpen} modal={true}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {message}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center p-6">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-sm text-muted-foreground">
              Please wait while we establish a secure connection...
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WebSocketConnectionPopup; 