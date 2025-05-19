
import React from "react";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Search, Video } from "lucide-react";

interface MeetingHistoryTabProps {
  user: User;
}

const MeetingHistoryTab: React.FC<MeetingHistoryTabProps> = ({ user }) => {
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
                <Input placeholder="Search meetings" className="pl-8" />
              </div>
              <Button variant="outline">Filter</Button>
            </div>
            
            <div className="space-y-4">
              {/* Meeting list */}
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">Sales Call with Acme Corp</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Calendar className="h-4 w-4" />
                      <span>May 18, 2025</span>
                      <Clock className="h-4 w-4 ml-2" />
                      <span>10:30 AM - 11:30 AM</span>
                      <Video className="h-4 w-4 ml-2" />
                      <span>Zoom</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">View Details</Button>
                </div>
                <div className="text-sm mt-2">
                  <p className="text-muted-foreground">Participants: John Doe, Jane Smith, Mark Johnson</p>
                </div>
              </div>
              
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">Product Demo for XYZ Inc.</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Calendar className="h-4 w-4" />
                      <span>May 15, 2025</span>
                      <Clock className="h-4 w-4 ml-2" />
                      <span>2:00 PM - 3:00 PM</span>
                      <Video className="h-4 w-4 ml-2" />
                      <span>Microsoft Teams</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">View Details</Button>
                </div>
                <div className="text-sm mt-2">
                  <p className="text-muted-foreground">Participants: Jane Smith, Robert Williams</p>
                </div>
              </div>
              
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">Follow-up with Global Solutions</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Calendar className="h-4 w-4" />
                      <span>May 10, 2025</span>
                      <Clock className="h-4 w-4 ml-2" />
                      <span>9:00 AM - 9:30 AM</span>
                      <Video className="h-4 w-4 ml-2" />
                      <span>Google Meet</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">View Details</Button>
                </div>
                <div className="text-sm mt-2">
                  <p className="text-muted-foreground">Participants: John Doe, David Miller</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center">
              <Button variant="outline">Load More</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MeetingHistoryTab;
