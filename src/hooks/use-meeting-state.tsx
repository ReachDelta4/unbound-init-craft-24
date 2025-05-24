
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Meeting, MeetingInsight } from "./meetings/types";
import { 
  createMeeting, 
  updateMeetingInDb, 
  completeMeeting, 
  insertMeetingInsights,
  getMeetingWithInsights
} from "./meetings/meetings-db";

// Fix the TS1205 error by using 'export type'
export type { Meeting, MeetingInsight } from "./meetings/types";
export type { MeetingNote } from "./meetings/types";

export const useMeetingState = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);
  const [isSavingMeeting, setIsSavingMeeting] = useState(false);
  const [savingProgress, setSavingProgress] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Create a new meeting when a call starts - optimized for speed
  const startMeeting = async (platform: string) => {
    if (!user) return null;
    
    try {
      // Optimistically update UI state first
      setIsCreatingMeeting(true);
      
      // Create optimistic local meeting object
      const optimisticMeeting = {
        id: `temp-${Date.now()}`,
        user_id: user.id,
        title: "New Meeting",
        platform,
        date: new Date().toISOString(),
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        transcript: null,
        summary: null
      } as Meeting;
      
      // Update state immediately for responsive UI
      setActiveMeeting(optimisticMeeting);
      
      // Create meeting in database (non-blocking)
      const createMeetingPromise = new Promise<Meeting | null>(async (resolve) => {
        try {
          const meetingData = await createMeeting(user.id, platform);
          
          // Update with real data once available
          setActiveMeeting(meetingData);
          resolve(meetingData);
        } catch (error) {
          console.error('Error starting meeting:', error);
          toast({
            title: "Meeting started with sync issues",
            description: "Your meeting is active but there was an issue syncing. We'll try again later.",
            variant: "default",
          });
          resolve(null);
        } finally {
          setIsCreatingMeeting(false);
        }
      });

      // Don't block UI thread waiting for this
      createMeetingPromise.catch(console.error);
      
      return optimisticMeeting;
    } catch (error) {
      console.error('Error in startMeeting:', error);
      setIsCreatingMeeting(false);
      toast({
        title: "Failed to start meeting",
        description: "There was an error creating the meeting record.",
        variant: "destructive",
      });
      return null;
    }
  };

  // End the active meeting with truly parallel operations and timeout protection
  const endMeeting = async (transcript: string, summary: string, insights: any[]) => {
    if (!activeMeeting || !user) return null;
    
    try {
      setIsSavingMeeting(true);
      setSavingProgress(10);
      
      const meetingId = activeMeeting.id.startsWith('temp-') ? null : activeMeeting.id;
      
      // If we don't have a real meeting ID yet, create the meeting first
      if (!meetingId) {
        const meetingData = await Promise.race([
          createMeeting(user.id, activeMeeting.platform || ''),
          // Add timeout protection (5s)
          new Promise<any>((_, reject) => 
            setTimeout(() => reject(new Error('Meeting creation timeout')), 5000)
          )
        ]);
        
        setSavingProgress(50);
        
        // Now handle insights in parallel with true Promise.all
        if (insights && insights.length > 0) {
          await Promise.race([
            insertMeetingInsights(meetingData.id, insights),
            // Add timeout protection (5s)
            new Promise<any>((_, reject) => 
              setTimeout(() => reject(new Error('Insights creation timeout')), 5000)
            )
          ]);
        }
        
        setSavingProgress(100);
        setLastSaved(new Date());
        return meetingData.id;
      }
      
      // For existing meetings, run operations in parallel with true Promise.all
      setSavingProgress(20);
      
      // Use Promise.all for true parallelism with timeout protection
      await Promise.race([
        Promise.all([
          completeMeeting(meetingId, transcript, summary),
          insertMeetingInsights(meetingId, insights)
        ]),
        // Add timeout protection (10s)
        new Promise<any>((_, reject) => 
          setTimeout(() => reject(new Error('Meeting completion timeout')), 10000)
        )
      ]);
      
      setSavingProgress(100);
      setLastSaved(new Date());
      return meetingId;
    } catch (error) {
      console.error('Error ending meeting:', error);
      toast({
        title: "Failed to save meeting",
        description: "There was an error updating the meeting record.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSavingMeeting(false);
      setActiveMeeting(null);
      setSavingProgress(0);
    }
  };

  // Update meeting details
  const updateMeeting = async (meetingId: string, data: Partial<Meeting>) => {
    try {
      await updateMeetingInDb(meetingId, data);
      return true;
    } catch (error) {
      console.error('Error updating meeting:', error);
      toast({
        title: "Failed to update meeting",
        description: "There was an error updating the meeting record.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Get meeting by ID
  const getMeeting = async (meetingId: string) => {
    return getMeetingWithInsights(meetingId);
  };
  
  return {
    activeMeeting,
    isCreatingMeeting,
    isSavingMeeting, 
    savingProgress,
    lastSaved,
    startMeeting,
    endMeeting,
    updateMeeting,
    getMeeting
  };
};
