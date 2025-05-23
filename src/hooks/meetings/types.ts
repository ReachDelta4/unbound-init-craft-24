
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
