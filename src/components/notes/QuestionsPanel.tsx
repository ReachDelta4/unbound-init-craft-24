import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LockableHeader from "./LockableHeader";
import { useNotesState } from "@/hooks/use-notes-state";
import { useMeetingState } from "@/hooks/use-meeting-state";

const QuestionsPanel = () => {
  const { activeMeeting } = useMeetingState();
  const meetingId = activeMeeting?.id || null;
  const { questions, setQuestions } = useNotesState(meetingId, activeMeeting);

  // Add new question
  const addQuestion = () => {
    const newId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1;
    setQuestions([...questions, { id: newId, text: "New question", isEditing: true }]);
  };

  // Delete question
  const deleteQuestion = (id: number) => {
    setQuestions(questions.filter(question => question.id !== id));
  };

  // Edit question
  const startEditingQuestion = (id: number) => {
    setQuestions(questions.map(question =>
      question.id === id ? { ...question, isEditing: true } : question
    ));
  };

  // Save question
  const saveQuestionText = (id: number, text: string) => {
    setQuestions(questions.map(question =>
      question.id === id ? { ...question, text, isEditing: false } : question
    ));
  };

  return (
    <div className="bg-muted rounded-lg p-4">
      <LockableHeader
        title="Key Questions to Ask"
        onAddItem={addQuestion}
        showAddButton={true}
      />
      <div className="space-y-2">
        {questions.map((question) => (
          <div key={question.id} className="flex items-start group">
            <div className="ml-1 mr-2 mt-1 text-muted-foreground">•</div>
            <div className="flex-grow">
              {question.isEditing ? (
                <Input
                  defaultValue={question.text}
                  className="text-sm"
                  onBlur={(e) => saveQuestionText(question.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      saveQuestionText(question.id, e.currentTarget.value);
                    }
                  }}
                  autoFocus
                />
              ) : (
                <p
                  className="text-sm cursor-text"
                  onClick={() => startEditingQuestion(question.id)}
                >
                  {question.text}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                deleteQuestion(question.id);
              }}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestionsPanel;
