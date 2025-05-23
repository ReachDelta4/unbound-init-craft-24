
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
  const saveNote = async (noteType: string, content: any, meetingId: string | null = null) => {
    if (!user) return null;
    
    try {
      // Check if we already have a note of this type
      const existingNote = notes.find(n => n.note_type === noteType && !n.meeting_id);
      
      const updatedNote = await saveOrUpdateNote(
        user.id,
        noteType,
        content,
        false,
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
  
  // Reset notes for a new call
  const resetNotes = () => {
    // Just clear all notes without checking lock state
    setNotes([]);
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
    resetNotes,
    saveNotesToMeeting,
    getMeetingNotes
  };
};
