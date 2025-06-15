import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface EndCallConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const EndCallConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
}: EndCallConfirmationDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader className="flex flex-col items-center">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 mb-3">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <DialogTitle className="text-center">End Current Call?</DialogTitle>
          <DialogDescription className="text-center pt-2">
            This will end your current call and disconnect from the meeting. You'll be immediately taken to the save screen where you must save your meeting data.
          </DialogDescription>
          <p className="mt-2 text-sm text-amber-600 dark:text-amber-400 text-center">
            <strong>Important:</strong> After ending the call, you won't be able to return to it.
          </p>
        </DialogHeader>

        <DialogFooter className="mt-6 flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Continue Meeting
          </Button>
          <Button 
            variant="destructive"
            onClick={onConfirm}
            className="w-full sm:w-auto"
          >
            End Call & Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EndCallConfirmationDialog; 