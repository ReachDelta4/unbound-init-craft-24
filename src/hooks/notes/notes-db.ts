
import { supabase } from "@/integrations/supabase/client";
import { Note, NotesToSave } from "./types";

// Fetch notes for user
export const fetchUserNotes = async (userId: string) => {
  const { data, error } = await supabase
    .from('meeting_notes')
    .select('*')
    .eq('user_id', userId)
    .is('meeting_id', null);
    
  if (error) throw error;
  return data || [];
};

// Save or update a note
export const saveOrUpdateNote = async (
  userId: string,
  noteType: string,
  content: any,
  isLocked: boolean = false,
  meetingId: string | null = null,
  existingNoteId?: string
) => {
  if (existingNoteId) {
    // Update existing note
    const { data, error } = await supabase
      .from('meeting_notes')
      .update({
        content,
        is_locked: isLocked,
        meeting_id: meetingId,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingNoteId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } else {
    // Create new note
    const { data, error } = await supabase
      .from('meeting_notes')
      .insert([{
        user_id: userId,
        note_type: noteType,
        content,
        is_locked: isLocked,
        meeting_id: meetingId
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Toggle lock state of a note
export const toggleNoteLockState = async (noteId: string, currentLockState: boolean) => {
  const { data, error } = await supabase
    .from('meeting_notes')
    .update({
      is_locked: !currentLockState,
      updated_at: new Date().toISOString()
    })
    .eq('id', noteId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

// Save multiple notes to a meeting
export const saveBulkNotesToMeeting = async (
  userId: string,
  meetingId: string,
  notes: NotesToSave[]
) => {
  const notesForInsert = notes.map(note => ({
    user_id: userId,
    meeting_id: meetingId,
    note_type: note.type,
    content: note.content,
    is_locked: false
  }));
  
  if (notesForInsert.length === 0) return true;
  
  const { error } = await supabase
    .from('meeting_notes')
    .insert(notesForInsert);
    
  if (error) throw error;
  return true;
};

// Get notes for a specific meeting
export const getMeetingNotesFromDb = async (meetingId: string) => {
  const { data, error } = await supabase
    .from('meeting_notes')
    .select('*')
    .eq('meeting_id', meetingId);
    
  if (error) throw error;
  return data || [];
};
