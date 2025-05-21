
import React, { useState } from "react";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Search, Video, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-mobile";

interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  platform: string;
  participants: string[];
  transcript: string;
  summary: string;
  emotions: { emotion: string; level: number }[];
  painPoints: string[];
  objections: string[];
  recommendations: string[];
  nextActions: string[];
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
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Sample meeting data (this would typically come from your database)
  const meetings: Meeting[] = [
    {
      id: "1",
      title: "Sales Call with Acme Corp",
      date: "May 18, 2025",
      time: "10:30 AM - 11:30 AM",
      platform: "Zoom",
      participants: ["John Doe", "Jane Smith", "Mark Johnson"],
      transcript: "You: Hello, thanks for joining the call today. How are you doing?\n\nClient: I'm doing well, thank you for asking. I'm excited to discuss your product and see if it fits our needs.\n\nYou: That's great to hear. I'd love to understand your current challenges and how we might be able to address them.\n\nClient: Well, our main issue is increasing productivity while keeping our costs manageable. Our team is growing but our tools aren't scaling well.",
      summary: "Acme Corp is looking for a solution to improve productivity as they scale their team. They're concerned about cost management and integration with existing tools.",
      emotions: [
        { emotion: "Interest", level: 80 },
        { emotion: "Concern", level: 40 },
        { emotion: "Enthusiasm", level: 65 },
        { emotion: "Skepticism", level: 30 },
      ],
      painPoints: [
        "Integration issues between existing tools",
        "Team communication challenges",
        "Cost management with current solutions",
        "Scalability concerns for growing team"
      ],
      objections: [
        "Budget constraints this quarter",
        "Concerned about implementation time",
        "Questions about technical support availability"
      ],
      recommendations: [
        "Highlight how our integration reduces total cost of ownership",
        "Address implementation timeline - emphasize quick onboarding",
        "Discuss the dedicated support team availability",
        "Demonstrate scalability features for growing teams"
      ],
      nextActions: [
        "Send pricing proposal by Friday",
        "Schedule technical demo with their IT team",
        "Share case studies of similar-sized companies"
      ]
    },
    {
      id: "2",
      title: "Product Demo for XYZ Inc.",
      date: "May 15, 2025",
      time: "2:00 PM - 3:00 PM",
      platform: "Microsoft Teams",
      participants: ["Jane Smith", "Robert Williams"],
      transcript: "You: Welcome to today's product demo. I'm excited to show you how our solution works.\n\nClient: Thanks for taking the time. We're particularly interested in seeing the reporting features.\n\nYou: Absolutely, I'll make sure to focus on those areas. Let's start with an overview and then dive into the reporting modules.",
      summary: "XYZ Inc. is primarily interested in the reporting capabilities of our platform. They seem to have a good understanding of the basics but want to see advanced features.",
      emotions: [
        { emotion: "Interest", level: 90 },
        { emotion: "Curiosity", level: 75 },
        { emotion: "Engagement", level: 85 }
      ],
      painPoints: [
        "Current reporting is too limited",
        "Difficulty extracting actionable insights",
        "Time-consuming manual data analysis"
      ],
      objections: [
        "Concerns about learning curve",
        "Questions about customization options"
      ],
      recommendations: [
        "Emphasize automated reporting features",
        "Show custom dashboard creation",
        "Highlight data export options"
      ],
      nextActions: [
        "Send recording of the demo",
        "Schedule follow-up call with their data team",
        "Prepare custom report examples"
      ]
    },
    {
      id: "3",
      title: "Follow-up with Global Solutions",
      date: "May 10, 2025",
      time: "9:00 AM - 9:30 AM",
      platform: "Google Meet",
      participants: ["John Doe", "David Miller"],
      transcript: "You: Thanks for connecting again. I wanted to follow up on our previous conversation.\n\nClient: Yes, we've had some internal discussions about your proposal. We have a few more questions.\n\nYou: I'm happy to address any questions you have. What would you like to know more about?",
      summary: "Global Solutions has reviewed our proposal and has additional questions. They seem interested but are being thorough in their evaluation process.",
      emotions: [
        { emotion: "Deliberation", level: 70 },
        { emotion: "Interest", level: 60 },
        { emotion: "Caution", level: 50 }
      ],
      painPoints: [
        "Long decision-making process",
        "Difficulty getting stakeholder alignment",
        "Complex technical requirements"
      ],
      objections: [
        "Concerns about seamless transition",
        "Questions about ongoing support"
      ],
      recommendations: [
        "Provide clear implementation roadmap",
        "Introduce support team structure",
        "Offer phased approach to minimize disruption"
      ],
      nextActions: [
        "Send detailed support SLA",
        "Arrange call with technical architect",
        "Prepare ROI analysis based on their data"
      ]
    }
  ];

  // Filter meetings based on search term
  const filteredMeetings = meetings.filter(meeting => 
    meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    meeting.participants.some(p => p.toLowerCase().includes(searchTerm.toLowerCase())) ||
    meeting.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
    meeting.platform.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewDetails = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setEditedTranscript(meeting.transcript);
    setEditedSummary(meeting.summary);
  };

  const handleSaveChanges = () => {
    if (!selectedMeeting) return;
    
    setIsSaving(true);
    
    // In a real app, you would save these changes to your database
    setTimeout(() => {
      // Update the meetings array with edited content
      const updatedMeetings = meetings.map(meeting => 
        meeting.id === selectedMeeting.id 
          ? { ...meeting, transcript: editedTranscript, summary: editedSummary } 
          : meeting
      );
      
      // Find the updated meeting
      const updatedMeeting = updatedMeetings.find(m => m.id === selectedMeeting.id);
      if (updatedMeeting) {
        setSelectedMeeting(updatedMeeting);
      }
      
      setIsSaving(false);
    }, 500);
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
            <span>{selectedMeeting?.date}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{selectedMeeting?.time}</span>
          </div>
          <div className="flex items-center gap-1">
            <Video className="h-4 w-4" />
            <span>{selectedMeeting?.platform}</span>
          </div>
        </div>
        <div className="text-sm">
          <p><span className="font-medium">Participants:</span> {selectedMeeting?.participants.join(", ")}</p>
        </div>
      </div>

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
          <div className="border rounded-lg p-4">
            <h5 className="font-medium mb-3 text-indigo-400">Client Emotions</h5>
            <div className="space-y-2">
              {selectedMeeting?.emotions.map((item, index) => (
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

          {/* Pain Points */}
          <div className="border rounded-lg p-4">
            <h5 className="font-medium mb-3 text-red-400">Pain Points</h5>
            <ul className="list-disc pl-5 space-y-1">
              {selectedMeeting?.painPoints.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </div>

          {/* Objections */}
          <div className="border rounded-lg p-4">
            <h5 className="font-medium mb-3 text-amber-400">Potential Objections</h5>
            <ul className="list-disc pl-5 space-y-1">
              {selectedMeeting?.objections.map((objection, index) => (
                <li key={index}>{objection}</li>
              ))}
            </ul>
          </div>

          {/* Recommendations */}
          <div className="border rounded-lg p-4">
            <h5 className="font-medium mb-3 text-emerald-400">Focus Next</h5>
            <ul className="list-disc pl-5 space-y-1">
              {selectedMeeting?.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>
          
          {/* Next Actions */}
          <div className="border rounded-lg p-4">
            <h5 className="font-medium mb-3 text-blue-400">Next Actions</h5>
            <ul className="list-disc pl-5 space-y-1">
              {selectedMeeting?.nextActions.map((action, index) => (
                <li key={index}>{action}</li>
              ))}
            </ul>
          </div>
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
              {filteredMeetings.length > 0 ? (
                filteredMeetings.map((meeting) => (
                  <div key={meeting.id} className="bg-muted p-4 rounded-lg space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{meeting.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Calendar className="h-4 w-4" />
                          <span>{meeting.date}</span>
                          <Clock className="h-4 w-4 ml-2" />
                          <span>{meeting.time}</span>
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
                    <div className="text-sm mt-2">
                      <p className="text-muted-foreground">
                        Participants: {meeting.participants.join(", ")}
                      </p>
                    </div>
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

      {/* Meeting Details Side Panel - Uses Sheet for desktop and Drawer for mobile */}
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
