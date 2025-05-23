
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
    notes,
    isLoading
  } = useNotesState();
  
  const { toast } = useToast();
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Load questions from database if they exist
  useEffect(() => {
    if (!isLoading) {
      const questionsNote = notes.find(note => note.note_type === 'questions');
      if (questionsNote && questionsNote.content) {
        setQuestions(questionsNote.content);
      }
      setInitialLoadDone(true);
    }
  }, [notes, isLoading]);

  // Save questions to database when they change
  useEffect(() => {
    const saveQuestionsToDatabase = async () => {
      if (initialLoadDone) {
        try {
          await saveNote('questions', questions);
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
  }, [questions, saveNote, toast, initialLoadDone]);

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
