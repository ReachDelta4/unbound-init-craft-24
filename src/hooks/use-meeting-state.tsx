
import { useState, useEffect } from "react";
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

  // Create a new meeting when a call starts
  const startMeeting = async (platform: string) => {
    if (!user) return null;
    
    let timeout: NodeJS.Timeout;
    const timeoutPromise = new Promise((_, reject) => {
      timeout = setTimeout(() => reject(new Error('Timeout')), 10000);
    });
    
    try {
      setIsCreatingMeeting(true);
      
      // Create meeting in database
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
      
      setActiveMeeting(meetingData);
      return meetingData;
    } catch (error) {
      console.error('Error starting meeting:', error);
      toast({
        title: "Failed to start meeting",
        description: "There was an error creating the meeting record.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsCreatingMeeting(false);
    }
  };

  // End the active meeting
  const endMeeting = async (transcript: string, summary: string, insights: any[]) => {
    if (!activeMeeting || !user) return;
    
    try {
      // Update meeting with transcript and summary
      const { error: updateError } = await supabase
        .from('meetings')
        .update({ 
          transcript, 
          summary,
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', activeMeeting.id);
      
      if (updateError) throw updateError;
      
      // Save meeting insights
      if (insights && insights.length > 0) {
        const insightsToInsert = insights.flatMap(category => {
          switch(category.type) {
            case 'emotions':
              return category.data.map((item: any) => ({
                meeting_id: activeMeeting.id,
                insight_type: 'emotion',
                content: item.emotion,
                level: item.level
              }));
            case 'painPoints':
            case 'objections':
            case 'recommendations':
            case 'nextActions':
              return category.data.map((item: string) => ({
                meeting_id: activeMeeting.id,
                insight_type: category.type.replace(/([A-Z])/g, '_$1').toLowerCase(),
                content: item
              }));
            default:
              return [];
          }
        });
        
        if (insightsToInsert.length > 0) {
          const { error: insightsError } = await supabase
            .from('meeting_insights')
            .insert(insightsToInsert);
            
          if (insightsError) console.error('Error saving insights:', insightsError);
        }
      }
      
      return activeMeeting.id;
    } catch (error) {
      console.error('Error ending meeting:', error);
      toast({
        title: "Failed to save meeting",
        description: "There was an error updating the meeting record.",
        variant: "destructive",
      });
      return null;
    } finally {
      setActiveMeeting(null);
    }
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
      const { data: meetingData, error: meetingError } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', meetingId)
        .single();
      
      if (meetingError) throw meetingError;
      
      const { data: insightsData, error: insightsError } = await supabase
        .from('meeting_insights')
        .select('*')
        .eq('meeting_id', meetingId);
      
      if (insightsError) throw insightsError;
      
      return {
        meeting: meetingData,
        insights: insightsData || []
      };
    } catch (error) {
      console.error('Error fetching meeting:', error);
      return { meeting: null, insights: [] };
    }
  };
  
  return {
    activeMeeting,
    isCreatingMeeting,
    startMeeting,
    endMeeting,
    updateMeeting,
    getMeeting
  };
};
