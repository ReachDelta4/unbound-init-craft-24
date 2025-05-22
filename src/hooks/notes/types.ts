
// Note types for the notes system
export interface Note {
  id: string;
  content: any;
  note_type: string;
  meeting_id: string | null;
  is_locked: boolean;
}

export interface NotesToSave {
  type: string;
  content: any;
}
