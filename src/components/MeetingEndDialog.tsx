
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface MeetingInsight {
  type: string;
  data: any[];
}

interface MeetingEndDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, transcript: string, summary: string) => Promise<void>;
  transcript: string;
  summary: string;
  insights: MeetingInsight[];
  saveProgress?: number;
}

const MeetingEndDialog = ({
  isOpen,
  onClose,
  onSave,
  transcript: initialTranscript,
  summary: initialSummary,
  insights,
  saveProgress = 0
}: MeetingEndDialogProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("summary");
  const [title, setTitle] = useState("New Meeting");
  const [transcript, setTranscript] = useState(initialTranscript);
  const [summary, setSummary] = useState(initialSummary);
  const [isSaving, setIsSaving] = useState(false);
  const [internalProgress, setInternalProgress] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setTitle("New Meeting");
      setTranscript(initialTranscript);
      setSummary(initialSummary);
      setInternalProgress(0);
    }
  }, [isOpen, initialTranscript, initialSummary]);

  // Update internal progress based on incoming saveProgress
  useEffect(() => {
    if (saveProgress > 0) {
      setInternalProgress(saveProgress);
      if (saveProgress >= 100) {
        // Auto-close after completion
        setTimeout(() => {
          setIsSaving(false);
          toast({
            title: "Meeting saved",
            description: "Your meeting has been successfully saved.",
          });
        }, 500);
      }
    }
  }, [saveProgress, toast]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Start progress animation
      setInternalProgress(10);
      const progressInterval = setInterval(() => {
        setInternalProgress(prev => {
          // Increment until 90% (leave room for actual completion)
          if (prev < 90 && saveProgress === 0) {
            return prev + 5;
          }
          return prev;
        });
      }, 300);
      
      // Execute the save with a longer timeout
      try {
        await Promise.race([
          onSave(title, transcript, summary),
          // Longer timeout (15s) for large meeting data
          new Promise((_, reject) => setTimeout(() => reject(new Error('Save timeout')), 15000))
        ]);
        
        // If save is handled by parent component via saveProgress, this won't execute
        if (saveProgress === 0) {
          setInternalProgress(100);
          toast({
            title: "Meeting saved",
            description: "Your meeting has been successfully saved.",
          });
          setTimeout(() => {
            setIsSaving(false);
            setInternalProgress(0);
          }, 500);
        }
      } catch (error) {
        throw error;
      } finally {
        clearInterval(progressInterval);
      }
    } catch (error) {
      console.error("Error saving meeting:", error);
      toast({
        title: "Failed to save meeting",
        description: "There was an error saving your meeting. Please try again.",
        variant: "destructive",
      });
      setIsSaving(false);
      setInternalProgress(0);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSaving && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Save Meeting</DialogTitle>
          <DialogDescription>
            Review and edit your meeting details before saving.
          </DialogDescription>
        </DialogHeader>

        {(isSaving || internalProgress > 0) && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Saving your meeting</span>
              <span>{Math.round(Math.max(internalProgress, saveProgress))}%</span>
            </div>
            <Progress value={Math.max(internalProgress, saveProgress)} className="h-2" />
          </div>
        )}

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Meeting Title
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter meeting title"
              disabled={isSaving}
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="summary" className="flex-1" disabled={isSaving}>
                Summary
              </TabsTrigger>
              <TabsTrigger value="transcript" className="flex-1" disabled={isSaving}>
                Transcript
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex-1" disabled={isSaving}>
                Insights
              </TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="mt-4 space-y-2">
              <label htmlFor="summary" className="text-sm font-medium">
                Meeting Summary
              </label>
              <Textarea
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Enter or edit meeting summary"
                className="min-h-[200px]"
                disabled={isSaving}
              />
            </TabsContent>

            <TabsContent value="transcript" className="mt-4 space-y-2">
              <label htmlFor="transcript" className="text-sm font-medium">
                Meeting Transcript
              </label>
              <Textarea
                id="transcript"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Enter or edit meeting transcript"
                className="min-h-[200px] font-mono text-sm"
                disabled={isSaving}
              />
            </TabsContent>

            <TabsContent value="insights" className="mt-4 space-y-4">
              {insights.map((category) => {
                if (category.type === "emotions" && category.data.length > 0) {
                  return (
                    <div key={category.type} className="border rounded-md p-4">
                      <h3 className="font-medium mb-3 text-indigo-400">Client Emotions</h3>
                      <div className="space-y-2">
                        {category.data.map((item: { emotion: string; level: number }, index: number) => (
                          <div key={index} className="mb-2">
                            <div className="flex justify-between mb-1">
                              <span>{item.emotion}</span>
                              <span>{item.level}%</span>
                            </div>
                            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                                style={{ width: `${item.level}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                const categoryTitles: Record<string, { title: string; color: string }> = {
                  painPoints: { title: "Pain Points", color: "text-red-400" },
                  objections: { title: "Potential Objections", color: "text-amber-400" },
                  recommendations: { title: "Focus Next", color: "text-emerald-400" },
                  nextActions: { title: "Next Actions", color: "text-blue-400" },
                };

                const categoryInfo = categoryTitles[category.type];
                if (!categoryInfo || category.data.length === 0) return null;

                return (
                  <div key={category.type} className="border rounded-md p-4">
                    <h3 className={`font-medium mb-3 ${categoryInfo.color}`}>{categoryInfo.title}</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {category.data.map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="relative"
          >
            {isSaving ? "Saving..." : "Save Meeting"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MeetingEndDialog;
