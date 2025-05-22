
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
}

const MeetingEndDialog = ({
  isOpen,
  onClose,
  onSave,
  transcript: initialTranscript,
  summary: initialSummary,
  insights
}: MeetingEndDialogProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("summary");
  const [title, setTitle] = useState("New Meeting");
  const [transcript, setTranscript] = useState(initialTranscript);
  const [summary, setSummary] = useState(initialSummary);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle("New Meeting");
      setTranscript(initialTranscript);
      setSummary(initialSummary);
    }
  }, [isOpen, initialTranscript, initialSummary]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const savePromise = onSave(title, transcript, summary);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Save timeout')), 5000)
      );
      
      await Promise.race([savePromise, timeoutPromise]);
      toast({
        title: "Meeting saved",
        description: "Your meeting has been successfully saved.",
      });
    } catch (error) {
      console.error("Error saving meeting:", error);
      toast({
        title: "Failed to save meeting",
        description: "There was an error saving your meeting.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Save Meeting</DialogTitle>
          <DialogDescription>
            Review and edit your meeting details before saving.
          </DialogDescription>
        </DialogHeader>

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
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="summary" className="flex-1">
                Summary
              </TabsTrigger>
              <TabsTrigger value="transcript" className="flex-1">
                Transcript
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex-1">
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
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Meeting"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MeetingEndDialog;
