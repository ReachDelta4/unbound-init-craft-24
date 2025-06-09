import React, { createContext, useContext, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Meeting } from "@/types";
import { createMeeting as createMeetingAPI, endMeeting as endMeetingAPI, getMeeting as getMeetingAPI, updateMeeting as updateMeetingAPI } from "@/lib/api";

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
  isCallActive: boolean; // Add this missing property
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

const initialState: Meeting = {
  id: "",
  userId: "",
  title: "Untitled Meeting",
  startTime: new Date(),
  endTime: new Date(),
  transcript: "",
  summary: "",
  insights: [],
  platform: "Unknown",
  status: "inactive",
  createdAt: new Date(),
  updatedAt: new Date(),
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
      const newMeeting = await createMeetingAPI({
        userId: user.id,
        title: "Untitled Meeting",
        startTime: new Date(),
        platform: platform,
        status: "active",
      });

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
      const endTime = new Date();
      await endMeetingAPI(activeMeeting.id, {
        endTime: endTime,
        transcript: transcript,
        summary: summary,
        insights: insights,
        status: "completed",
      });

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
      await updateMeetingAPI(meetingId, updates);
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
      const meeting = await getMeetingAPI(meetingId);
      setActiveMeeting(meeting);
      return meeting;
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
    isCallActive: !!(activeMeeting && activeMeeting.status === 'active'), // Add this computed property
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
