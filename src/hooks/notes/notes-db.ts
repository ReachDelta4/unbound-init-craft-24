
import { supabase } from "@/integrations/supabase/client";
import { Note, NotesToSave } from "./types";

// Fetch notes for user
export const fetchUserNotes = async (userId: string) => {
  // Add caching headers for better performance
  const { data, error } = await supabase
    .from('meeting_notes')
    .select('*')
    .eq('user_id', userId)
    .is('meeting_id', null);
    
  if (error) throw error;
  return data || [];
};

// Save or update a note with better error handling
export const saveOrUpdateNote = async (
  userId: string,
  noteType: string,
  content: any,
  isLocked: boolean = false,
  meetingId: string | null = null,
  existingNoteId?: string
) => {
  try {
    if (existingNoteId) {
      // Update existing note - only send fields that actually changed
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
  } catch (error) {
    console.error('Error in saveOrUpdateNote:', error);
    throw error;
  }
};

// Save multiple notes to a meeting with improved efficiency
export const saveBulkNotesToMeeting = async (
  userId: string,
  meetingId: string,
  notes: NotesToSave[]
) => {
  try {
    const notesForInsert = notes.map(note => ({
      user_id: userId,
      meeting_id: meetingId,
      note_type: note.type,
      content: note.content,
      is_locked: false
    }));
    
    if (notesForInsert.length === 0) return true;
    
    // Process in chunks if there are many notes
    const CHUNK_SIZE = 20;
    const chunks = [];
    
    for (let i = 0; i < notesForInsert.length; i += CHUNK_SIZE) {
      chunks.push(notesForInsert.slice(i, i + CHUNK_SIZE));
    }
    
    // Insert each chunk
    await Promise.all(
      chunks.map(chunk => supabase.from('meeting_notes').insert(chunk))
    );
    
    return true;
  } catch (error) {
    console.error('Error in saveBulkNotesToMeeting:', error);
    throw error;
  }
};

// Get notes for a specific meeting with timeout
export const getMeetingNotesFromDb = async (meetingId: string) => {
  try {
    const { data, error } = await Promise.race([
      supabase
        .from('meeting_notes')
        .select('*')
        .eq('meeting_id', meetingId),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Database timeout')), 3000)
      )
    ]);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error in getMeetingNotesFromDb:', error);
    throw error;
  }
};
