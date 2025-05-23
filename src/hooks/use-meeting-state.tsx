
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Meeting {
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
}

export interface MeetingInsight {
  id: string;
  meeting_id: string;
  insight_type: string;
  content: string;
  level?: number;
}

export interface MeetingNote {
  id: string;
  user_id: string;
  meeting_id: string | null;
  note_type: string;
  content: any;
  is_locked: boolean;
}

export const useMeetingState = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);
  const [isSavingMeeting, setIsSavingMeeting] = useState(false);
  const [savingProgress, setSavingProgress] = useState(0);

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
          const { data: meetingData, error: meetingError } = await supabase
            .from('meetings')
            .insert([{
              user_id: user.id,
              title: "New Meeting",
              platform,
              date: new Date().toISOString(),
              status: 'active'
            }])
            .select('*')
            .single();
          
          if (meetingError) throw meetingError;
          
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

  // End the active meeting with optimized parallel operations
  const endMeeting = async (transcript: string, summary: string, insights: any[]) => {
    if (!activeMeeting || !user) return null;
    
    try {
      setIsSavingMeeting(true);
      setSavingProgress(10);
      
      const meetingId = activeMeeting.id.startsWith('temp-') ? null : activeMeeting.id;
      
      // If we don't have a real meeting ID yet, create the meeting first
      if (!meetingId) {
        const { data, error } = await supabase
          .from('meetings')
          .insert([{
            user_id: user.id,
            title: "New Meeting",
            platform: activeMeeting.platform,
            date: new Date().toISOString(),
            status: 'completed',
            transcript,
            summary
          }])
          .select('*')
          .single();
          
        if (error) throw error;
        setSavingProgress(50);
        
        // Now handle insights in parallel
        if (insights && insights.length > 0) {
          await processInsights(data.id, insights);
        }
        
        setSavingProgress(100);
        return data.id;
      }
      
      // For existing meetings, run operations in parallel
      // 1. Update meeting
      setSavingProgress(20);
      const updatePromise = supabase
        .from('meetings')
        .update({ 
          transcript, 
          summary,
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', meetingId);
      
      // 2. Process insights (only if there are any)
      let insightsPromise = Promise.resolve();
      if (insights && insights.length > 0) {
        insightsPromise = processInsights(meetingId, insights);
      }
      
      // Wait for both operations to complete
      const [updateResult, _] = await Promise.all([updatePromise, insightsPromise]);
      if (updateResult.error) throw updateResult.error;
      
      setSavingProgress(100);
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

  // Helper function to process insights in efficient batches
  const processInsights = async (meetingId: string, insights: any[]) => {
    // Convert insights to database format
    const insightsToInsert = insights.flatMap(category => {
      switch(category.type) {
        case 'emotions':
          return category.data.map((item: any) => ({
            meeting_id: meetingId,
            insight_type: 'emotion',
            content: item.emotion,
            level: item.level
          }));
        case 'painPoints':
        case 'objections':
        case 'recommendations':
        case 'nextActions':
          return category.data.map((item: string) => ({
            meeting_id: meetingId,
            insight_type: category.type.replace(/([A-Z])/g, '_$1').toLowerCase(),
            content: item
          }));
        default:
          return [];
      }
    });
    
    if (insightsToInsert.length === 0) return;
    
    // Insert in batches of 20 for better performance
    const BATCH_SIZE = 20;
    const batches = [];
    
    for (let i = 0; i < insightsToInsert.length; i += BATCH_SIZE) {
      batches.push(insightsToInsert.slice(i, i + BATCH_SIZE));
    }
    
    // Process batches in parallel
    await Promise.all(batches.map(batch => 
      supabase.from('meeting_insights').insert(batch)
    ));
  };

  // Update meeting details
  const updateMeeting = async (meetingId: string, data: Partial<Meeting>) => {
    try {
      const { error } = await supabase
        .from('meetings')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', meetingId);
      
      if (error) throw error;
      
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
  const getMeeting = async (meetingId: string): Promise<{ meeting: Meeting | null, insights: MeetingInsight[] }> => {
    try {
      // Run queries in parallel for better performance
      const [meetingResult, insightsResult] = await Promise.all([
        supabase
          .from('meetings')
          .select('*')
          .eq('id', meetingId)
          .single(),
        supabase
          .from('meeting_insights')
          .select('*')
          .eq('meeting_id', meetingId)
      ]);
      
      if (meetingResult.error) throw meetingResult.error;
      if (insightsResult.error) throw insightsResult.error;
      
      return {
        meeting: meetingResult.data,
        insights: insightsResult.data || []
      };
    } catch (error) {
      console.error('Error fetching meeting:', error);
      return { meeting: null, insights: [] };
    }
  };
  
  return {
    activeMeeting,
    isCreatingMeeting,
    isSavingMeeting, 
    savingProgress,
    startMeeting,
    endMeeting,
    updateMeeting,
    getMeeting
  };
};
