import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
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

interface MeetingStateContextProps {
  activeMeeting: Meeting | null;
  isCreatingMeeting: boolean;
  isSavingMeeting: boolean;
  savingProgress: number;
  lastSaved: Date | null;
  callStartTime: number | null;
  startMeeting: (platform: string) => Promise<Meeting | null>;
  endMeeting: (transcript: string, summary: string, insights: any[]) => Promise<string | null>;
  updateMeeting: (meetingId: string, data: Partial<Meeting>) => Promise<boolean>;
  getMeeting: (meetingId: string) => Promise<Meeting | null>;
  setActiveMeeting: React.Dispatch<React.SetStateAction<Meeting | null>>;
  setCallStartTime: React.Dispatch<React.SetStateAction<number | null>>;
}

const MeetingStateContext = createContext<MeetingStateContextProps | undefined>(undefined);

export const MeetingStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);
  const [isSavingMeeting, setIsSavingMeeting] = useState(false);
  const [savingProgress, setSavingProgress] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [callStartTime, setCallStartTime] = useState<number | null>(null);

  // Persist meeting state and callStartTime to localStorage
  useEffect(() => {
    if (activeMeeting) {
      localStorage.setItem("activeMeeting", JSON.stringify(activeMeeting));
    } else {
      localStorage.removeItem("activeMeeting");
    }
    if (callStartTime) {
      localStorage.setItem("callStartTime", callStartTime.toString());
    } else {
      localStorage.removeItem("callStartTime");
    }
  }, [activeMeeting, callStartTime]);

  // Restore meeting state and callStartTime from localStorage on mount
  useEffect(() => {
    // This effect restores meeting state from localStorage, handling corrupted data gracefully.
    const stored = localStorage.getItem("activeMeeting");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setActiveMeeting(parsed);
      } catch (err) {
        // If parsing fails, clear corrupted localStorage and notify user
        localStorage.removeItem("activeMeeting");
        setActiveMeeting(null);
        toast && toast({
          title: "Corrupted meeting data",
          description: "Active meeting data could not be loaded and was reset.",
          variant: "destructive",
        });
      }
    }
    const storedStart = localStorage.getItem("callStartTime");
    if (storedStart) {
      const parsedStart = Number(storedStart);
      if (!isNaN(parsedStart)) {
        setCallStartTime(parsedStart);
      } else {
        localStorage.removeItem("callStartTime");
        setCallStartTime(null);
        toast && toast({
          title: "Corrupted call start time",
          description: "Call start time could not be loaded and was reset.",
          variant: "destructive",
        });
      }
    }
  }, []);

  // Create a new meeting when a call starts
  const startMeeting = useCallback(async (platform: string) => {
    if (!user) return null;
    try {
      setIsCreatingMeeting(true);
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
      setActiveMeeting(optimisticMeeting);
      setCallStartTime(Date.now());
      const createMeetingPromise = new Promise<Meeting | null>(async (resolve) => {
        try {
          const meetingData = await createMeeting(user.id, platform);
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
  }, [user, toast]);

  // End the active meeting
  const endMeeting = useCallback(async (transcript: string, summary: string, insights: any[]) => {
    if (!activeMeeting || !user) return null;
    try {
      setIsSavingMeeting(true);
      setSavingProgress(10);
      const meetingId = activeMeeting.id.startsWith('temp-') ? null : activeMeeting.id;
      if (!meetingId) {
        const meetingData = await Promise.race([
          createMeeting(user.id, activeMeeting.platform || ''),
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Meeting creation timeout')), 5000))
        ]);
        setSavingProgress(50);
        if (insights && insights.length > 0) {
          await Promise.race([
            insertMeetingInsights(meetingData.id, insights),
            new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Insights creation timeout')), 5000))
          ]);
        }
        setSavingProgress(100);
        setLastSaved(new Date());
        setActiveMeeting(null);
        setCallStartTime(null);
        return meetingData.id;
      }
      setSavingProgress(20);
      await Promise.race([
        Promise.all([
          completeMeeting(meetingId, transcript, summary),
          insertMeetingInsights(meetingId, insights)
        ]),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Meeting completion timeout')), 10000))
      ]);
      setSavingProgress(100);
      setLastSaved(new Date());
      setActiveMeeting(null);
      setCallStartTime(null);
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
      setSavingProgress(0);
    }
  }, [activeMeeting, user, toast]);

  const updateMeeting = useCallback(async (meetingId: string, data: Partial<Meeting>) => {
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
  }, [toast]);

  const getMeeting = useCallback(async (meetingId: string) => {
    return getMeetingWithInsights(meetingId);
  }, []);

  return (
    <MeetingStateContext.Provider
      value={{
        activeMeeting,
        isCreatingMeeting,
        isSavingMeeting,
        savingProgress,
        lastSaved,
        callStartTime,
        startMeeting,
        endMeeting,
        updateMeeting,
        getMeeting,
        setActiveMeeting,
        setCallStartTime,
      }}
    >
      {children}
    </MeetingStateContext.Provider>
  );
};

export const useMeetingState = () => {
  const context = useContext(MeetingStateContext);
  if (!context) {
    throw new Error("useMeetingState must be used within a MeetingStateProvider");
  }
  return context;
};
