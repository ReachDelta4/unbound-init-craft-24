
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Note, NotesToSave } from "./types";
import {
  fetchUserNotes,
  saveOrUpdateNote,
  toggleNoteLockState,
  saveBulkNotesToMeeting,
  getMeetingNotesFromDb
} from "./notes-db";

export const useNotesState = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load saved notes for the current user
  useEffect(() => {
    const loadNotes = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const data = await fetchUserNotes(user.id);
        setNotes(data);
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
    
    loadNotes();
  }, [user, toast]);
  
  // Save a note
  const saveNote = async (noteType: string, content: any, isLocked: boolean = false, meetingId: string | null = null) => {
    if (!user) return null;
    
    try {
      // Check if we already have a note of this type
      const existingNote = notes.find(n => n.note_type === noteType && !n.meeting_id);
      
      const updatedNote = await saveOrUpdateNote(
        user.id,
        noteType,
        content,
        isLocked,
        meetingId,
        existingNote?.id
      );
      
      if (existingNote) {
        setNotes(notes.map(note => note.id === existingNote.id ? updatedNote : note));
      } else {
        setNotes([...notes, updatedNote]);
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
      const updatedNote = await toggleNoteLockState(noteToToggle.id, noteToToggle.is_locked);
      
      setNotes(notes.map(note => note.id === noteToToggle.id ? updatedNote : note));
      return updatedNote.is_locked;
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
  const saveNotesToMeeting = async (meetingId: string, notesToSave: NotesToSave[]) => {
    if (!user) return false;
    
    try {
      return await saveBulkNotesToMeeting(user.id, meetingId, notesToSave);
    } catch (error) {
      console.error('Error saving notes to meeting:', error);
      return false;
    }
  };
  
  // Get notes for a specific meeting
  const getMeetingNotes = async (meetingId: string) => {
    try {
      return await getMeetingNotesFromDb(meetingId);
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
