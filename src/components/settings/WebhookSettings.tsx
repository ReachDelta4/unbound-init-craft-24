import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CheckCircle, XCircle, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface WebhookSettingsProps {
  onWebhookUrlChange: (url: string | null) => void;
  defaultUrl?: string | null;
}

const WebhookSettings: React.FC<WebhookSettingsProps> = ({ 
  onWebhookUrlChange,
  defaultUrl = null
}) => {
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(!!defaultUrl);
  const [url, setUrl] = useState<string>(defaultUrl || 'http://127.0.0.1:5678/webhook-test');
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [docsOpen, setDocsOpen] = useState(false);

  // Apply webhook URL when enabled state or URL changes
  useEffect(() => {
    if (enabled) {
      // Don't modify the URL - keep it as is
      onWebhookUrlChange(url);
    } else {
      onWebhookUrlChange(null);
    }
  }, [enabled, url, onWebhookUrlChange]);

  // Test the webhook connection
  const testWebhook = async () => {
    try {
      setTestStatus('idle');
      
      // Add /ai suffix if not already present
      const apiUrl = url.endsWith('/ai') ? url : `${url}/ai`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: true }),
      });
      
      if (response.ok) {
        setTestStatus('success');
        setTimeout(() => setTestStatus('idle'), 3000);
      } else {
        setTestStatus('error');
        setTimeout(() => setTestStatus('idle'), 3000);
        
        toast({
          title: "Webhook Test Failed",
          description: `Server returned: ${response.status} ${response.statusText}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      setTestStatus('error');
      setTimeout(() => setTestStatus('idle'), 3000);
      
      toast({
        title: "Webhook Connection Failed",
        description: error instanceof Error ? error.message : "Could not connect to the webhook server",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Transcription Webhook</h3>
          <p className="text-sm text-muted-foreground">
            Send each complete sentence to a webhook as it's transcribed
          </p>
        </div>
        <Switch 
          checked={enabled} 
          onCheckedChange={setEnabled}
          aria-label="Enable webhook"
        />
      </div>
      
      {enabled && (
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="webhook-url">Webhook URL</Label>
            <div className="flex gap-2">
              <Input
                id="webhook-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/webhook"
                className="flex-1"
              />
              <Button 
                variant="outline" 
                onClick={testWebhook}
                className="whitespace-nowrap"
                disabled={testStatus !== 'idle'}
              >
                {testStatus === 'idle' && 'Test Connection'}
                {testStatus === 'success' && (
                  <span className="flex items-center gap-1 text-green-500">
                    <CheckCircle className="h-4 w-4" /> Success
                  </span>
                )}
                {testStatus === 'error' && (
                  <span className="flex items-center gap-1 text-red-500">
                    <XCircle className="h-4 w-4" /> Failed
                  </span>
                )}
              </Button>
            </div>
            <div className="text-xs text-muted-foreground flex items-start gap-1 mt-1">
              <AlertCircle className="h-3 w-3 mt-0.5 text-amber-500" />
              <span>
                Your webhook endpoint should accept POST requests with JSON data and 
                return JSON responses. The '/ai' suffix will be automatically added 
                if not included in the URL.
              </span>
            </div>
            
            <Collapsible
              open={docsOpen}
              onOpenChange={setDocsOpen}
              className="mt-4 border rounded-md p-2"
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="flex w-full justify-between p-2">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Webhook Format Documentation</span>
                  </div>
                  {docsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-2 pt-2 pb-4 space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-1">Request Format</h4>
                  <div className="bg-slate-950 text-slate-50 p-2 rounded text-xs overflow-x-auto">
                    <pre>{`POST ${url}${url.endsWith('/ai') ? '' : '/ai'}
Content-Type: application/json

{
  "sentence": "This is the transcribed sentence."
}`}</pre>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold mb-1">Expected Response Format</h4>
                  <div className="bg-slate-950 text-slate-50 p-2 rounded text-xs overflow-x-auto">
                    <pre>{`{
  "insights": {
    "emotions": [
      { "emotion": "Interest", "level": 75 },
      { "emotion": "Concern", "level": 30 }
    ],
    "painPoints": [
      "First pain point",
      "Second pain point"
    ],
    "objections": [
      "First objection",
      "Second objection"
    ],
    "recommendations": [
      "First recommendation",
      "Second recommendation"
    ],
    "nextActions": [
      "First action",
      "Second action"
    ]
  },
  "clientEmotion": "Interest",
  "clientInterest": 75,
  "callStage": "Discovery",
  "aiCoachingSuggestion": "Ask about their current workflow."
}`}</pre>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  <p>All fields in the response are optional. If a field is not provided, the current value will be preserved.</p>
                  <p className="mt-1">To set up a local webhook for testing, consider using tools like:</p>
                  <ul className="list-disc list-inside mt-1 ml-2">
                    <li>n8n.io</li>
                    <li>Pipedream</li>
                    <li>webhook.site</li>
                    <li>A simple Express.js server</li>
                  </ul>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebhookSettings; 