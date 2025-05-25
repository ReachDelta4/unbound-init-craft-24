import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Note, NotesToSave } from "./notes/types";
import {
  fetchUserNotes,
  saveOrUpdateNote,
  toggleNoteLockState,
  saveBulkNotesToMeeting,
  getMeetingNotesFromDb,
  deleteOrphanNotesForUser,
} from "./notes/notes-db";

// Helper for localStorage keys
const LS_KEYS = {
  checklist: 'notes-checklist',
  questions: 'notes-questions',
  markdown: 'notes-markdown',
  meta: 'notes-meta', // for timestamps
};

// Helper to get/set meta (timestamps)
function getMeta() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEYS.meta) || '{}');
  } catch {
    return {};
  }
}
function setMeta(meta: any) {
  localStorage.setItem(LS_KEYS.meta, JSON.stringify(meta));
}

// Helper to clear all localStorage notes drafts
function clearDraft() {
  Object.values(LS_KEYS).forEach(key => localStorage.removeItem(key));
}

export const useNotesState = (meetingId: string | null = null, meetingObj: any = null) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [checklist, setChecklist] = useState<any[]>([]);
  const [markdown, setMarkdown] = useState<string>("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const isFirstLoad = useRef(true);

  // --- Load from localStorage first ---
  useEffect(() => {
    // Only run on mount
    const meta = getMeta();
    try {
      const lsChecklist = localStorage.getItem(LS_KEYS.checklist);
      if (lsChecklist) setChecklist(JSON.parse(lsChecklist));
      const lsQuestions = localStorage.getItem(LS_KEYS.questions);
      if (lsQuestions) setQuestions(JSON.parse(lsQuestions));
      const lsMarkdown = localStorage.getItem(LS_KEYS.markdown);
      if (lsMarkdown) setMarkdown(lsMarkdown);
    } catch (err) {
      // If parsing fails, clear corrupted localStorage and notify user
      localStorage.removeItem(LS_KEYS.checklist);
      localStorage.removeItem(LS_KEYS.questions);
      localStorage.removeItem(LS_KEYS.markdown);
      setChecklist([]);
      setQuestions([]);
      setMarkdown("");
      toast && toast({
        title: "Corrupted local notes",
        description: "Some local notes could not be loaded and were reset.",
        variant: "destructive",
      });
    }
  }, []);

  // --- Load from cloud and update if newer ---
  useEffect(() => {
    // This effect merges cloud and local notes, preferring the most recently updated version for each note type.
    if (!user) return;
    let isMounted = true;
    setIsLoading(true);
    setLoadError(null);
    fetchUserNotes(user.id)
      .then((data) => {
        if (!isMounted) return;
        setNotes(data);
        // Find and set each note type
        const meta = getMeta();
        const now = Date.now();
        // Questions
        const questionsNote = data.find(note => note.note_type === 'questions');
        // Type check: ensure content is an array before using
        const cloudQuestions = Array.isArray(questionsNote?.content) ? questionsNote.content : [];
        const cloudQuestionsUpdated = new Date(questionsNote?.updated_at || 0).getTime();
        const localQuestionsUpdated = meta.questions || 0;
        // Prefer the most recently updated version
        if (cloudQuestionsUpdated > localQuestionsUpdated) {
          setQuestions(cloudQuestions);
          localStorage.setItem(LS_KEYS.questions, JSON.stringify(cloudQuestions));
          meta.questions = cloudQuestionsUpdated;
        }
        // Checklist
        const checklistNote = data.find(note => note.note_type === 'checklist');
        // Type check: ensure content is an array before using
        const cloudChecklist = Array.isArray(checklistNote?.content) ? checklistNote.content : [];
        const cloudChecklistUpdated = new Date(checklistNote?.updated_at || 0).getTime();
        const localChecklistUpdated = meta.checklist || 0;
        if (cloudChecklistUpdated > localChecklistUpdated) {
          setChecklist(cloudChecklist);
          localStorage.setItem(LS_KEYS.checklist, JSON.stringify(cloudChecklist));
          meta.checklist = cloudChecklistUpdated;
        }
        // Markdown
        const markdownNote = data.find(note => note.note_type === 'markdown');
        let cloudMarkdown = "";
        // Type check: ensure content is a string or has a 'raw' string property
        if (typeof markdownNote?.content === 'string') {
          cloudMarkdown = markdownNote.content;
        } else if (markdownNote?.content && typeof markdownNote.content === 'object' && 'raw' in markdownNote.content && typeof markdownNote.content.raw === 'string') {
          cloudMarkdown = markdownNote.content.raw;
        }
        const cloudMarkdownUpdated = new Date(markdownNote?.updated_at || 0).getTime();
        const localMarkdownUpdated = meta.markdown || 0;
        if (cloudMarkdownUpdated > localMarkdownUpdated) {
          setMarkdown(cloudMarkdown);
          localStorage.setItem(LS_KEYS.markdown, cloudMarkdown);
          meta.markdown = cloudMarkdownUpdated;
        }
        setMeta(meta);
      })
      .catch((error) => {
        setLoadError("Failed to load notes. Please try again.");
        toast && toast({
          title: "Failed to load notes",
          description: "There was an error fetching your saved notes.",
          variant: "destructive",
        });
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
        isFirstLoad.current = false;
      });
    return () => { isMounted = false; };
  }, [user, toast]);

  // --- Helper to save a note type (cloud + local) ---
  const autosave = async (noteType: string, content: any) => {
    if (!user) return;
    setIsSaving(true);
    setSaveError(null);
    const meta = getMeta();
    const now = Date.now();
    try {
      // Save to localStorage
      if (noteType === 'checklist') {
        localStorage.setItem(LS_KEYS.checklist, JSON.stringify(content));
        meta.checklist = now;
      } else if (noteType === 'questions') {
        localStorage.setItem(LS_KEYS.questions, JSON.stringify(content));
        meta.questions = now;
      } else if (noteType === 'markdown') {
        localStorage.setItem(LS_KEYS.markdown, content);
        meta.markdown = now;
      }
      setMeta(meta);
      // Save to cloud
      const existingNote = notes.find(n => n.note_type === noteType && !n.meeting_id);
      let saveContent = content;
      if (noteType === 'markdown' && typeof content === 'string') {
        saveContent = { raw: content };
      }
      const updatedNote = await saveOrUpdateNote(
        user.id,
        noteType,
        saveContent,
        false,
        null,
        existingNote?.id
      );
      // Update local notes state
      setNotes(prevNotes => {
        if (existingNote) {
          return prevNotes.map(note => note.id === existingNote.id ? updatedNote : note);
        } else {
          return [...prevNotes, updatedNote];
        }
      });
    } catch (error) {
      setSaveError("Failed to save note. Changes will be retried.");
      toast && toast({
        title: "Failed to save note",
        description: "There was an error saving your note. We'll retry on your next change.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // --- Autosave checklist ---
  useEffect(() => {
    if (isFirstLoad.current) return;
    autosave('checklist', checklist);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checklist]);

  // --- Autosave questions ---
  useEffect(() => {
    if (isFirstLoad.current) return;
    autosave('questions', questions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions]);

  // --- Autosave markdown ---
  useEffect(() => {
    if (isFirstLoad.current) return;
    autosave('markdown', markdown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markdown]);

  // Reset notes for a new call
  const resetNotes = () => {
    setNotes([]);
    setQuestions([]);
    setChecklist([]);
    setMarkdown("");
    clearDraft();
  };

  // Save notes to a meeting with correct meetingId
  const saveNotesToMeeting = async (meetingId: string) => {
    if (!user) return false;
    try {
      setIsSaving(true);
      const notesToSave = [
        { type: 'questions', content: questions },
        { type: 'checklist', content: checklist },
        { type: 'markdown', content: { raw: markdown } },
      ];
      await saveBulkNotesToMeeting(user.id, meetingId, notesToSave);
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

  // Expose local state and setters for panels
  return {
    notes,
    isLoading,
    isSaving,
    questions,
    setQuestions,
    checklist,
    setChecklist,
    markdown,
    setMarkdown,
    loadError,
    saveError,
    resetNotes,
    saveNotesToMeeting,
    getMeetingNotes
  };
};
