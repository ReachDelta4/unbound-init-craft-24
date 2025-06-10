
import React from 'react';
import { Card } from '@/components/ui/card';
import { Monitor } from 'lucide-react';

const ScreenSharePlaceholder = () => {
  return (
    <Card className="w-full h-64 flex items-center justify-center bg-muted/30 border border-border">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Monitor className="h-12 w-12" />
        <p className="text-sm">Screen share preview will appear here</p>
        <p className="text-xs">Start screen sharing to see content</p>
      </div>
    </Card>
  );
};

export default ScreenSharePlaceholder;
