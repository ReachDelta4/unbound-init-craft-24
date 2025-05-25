import React, { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Search, Video, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { getUserMeetings } from "@/hooks/meetings/meetings-db";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface Meeting {
  id: string;
  title: string;
  date: string;
  time?: string;
  platform: string | null;
  participants?: string[];
  transcript: string | null;
  summary: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  emotions: { emotion: string; level: number }[];
  painPoints: string[];
  objections: string[];
  recommendations: string[];
  nextActions: string[];
  checklist?: any[];
  notes?: string;
  questions?: any[];
}

interface MeetingHistoryTabProps {
  user: User;
}

const MeetingHistoryTab: React.FC<MeetingHistoryTabProps> = ({ user }) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [editedTranscript, setEditedTranscript] = useState<string>("");
  const [editedSummary, setEditedSummary] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  // Fetch meetings when component mounts
  useEffect(() => {
    const loadMeetings = async () => {
      try {
        setIsLoading(true);
        const data = await getUserMeetings(user.id);
        setMeetings(data);
      } catch (error) {
        console.error('Error loading meetings:', error);
        toast({
          title: "Failed to load meetings",
          description: "There was an error loading your meeting history.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadMeetings();
  }, [user.id, toast]);

  // Filter meetings based on search term
  const filteredMeetings = meetings.filter(meeting => 
    meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (meeting.participants?.some(p => p.toLowerCase().includes(searchTerm.toLowerCase())) || false) ||
    meeting.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (meeting.platform?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
  );

  const handleViewDetails = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setEditedTranscript(meeting.transcript || "");
    setEditedSummary(meeting.summary || "");
  };

  const handleSaveChanges = async () => {
    if (!selectedMeeting) return;
    
    setIsSaving(true);
    
    try {
      // Update the meeting in the database
      const { error } = await supabase
        .from('meetings')
        .update({
          transcript: editedTranscript,
          summary: editedSummary,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedMeeting.id);
      
      if (error) throw error;
      
      // Update local state
      const updatedMeetings = meetings.map(meeting => 
        meeting.id === selectedMeeting.id 
          ? { ...meeting, transcript: editedTranscript, summary: editedSummary } 
          : meeting
      );
      
      setMeetings(updatedMeetings);
      
      // Find the updated meeting
      const updatedMeeting = updatedMeetings.find(m => m.id === selectedMeeting.id);
      if (updatedMeeting) {
        setSelectedMeeting(updatedMeeting);
      }
      
      toast({
        title: "Changes saved",
        description: "Your meeting details have been updated.",
      });
    } catch (error) {
      console.error('Error saving changes:', error);
      toast({
        title: "Failed to save changes",
        description: "There was an error updating the meeting details.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderMeetingDetailsContent = () => (
    <div className="overflow-y-auto h-full space-y-6">
      {/* Meeting Basic Info */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">{selectedMeeting?.title}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(selectedMeeting?.date || ""), "MMMM d, yyyy")}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{format(new Date(selectedMeeting?.date || ""), "h:mm a")}</span>
          </div>
          <div className="flex items-center gap-1">
            <Video className="h-4 w-4" />
            <span>{selectedMeeting?.platform}</span>
          </div>
        </div>
        {selectedMeeting?.participants && selectedMeeting.participants.length > 0 && (
        <div className="text-sm">
            <p><span className="font-medium">Participants:</span> {selectedMeeting.participants.join(", ")}</p>
        </div>
        )}
      </div>

      {/* Checklist Section */}
      {selectedMeeting?.checklist && selectedMeeting.checklist.length > 0 && (
        <div className="border rounded-md p-4">
          <h4 className="text-md font-medium mb-2">Checklist</h4>
          <ul className="list-disc pl-5 space-y-1">
            {selectedMeeting.checklist.map((item: any, idx: number) => (
              <li key={item.id || idx} className={item.completed ? 'line-through text-muted-foreground' : ''}>
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Questions Section */}
      {selectedMeeting?.questions && selectedMeeting.questions.length > 0 && (
        <div className="border rounded-md p-4">
          <h4 className="text-md font-medium mb-2">Key Questions</h4>
          <ul className="list-disc pl-5 space-y-1">
            {selectedMeeting.questions.map((q: any, idx: number) => (
              <li key={q.id || idx}>{q.text}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Notes Section */}
      {selectedMeeting?.notes && (
        <div className="border rounded-md p-4">
          <h4 className="text-md font-medium mb-2">Notes</h4>
          <div className="whitespace-pre-line text-sm">{selectedMeeting.notes}</div>
        </div>
      )}

      {/* Summary Section - Editable */}
      <div className="border rounded-md p-4">
        <h4 className="text-md font-medium mb-2">Meeting Summary</h4>
        <Textarea 
          value={editedSummary} 
          onChange={(e) => setEditedSummary(e.target.value)}
          className="min-h-[100px]"
        />
      </div>

      {/* AI Insights Grid */}
      <div className="space-y-4">
        <h4 className="text-md font-medium">AI Insights</h4>
        
        <div className="grid grid-cols-1 gap-4">
          {/* Emotion Analysis */}
          {selectedMeeting?.emotions && selectedMeeting.emotions.length > 0 && (
          <div className="border rounded-lg p-4">
            <h5 className="font-medium mb-3 text-indigo-400">Client Emotions</h5>
            <div className="space-y-2">
                {selectedMeeting.emotions.map((item, index) => (
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
          )}

          {/* Pain Points */}
          {selectedMeeting?.painPoints && selectedMeeting.painPoints.length > 0 && (
          <div className="border rounded-lg p-4">
            <h5 className="font-medium mb-3 text-red-400">Pain Points</h5>
            <ul className="list-disc pl-5 space-y-1">
                {selectedMeeting.painPoints.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </div>
          )}

          {/* Objections */}
          {selectedMeeting?.objections && selectedMeeting.objections.length > 0 && (
          <div className="border rounded-lg p-4">
            <h5 className="font-medium mb-3 text-amber-400">Potential Objections</h5>
            <ul className="list-disc pl-5 space-y-1">
                {selectedMeeting.objections.map((objection, index) => (
                <li key={index}>{objection}</li>
              ))}
            </ul>
          </div>
          )}

          {/* Recommendations */}
          {selectedMeeting?.recommendations && selectedMeeting.recommendations.length > 0 && (
          <div className="border rounded-lg p-4">
            <h5 className="font-medium mb-3 text-emerald-400">Focus Next</h5>
            <ul className="list-disc pl-5 space-y-1">
                {selectedMeeting.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>
          )}
          
          {/* Next Actions */}
          {selectedMeeting?.nextActions && selectedMeeting.nextActions.length > 0 && (
          <div className="border rounded-lg p-4">
            <h5 className="font-medium mb-3 text-blue-400">Next Actions</h5>
            <ul className="list-disc pl-5 space-y-1">
                {selectedMeeting.nextActions.map((action, index) => (
                <li key={index}>{action}</li>
              ))}
            </ul>
          </div>
          )}
        </div>
      </div>

      {/* Transcript Section - Editable */}
      <div className="border rounded-md p-4">
        <h4 className="text-md font-medium mb-2">Meeting Transcript</h4>
        <Textarea 
          value={editedTranscript} 
          onChange={(e) => setEditedTranscript(e.target.value)}
          className="min-h-[300px] font-mono text-sm"
        />
      </div>

      {/* Save Button */}
      <div className="sticky bottom-0 bg-background pt-2 pb-6">
        <Button 
          onClick={handleSaveChanges} 
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Meeting History</CardTitle>
          <CardDescription>View and search your past meetings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search meetings" 
                  className="pl-8" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline">Filter</Button>
            </div>
            
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center p-8 text-muted-foreground">
                  Loading meetings...
                </div>
              ) : filteredMeetings.length > 0 ? (
                filteredMeetings.map((meeting) => (
                  <div key={meeting.id} className="bg-muted p-4 rounded-lg space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{meeting.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(meeting.date), "MMMM d, yyyy")}</span>
                          <Clock className="h-4 w-4 ml-2" />
                          <span>{format(new Date(meeting.date), "h:mm a")}</span>
                          <Video className="h-4 w-4 ml-2" />
                          <span>{meeting.platform}</span>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDetails(meeting)}
                      >
                        View Details
                      </Button>
                    </div>
                    {meeting.participants && meeting.participants.length > 0 && (
                    <div className="text-sm mt-2">
                      <p className="text-muted-foreground">
                        Participants: {meeting.participants.join(", ")}
                      </p>
                    </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  No meetings found matching your search.
                </div>
              )}
            </div>
            
            {filteredMeetings.length > 0 && (
              <div className="flex justify-center">
                <Button variant="outline">Load More</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {isMobile ? (
        <Drawer open={!!selectedMeeting} onOpenChange={() => selectedMeeting && setSelectedMeeting(null)}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Meeting Details</DrawerTitle>
              <DrawerDescription>View and edit meeting information</DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-6">
              {selectedMeeting && renderMeetingDetailsContent()}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Sheet open={!!selectedMeeting} onOpenChange={() => selectedMeeting && setSelectedMeeting(null)}>
          <SheetContent className="w-[40%] sm:max-w-none overflow-y-auto">
            <SheetHeader className="mb-4">
              <SheetTitle>Meeting Details</SheetTitle>
              <SheetDescription>View and edit meeting information</SheetDescription>
            </SheetHeader>
            {selectedMeeting && renderMeetingDetailsContent()}
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
};

export default MeetingHistoryTab;
