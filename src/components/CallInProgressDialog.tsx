import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onReturnToCall: () => void;
  onContinue: () => void;
}

const CallInProgressDialog: React.FC<Props> = ({ open, onReturnToCall, onContinue }) => (
  <Dialog open={open} onOpenChange={onContinue}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Call in Progress</DialogTitle>
        <DialogDescription>
          You have a call running in the background. Would you like to return to the call or continue navigating?
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button onClick={onReturnToCall}>Return to Call</Button>
        <Button variant="outline" onClick={onContinue}>Continue</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default CallInProgressDialog; 