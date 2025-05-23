
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Note, NotesToSave } from "./notes/types";
import {
  fetchUserNotes,
  saveOrUpdateNote,
  saveBulkNotesToMeeting,
  getMeetingNotesFromDb
} from "./notes/notes-db";

export const useNotesState = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Load saved notes for the current user with optimized loading
  useEffect(() => {
    let isMounted = true;
    
    const loadNotes = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const data = await fetchUserNotes(user.id);
        
        if (isMounted) {
          setNotes(data);
        }
      } catch (error) {
        console.error('Error fetching notes:', error);
        if (isMounted) {
          toast({
            title: "Failed to load notes",
            description: "There was an error fetching your saved notes.",
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadNotes();
    
    return () => {
      isMounted = false;
    };
  }, [user, toast]);
  
  // Save a note with optimistic updates
  const saveNote = async (noteType: string, content: any, meetingId: string | null = null) => {
    if (!user) return null;
    
    try {
      setIsSaving(true);
      
      // Check if we already have a note of this type
      const existingNote = notes.find(n => n.note_type === noteType && !n.meeting_id);
      
      // Create optimistic note update
      const optimisticNote = existingNote ? {
        ...existingNote,
        content,
        updated_at: new Date().toISOString()
      } : {
        id: `temp-${Date.now()}`,
        user_id: user.id,
        note_type: noteType,
        content,
        is_locked: false,
        meeting_id: meetingId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Note;
      
      // Update UI immediately for better responsiveness
      if (existingNote) {
        setNotes(notes.map(note => note.id === existingNote.id ? optimisticNote : note));
      } else {
        setNotes([...notes, optimisticNote]);
      }
      
      // Perform actual database update
      const updatedNote = await saveOrUpdateNote(
        user.id,
        noteType,
        content,
        false,
        meetingId,
        existingNote?.id
      );
      
      // Update with actual database version if needed
      if (updatedNote) {
        setNotes(prevNotes => {
          if (existingNote) {
            return prevNotes.map(note => note.id === existingNote.id ? updatedNote : note);
          } else {
            // Replace our temporary note with the real one
            return prevNotes
              .filter(note => !note.id.startsWith('temp-') || note.note_type !== noteType)
              .concat(updatedNote);
          }
        });
      }
      
      return updatedNote;
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: "Failed to save note",
        description: "There was an error saving your note.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  };
  
  // Reset notes for a new call
  const resetNotes = () => {
    // Just clear all notes without checking lock state
    setNotes([]);
  };
  
  // Save notes to a meeting with optimized parallel processing
  const saveNotesToMeeting = async (meetingId: string, notesToSave: NotesToSave[]) => {
    if (!user) return false;
    
    try {
      setIsSaving(true);
      
      // Process in parallel for better performance
      // Split into smaller batches if there are many notes
      const BATCH_SIZE = 10;
      const batches = [];
      
      for (let i = 0; i < notesToSave.length; i += BATCH_SIZE) {
        batches.push(notesToSave.slice(i, i + BATCH_SIZE));
      }
      
      // Save each batch in parallel
      await Promise.all(
        batches.map(batch => saveBulkNotesToMeeting(user.id, meetingId, batch))
      );
      
      return true;
    } catch (error) {
      console.error('Error saving notes to meeting:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };
  
  // Get notes for a specific meeting with a timeout
  const getMeetingNotes = async (meetingId: string) => {
    try {
      return await Promise.race([
        getMeetingNotesFromDb(meetingId),
        new Promise<Note[]>((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 5000);
        }) as Promise<Note[]>
      ]);
    } catch (error) {
      console.error('Error fetching meeting notes:', error);
      return [];
    }
  };
  
  return {
    notes,
    isLoading,
    isSaving,
    saveNote,
    resetNotes,
    saveNotesToMeeting,
    getMeetingNotes
  };
};
