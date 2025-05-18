
import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

  // Add new question
  const addQuestion = () => {
    const newId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1;
    setQuestions([...questions, { id: newId, text: "New question", isEditing: true }]);
  };

  // Delete question
  const deleteQuestion = (id: number) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  // Edit question
  const startEditingQuestion = (id: number) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, isEditing: true } : q
    ));
  };

  // Save question
  const saveQuestionText = (id: number, text: string) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, text, isEditing: false } : q
    ));
  };

  return (
    <div className="bg-muted rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-muted-foreground">Key Questions to Ask</h3>
        <Button variant="ghost" size="sm" onClick={addQuestion} title="Add question">
          <Plus size={16} />
        </Button>
      </div>
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
              onClick={() => deleteQuestion(question.id)}
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
