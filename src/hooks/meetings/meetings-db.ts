import { supabase } from "@/integrations/supabase/client";
import { Meeting, MeetingInsight } from "./types";

// Create a new meeting record
export const createMeeting = async (
  userId: string,
  platform: string,
  checklist: any[] = [],
  notes: string = "",
  questions: any[] = []
) => {
  const { data, error } = await supabase
    .from('meetings')
    .insert([{
      user_id: userId,
      title: "New Meeting",
      platform,
      date: new Date().toISOString(),
      status: 'active',
      checklist,
      notes,
      questions
    }])
    .select('*')
    .single();
  
  if (error) throw error;
  return data;
};

// Update an existing meeting with new data
export const updateMeetingInDb = async (meetingId: string, data: Partial<Meeting>) => {
  const { error } = await supabase
    .from('meetings')
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq('id', meetingId);
  
  if (error) throw error;
  return true;
};

// Complete a meeting with transcript and summary - optimized for parallel processing
export const completeMeeting = async (meetingId: string, transcript: string, summary: string) => {
  const { error } = await supabase
    .from('meetings')
    .update({ 
      transcript, 
      summary,
      status: 'completed',
      updated_at: new Date().toISOString()
    })
    .eq('id', meetingId);
  
  if (error) throw error;
  return true;
};

// Insert insights in batches - true parallelization using Promise.all
export const insertMeetingInsights = async (meetingId: string, insights: any[]) => {
  if (!insights || insights.length === 0) return true;
  
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
  
  if (insightsToInsert.length === 0) return true;
  
  // Insert in batches of 20 for better performance using true parallel operations
  const BATCH_SIZE = 20;
  const promises = [];
  
  for (let i = 0; i < insightsToInsert.length; i += BATCH_SIZE) {
    const batch = insightsToInsert.slice(i, i + BATCH_SIZE);
    promises.push(
      supabase.from('meeting_insights').insert(batch)
    );
  }
  
  // Truly parallel processing - wait for all operations to complete
  await Promise.all(promises);
  
  return true;
};

// Fetch a meeting with its insights - optimized for parallel fetching
export const getMeetingWithInsights = async (meetingId: string) => {
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

// Fetch meetings for a user with their insights - optimized for performance
export const getUserMeetings = async (userId: string) => {
  try {
    console.log('[getUserMeetings] Fetching meetings for userId:', userId);
    // First, fetch all meetings for the user
    const meetingsResult = await supabase
      .from('meetings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (meetingsResult.error) throw meetingsResult.error;
    const meetings = meetingsResult.data || [];
    if (meetings.length === 0) return [];

    // Only fetch insights if there are meetings
    const meetingIds = meetings.map(m => m.id);
    const insightsResult = await supabase
      .from('meeting_insights')
      .select('*')
      .in('meeting_id', meetingIds);

    if (insightsResult.error) throw insightsResult.error;
    const insights = insightsResult.data || [];

    // Use a Map for O(1) lookups instead of array operations
    const meetingsMap = new Map();
    meetings.forEach(meeting => {
      meetingsMap.set(meeting.id, {
        ...meeting,
        emotions: [],
        painPoints: [],
        objections: [],
        recommendations: [],
        nextActions: []
      });
    });

    // Process insights in a single pass
    for (const insight of insights) {
      const meetingData = meetingsMap.get(insight.meeting_id);
      if (!meetingData) continue; // Skip if meeting not found

      switch(insight.insight_type) {
        case 'emotion':
          meetingData.emotions.push({
            emotion: insight.content,
            level: insight.level
          });
          break;
        case 'pain_points':
          meetingData.painPoints.push(insight.content);
          break;
        case 'objections':
          meetingData.objections.push(insight.content);
          break;
        case 'recommendations':
          meetingData.recommendations.push(insight.content);
          break;
        case 'next_actions':
          meetingData.nextActions.push(insight.content);
          break;
      }
    }
    
    // Convert Map back to array, maintaining original order
    const result = meetings.map(meeting => meetingsMap.get(meeting.id));
    console.log('[getUserMeetings] Final result count:', result.length);
    return result;
  } catch (error) {
    console.error('Error fetching meetings:', error);
    return [];
  }
};
