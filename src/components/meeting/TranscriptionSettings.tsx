import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Settings } from 'lucide-react';
import WebhookSettings from '@/components/settings/WebhookSettings';

interface TranscriptionSettingsProps {
  onWebhookUrlChange: (url: string | null) => void;
  defaultWebhookUrl?: string | null;
}

const TranscriptionSettings: React.FC<TranscriptionSettingsProps> = ({
  onWebhookUrlChange,
  defaultWebhookUrl = null
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Transcription Settings">
          <Settings className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Transcription Settings</SheetTitle>
          <SheetDescription>
            Configure transcription behavior and integrations
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          <WebhookSettings 
            onWebhookUrlChange={onWebhookUrlChange}
            defaultUrl={defaultWebhookUrl}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TranscriptionSettings; 