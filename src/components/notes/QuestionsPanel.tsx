
import React, { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LockableHeader from "./LockableHeader";
import { useNotesState } from "@/hooks/use-notes-state";

interface Question {
  id: number;
  text: string;
  isEditing?: boolean;
}

const QuestionsPanel = () => {
  const [questions, setQuestions] = useState<Question[]>([
    { id: 1, text: "What are your biggest challenges with your current solution?" },
    { id: 2, text: "What's your timeline for implementation?" },
    { id: 3, text: "Who else is involved in the decision-making process?" },
    { id: 4, text: "What's your budget range for this project?" },
    { id: 5, text: "What would success look like for you in 6 months?" },
  ]);

  const {
    saveNote,
    isNoteLocked,
    toggleNoteLock,
    notes,
    isLoading
  } = useNotesState();

  const isLocked = isNoteLocked('questions');

  // Load questions from database if they exist
  useEffect(() => {
    if (!isLoading) {
      const questionsNote = notes.find(note => note.note_type === 'questions');
      if (questionsNote && questionsNote.content) {
        setQuestions(questionsNote.content);
      }
    }
  }, [notes, isLoading]);

  // Save questions to database when they change
  useEffect(() => {
    if (questions.length > 0) {
      saveNote('questions', questions, isLocked);
    }
  }, [questions, isLocked, saveNote]);

  // Add new question
  const addQuestion = () => {
    if (isLocked) return;
    
    const newId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1;
    setQuestions([...questions, { id: newId, text: "New question", isEditing: true }]);
  };

  // Delete question
  const deleteQuestion = (id: number) => {
    if (isLocked) return;
    
    setQuestions(questions.filter(question => question.id !== id));
  };

  // Edit question
  const startEditingQuestion = (id: number) => {
    if (isLocked) return;
    
    setQuestions(questions.map(question => 
      question.id === id ? { ...question, isEditing: true } : question
    ));
  };

  // Save question
  const saveQuestionText = (id: number, text: string) => {
    if (isLocked) return;
    
    setQuestions(questions.map(question => 
      question.id === id ? { ...question, text, isEditing: false } : question
    ));
  };

  const handleToggleLock = async () => {
    const newLockState = await toggleNoteLock('questions');
    setIsLocked(newLockState);
  };

  return (
    <div className="bg-muted rounded-lg p-4">
      <LockableHeader
        title="Key Questions to Ask"
        isLocked={isLocked}
        onToggleLock={handleToggleLock}
        onAddItem={addQuestion}
        showAddButton={true}
      />
      <div className="space-y-2">
        {questions.map((question) => (
          <div key={question.id} className="flex items-start group">
            <div className="ml-1 mr-2 mt-1 text-muted-foreground">•</div>
            <div className="flex-grow">
              {question.isEditing && !isLocked ? (
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
                  className={`text-sm ${!isLocked ? "cursor-text" : ""}`}
                  onClick={() => !isLocked && startEditingQuestion(question.id)}
                >
                  {question.text}
                </p>
              )}
            </div>
            {!isLocked && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive" 
                onClick={() => deleteQuestion(question.id)}
              >
                <Trash2 size={14} />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestionsPanel;
