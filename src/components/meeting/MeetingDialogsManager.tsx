
import React from 'react';
import MeetingEndDialog from '@/components/MeetingEndDialog';
import EndCallConfirmationDialog from '@/components/EndCallConfirmationDialog';

interface MeetingDialogsManagerProps {
  showMeetingDialog: boolean;
  showEndCallConfirmation: boolean;
  onCloseMeetingDialog: () => void;
  onCloseEndCallConfirmation: () => void;
  onConfirmEndCall: () => void;
  onSaveMeeting: (title: string, transcript: string, summary: string) => Promise<void>;
  transcript: string;
  summary: string;
  insights: any[];
  saveProgress: number;
}

const MeetingDialogsManager = ({
  showMeetingDialog,
  showEndCallConfirmation,
  onCloseMeetingDialog,
  onCloseEndCallConfirmation,
  onConfirmEndCall,
  onSaveMeeting,
  transcript,
  summary,
  insights,
  saveProgress
}: MeetingDialogsManagerProps) => {
  return (
    <>
      <MeetingEndDialog
        isOpen={showMeetingDialog}
        onClose={onCloseMeetingDialog}
        onSave={onSaveMeeting}
        transcript={transcript}
        summary={summary}
        insights={insights}
        saveProgress={saveProgress}
      />
      
      <EndCallConfirmationDialog
        isOpen={showEndCallConfirmation}
        onClose={onCloseEndCallConfirmation}
        onConfirm={onConfirmEndCall}
      />
    </>
  );
};

export default MeetingDialogsManager;
