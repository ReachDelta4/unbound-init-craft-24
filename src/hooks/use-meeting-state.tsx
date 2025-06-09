
import React, { createContext, useContext, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Meeting } from "@/hooks/meetings/types";
import { createMeeting, updateMeetingInDb, completeMeeting, insertMeetingInsights, getMeetingWithInsights } from "@/hooks/meetings/meetings-db";

interface InsightData {
  type: string;
  data: any[];
}

export interface MeetingStateContextProps {
  activeMeeting: Meeting | null;
  isCreatingMeeting: boolean;
  isSavingMeeting: boolean;
  savingProgress: number;
  lastSaved: Date | null;
  callStartTime: number;
  isCallActive: boolean;
  startMeeting: (platform: string) => Promise<void>;
  endMeeting: (transcript: string, summary: string, insights: InsightData[]) => Promise<string | null>;
  updateMeeting: (meetingId: string, updates: Partial<Meeting>) => Promise<void>;
  getMeeting: (meetingId: string) => Promise<Meeting>;
  setActiveMeeting: React.Dispatch<React.SetStateAction<Meeting | null>>;
  setCallStartTime: React.Dispatch<React.SetStateAction<number>>;
}

const MeetingStateContext = createContext<MeetingStateContextProps | undefined>(undefined);

export const useMeetingState = () => {
  const context = useContext(MeetingStateContext);
  if (!context) {
    throw new Error("useMeetingState must be used within a MeetingStateProvider");
  }
  return context;
};

export const MeetingStateProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);
  const [isSavingMeeting, setIsSavingMeeting] = useState(false);
  const [savingProgress, setSavingProgress] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [callStartTime, setCallStartTime] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  const startMeeting = useCallback(async (platform: string) => {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "You must be signed in to start a meeting.",
      });
      return;
    }

    setIsCreatingMeeting(true);
    try {
      const newMeeting = await createMeeting(user.id, platform);
      setActiveMeeting(newMeeting);
      setCallStartTime(Date.now());
      toast({
        title: "Meeting started",
        description: "A new meeting has been started.",
      });
    } catch (error) {
      console.error("Error starting meeting:", error);
      toast({
        title: "Failed to start meeting",
        description: "There was a problem starting the meeting. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingMeeting(false);
    }
  }, [user, toast]);

  const endMeeting = useCallback(async (transcript: string, summary: string, insights: InsightData[]): Promise<string | null> => {
    if (!activeMeeting || !user) {
      toast({
        title: "No active meeting",
        description: "No active meeting found to end.",
      });
      return null;
    }

    setIsSavingMeeting(true);
    setSavingProgress(50);

    try {
      // Complete the meeting with transcript and summary
      await completeMeeting(activeMeeting.id, transcript, summary);
      
      // Insert insights if any
      if (insights && insights.length > 0) {
        await insertMeetingInsights(activeMeeting.id, insights);
      }

      setLastSaved(new Date());
      setSavingProgress(100);
      return activeMeeting.id;
    } catch (error) {
      console.error("Error ending meeting:", error);
      toast({
        title: "Failed to end meeting",
        description: "There was a problem ending the meeting. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSavingMeeting(false);
      setSavingProgress(0);
    }
  }, [activeMeeting, user, toast]);

  const updateMeeting = useCallback(async (meetingId: string, updates: Partial<Meeting>) => {
    try {
      await updateMeetingInDb(meetingId, updates);
      setActiveMeeting((prev) => {
        if (prev && prev.id === meetingId) {
          return { ...prev, ...updates };
        }
        return prev;
      });
      toast({
        title: "Meeting updated",
        description: "The meeting has been successfully updated.",
      });
    } catch (error) {
      console.error("Error updating meeting:", error);
      toast({
        title: "Failed to update meeting",
        description: "There was a problem updating the meeting. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const getMeeting = useCallback(async (meetingId: string) => {
    try {
      const { meeting } = await getMeetingWithInsights(meetingId);
      if (meeting) {
        setActiveMeeting(meeting);
        return meeting;
      }
      throw new Error("Meeting not found");
    } catch (error) {
      console.error("Error getting meeting:", error);
      toast({
        title: "Failed to get meeting",
        description: "There was a problem getting the meeting. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const value: MeetingStateContextProps = {
    activeMeeting,
    isCreatingMeeting,
    isSavingMeeting,
    savingProgress,
    lastSaved,
    callStartTime,
    isCallActive: !!(activeMeeting && activeMeeting.status === 'active'),
    startMeeting,
    endMeeting,
    updateMeeting,
    getMeeting,
    setActiveMeeting,
    setCallStartTime
  };

  return (
    <MeetingStateContext.Provider value={value}>
      {children}
    </MeetingStateContext.Provider>
  );
};

export default MeetingStateProvider;
