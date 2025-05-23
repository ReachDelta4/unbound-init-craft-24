
import React, { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LockableHeader from "./LockableHeader";
import { useNotesState } from "@/hooks/use-notes-state";
import { useToast } from "@/hooks/use-toast";

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
  
  const { toast } = useToast();
  const [isLocked, setIsLocked] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Load questions from database if they exist
  useEffect(() => {
    if (!isLoading) {
      const questionsNote = notes.find(note => note.note_type === 'questions');
      if (questionsNote && questionsNote.content) {
        setQuestions(questionsNote.content);
      }
      
      // Update local lock state
      const locked = isNoteLocked('questions');
      setIsLocked(locked);
      setInitialLoadDone(true);
    }
  }, [notes, isLoading, isNoteLocked]);

  // Save questions to database when they change
  useEffect(() => {
    const saveQuestionsToDatabase = async () => {
      if (initialLoadDone) {
        try {
          await saveNote('questions', questions, isLocked);
        } catch (error) {
          console.error('Error saving questions:', error);
          toast({
            title: "Failed to save questions",
            description: "There was an error saving your questions.",
            variant: "destructive",
          });
        }
      }
    };
    
    saveQuestionsToDatabase();
  }, [questions, isLocked, saveNote, toast, initialLoadDone]);

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
    try {
      const newLockState = await toggleNoteLock('questions');
      setIsLocked(newLockState);
      toast({
        title: newLockState ? "Questions locked" : "Questions unlocked",
        description: newLockState 
          ? "The questions will be preserved for future calls." 
          : "The questions will be reset for new calls.",
      });
    } catch (error) {
      console.error('Error toggling lock:', error);
      toast({
        title: "Failed to toggle lock",
        description: "There was an error updating the lock state.",
        variant: "destructive",
      });
    }
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
                onClick={(e) => {
                  e.stopPropagation();
                  deleteQuestion(question.id);
                }}
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
