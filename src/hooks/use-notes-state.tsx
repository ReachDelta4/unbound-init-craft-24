
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Note {
  id: string;
  content: any;
  note_type: string;
  meeting_id: string | null;
  is_locked: boolean;
}

export const useNotesState = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load saved notes for the current user
  useEffect(() => {
    const fetchNotes = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('meeting_notes')
          .select('*')
          .eq('user_id', user.id)
          .is('meeting_id', null);
          
        if (error) throw error;
        setNotes(data || []);
      } catch (error) {
        console.error('Error fetching notes:', error);
        toast({
          title: "Failed to load notes",
          description: "There was an error fetching your saved notes.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchNotes();
  }, [user, toast]);
  
  // Save a note
  const saveNote = async (noteType: string, content: any, isLocked: boolean = false, meetingId: string | null = null) => {
    if (!user) return null;
    
    try {
      // Check if we already have a note of this type
      const existingNote = notes.find(n => n.note_type === noteType && !n.meeting_id);
      
      if (existingNote) {
        // Update existing note
        const { data, error } = await supabase
          .from('meeting_notes')
          .update({
            content,
            is_locked: isLocked,
            meeting_id: meetingId,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingNote.id)
          .select()
          .single();
        
        if (error) throw error;
        
        setNotes(notes.map(note => note.id === existingNote.id ? data : note));
        return data;
      } else {
        // Create new note
        const { data, error } = await supabase
          .from('meeting_notes')
          .insert([{
            user_id: user.id,
            note_type: noteType,
            content,
            is_locked: isLocked,
            meeting_id: meetingId
          }])
          .select()
          .single();
        
        if (error) throw error;
        
        setNotes([...notes, data]);
        return data;
      }
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: "Failed to save note",
        description: "There was an error saving your note.",
        variant: "destructive",
      });
      return null;
    }
  };
  
  // Toggle lock state
  const toggleNoteLock = async (noteType: string) => {
    if (!user) return false;
    
    try {
      const noteToToggle = notes.find(n => n.note_type === noteType && !n.meeting_id);
      
      if (!noteToToggle) {
        // Create a new locked note if one doesn't exist
        await saveNote(noteType, {}, true);
        return true;
      }
      
      // Toggle the lock state
      const { data, error } = await supabase
        .from('meeting_notes')
        .update({
          is_locked: !noteToToggle.is_locked,
          updated_at: new Date().toISOString()
        })
        .eq('id', noteToToggle.id)
        .select()
        .single();
        
      if (error) throw error;
      
      setNotes(notes.map(note => note.id === noteToToggle.id ? data : note));
      return data.is_locked;
    } catch (error) {
      console.error('Error toggling note lock:', error);
      toast({
        title: "Failed to update note",
        description: "There was an error updating the lock state.",
        variant: "destructive",
      });
      return false;
    }
  };
  
  // Check if a note type is locked
  const isNoteLocked = (noteType: string) => {
    const note = notes.find(n => n.note_type === noteType && !n.meeting_id);
    return note?.is_locked || false;
  };
  
  // Reset notes for a new call (except locked ones)
  const resetNotes = () => {
    // We don't modify the database here, just filter out non-locked notes from state
    setNotes(notes.filter(note => note.is_locked));
  };
  
  // Save notes to a meeting
  const saveNotesToMeeting = async (meetingId: string, notesToSave: { type: string, content: any }[]) => {
    if (!user) return;
    
    try {
      // Map notes to the format needed for the database
      const notesForInsert = notesToSave.map(note => ({
        user_id: user.id,
        meeting_id: meetingId,
        note_type: note.type,
        content: note.content,
        is_locked: false
      }));
      
      if (notesForInsert.length > 0) {
        const { error } = await supabase
          .from('meeting_notes')
          .insert(notesForInsert);
          
        if (error) throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error saving notes to meeting:', error);
      return false;
    }
  };
  
  // Get notes for a specific meeting
  const getMeetingNotes = async (meetingId: string) => {
    try {
      const { data, error } = await supabase
        .from('meeting_notes')
        .select('*')
        .eq('meeting_id', meetingId);
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching meeting notes:', error);
      return [];
    }
  };
  
  return {
    notes,
    isLoading,
    saveNote,
    toggleNoteLock,
    isNoteLocked,
    resetNotes,
    saveNotesToMeeting,
    getMeetingNotes
  };
};
