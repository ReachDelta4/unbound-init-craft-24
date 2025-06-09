import React, { useState, useEffect, useRef } from "react";
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
  const [autoSaveAttempted, setAutoSaveAttempted] = useState(false);
  const dataRef = useRef({ title, transcript, summary });

  // Keep ref updated with latest data for auto-save
  useEffect(() => {
    dataRef.current = { title, transcript, summary };
  }, [title, transcript, summary]);

  useEffect(() => {
    if (isOpen) {
      setTitle("New Meeting");
      // Make sure we're using the actual transcript, not placeholder
      setTranscript(initialTranscript || "");
      setSummary(initialSummary);
      setInternalProgress(0);
      setAutoSaveAttempted(false);
    }
  }, [isOpen, initialTranscript, initialSummary]);

  // Auto-save on page exit if dialog is open
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isOpen && !autoSaveAttempted) {
        e.preventDefault();
        e.returnValue = "You have unsaved meeting data. Are you sure you want to leave?";
        
        // Try to auto-save - but can't await in beforeunload
        setAutoSaveAttempted(true);
        try {
          const { title: currentTitle, transcript: currentTranscript, summary: currentSummary } = dataRef.current;
          
          // Store current data in localStorage for recovery
          const emergencyData = {
            title: currentTitle,
            transcript: currentTranscript,
            summary: currentSummary,
            timestamp: new Date().toISOString()
          };
          localStorage.setItem('meeting_end_dialog_data', JSON.stringify(emergencyData));
          
          // Use setTimeout to ensure this runs after the beforeunload handling
          setTimeout(() => {
            onSave(currentTitle, currentTranscript, currentSummary)
              .then(() => {
                // Clear emergency data if save succeeds
                localStorage.removeItem('meeting_end_dialog_data');
              })
              .catch(error => console.error("Auto-save failed:", error));
          }, 0);
        } catch (error) {
          console.error("Auto-save setup failed:", error);
        }
        
        return e.returnValue;
      }
    };
    
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isOpen, onSave, autoSaveAttempted]);

  // Check for emergency data when dialog opens
  useEffect(() => {
    if (isOpen) {
      try {
        const savedData = localStorage.getItem('meeting_end_dialog_data');
        if (savedData) {
          const data = JSON.parse(savedData);
          
          // Only restore if the data is less than 1 hour old
          const savedTime = new Date(data.timestamp).getTime();
          const currentTime = new Date().getTime();
          const oneHour = 60 * 60 * 1000;
          
          if (currentTime - savedTime < oneHour) {
            // Ask user if they want to restore
            if (window.confirm('We found unsaved meeting data. Would you like to restore it?')) {
              setTitle(data.title || "New Meeting");
              setTranscript(data.transcript || initialTranscript || "");
              setSummary(data.summary || initialSummary || "");
              toast({
                title: "Data restored",
                description: "Your unsaved meeting data has been restored."
              });
            }
          }
          
          // Clear the saved data regardless of whether it was used
          localStorage.removeItem('meeting_end_dialog_data');
        }
      } catch (error) {
        console.error("Failed to restore emergency data:", error);
      }
    }
  }, [isOpen, initialTranscript, initialSummary, toast]);

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
          // Only close after successful save
          onClose();
        }, 500);
      }
    }
  }, [saveProgress, toast, onClose]);

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
            onClose();
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
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        // Allow dialog to be closed if not saving
        if (!open && !isSaving) {
          onClose();
        }
      }}
    >
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

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline"
            onClick={onClose} 
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            Discard
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            {isSaving ? "Saving..." : "Save Meeting"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MeetingEndDialog;
