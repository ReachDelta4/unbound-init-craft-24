import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export interface CallDetails {
  clientName: string;
  clientCompany: string;
  clientBusiness: string;
  meetingAgenda: string;
}

interface StartCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (details: CallDetails) => void;
}

export const StartCallDialog: React.FC<StartCallDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
}) => {
  const [details, setDetails] = useState<CallDetails>({
    clientName: "",
    clientCompany: "",
    clientBusiness: "",
    meetingAgenda: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    onSubmit(details);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Call Details and Expectations</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="clientName" className="text-right">
              Client Name
            </Label>
            <Input
              id="clientName"
              name="clientName"
              value={details.clientName}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="clientCompany" className="text-right">
              Client's Company
            </Label>
            <Input
              id="clientCompany"
              name="clientCompany"
              value={details.clientCompany}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="clientBusiness" className="text-right pt-2">
              What does the client/business do?
            </Label>
            <Textarea
              id="clientBusiness"
              name="clientBusiness"
              value={details.clientBusiness}
              onChange={handleChange}
              className="col-span-3 min-h-[100px]"
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="meetingAgenda" className="text-right pt-2">
              Meeting Agenda
            </Label>
            <Textarea
              id="meetingAgenda"
              name="meetingAgenda"
              value={details.meetingAgenda}
              onChange={handleChange}
              className="col-span-3 min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 