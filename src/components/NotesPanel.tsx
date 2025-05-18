
import React, { useState, useRef, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, CheckSquare, Plus, Trash2, ArrowDown, ArrowUp } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChecklistItem {
  id: number;
  label: string;
  completed: boolean;
  description?: string;
  isEditing?: boolean;
}

interface Question {
  id: number;
  text: string;
  isEditing?: boolean;
}

interface NotesPanelProps {
  isCallActive: boolean;
}

const NotesPanel = ({ isCallActive }: NotesPanelProps) => {
  const [notes, setNotes] = useState<string>(
    "# Meeting Notes\n\nKey points:\n- Client interested in our enterprise plan\n- Need to follow up with pricing details\n- Technical integration is a priority\n"
  );
  
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: 1, label: "Introduction", completed: true, description: "Brief company overview" },
    { id: 2, label: "Understand client needs", completed: true, description: "Ask about pain points" },
    { id: 3, label: "Present key features", completed: false },
    { id: 4, label: "Address pricing questions", completed: false },
    { id: 5, label: "Discuss implementation timeline", completed: false },
    { id: 6, label: "Agree on next steps", completed: false },
  ]);

  const [questions, setQuestions] = useState<Question[]>([
    { id: 1, text: "What are your biggest challenges with your current solution?" },
    { id: 2, text: "What's your timeline for implementation?" },
    { id: 3, text: "Who else is involved in the decision-making process?" },
    { id: 4, text: "What's your budget range for this project?" },
    { id: 5, text: "What would success look like for you in 6 months?" },
  ]);

  // For Markdown preview rendering
  const [renderedNotes, setRenderedNotes] = useState<string>("");

  // Toggle checklist item completion
  const toggleChecklistItem = (id: number) => {
    setChecklist(checklist.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  // Add new checklist item
  const addChecklistItem = () => {
    const newId = checklist.length > 0 ? Math.max(...checklist.map(item => item.id)) + 1 : 1;
    setChecklist([...checklist, { id: newId, label: "New step", completed: false, isEditing: true }]);
  };

  // Delete checklist item
  const deleteChecklistItem = (id: number) => {
    setChecklist(checklist.filter(item => item.id !== id));
  };

  // Move checklist item up or down
  const moveChecklistItem = (id: number, direction: "up" | "down") => {
    const index = checklist.findIndex(item => item.id === id);
    if ((direction === "up" && index === 0) || 
        (direction === "down" && index === checklist.length - 1)) {
      return;
    }

    const newIndex = direction === "up" ? index - 1 : index + 1;
    const newChecklist = [...checklist];
    const temp = newChecklist[index];
    newChecklist[index] = newChecklist[newIndex];
    newChecklist[newIndex] = temp;
    setChecklist(newChecklist);
  };

  // Edit checklist item label
  const startEditingChecklistItem = (id: number) => {
    setChecklist(checklist.map(item => 
      item.id === id ? { ...item, isEditing: true } : item
    ));
  };

  // Save checklist item label
  const saveChecklistItemLabel = (id: number, label: string) => {
    setChecklist(checklist.map(item => 
      item.id === id ? { ...item, label, isEditing: false } : item
    ));
  };

  // Update checklist item description
  const updateChecklistItemDescription = (id: number, description: string) => {
    setChecklist(checklist.map(item => 
      item.id === id ? { ...item, description } : item
    ));
  };

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

  // Simple markdown to HTML converter for preview
  const convertMarkdownToHTML = (markdown: string): string => {
    let html = markdown
      // Headers
      .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
      .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
      .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
      
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      
      // Lists
      .replace(/^- (.*?)$/gm, '<li>$1</li>')
      .replace(/^\d+\. (.*?)$/gm, '<li>$1</li>')
      
      // Links
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
      
      // Line breaks
      .replace(/\n/g, '<br/>');
    
    // Wrap lists in ul/ol tags
    html = html
      .replace(/(<li>.*?<\/li>)/g, '<ul>$1</ul>')
      .replace(/<\/li><br\/><li>/g, '</li><li>')
      .replace(/<\/ul><br\/><ul>/g, '</ul><ul>');
    
    return html;
  };

  // Process notes for rendering when they change
  useEffect(() => {
    setRenderedNotes(convertMarkdownToHTML(notes));
  }, [notes]);

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="checklist" className="w-full h-full flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Notes & Agenda</h2>
          <TabsList>
            <TabsTrigger value="checklist">
              <CheckSquare size={16} className="mr-1" /> Checklist
            </TabsTrigger>
            <TabsTrigger value="notes">
              <Pencil size={16} className="mr-1" /> Notes
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-grow">
          <TabsContent value="checklist" className="mt-0">
            <div className="bg-muted rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">Call Structure</h3>
                <Button variant="ghost" size="sm" onClick={addChecklistItem} title="Add step">
                  <Plus size={16} />
                </Button>
              </div>
              <div className="space-y-4">
                {checklist.map((item) => (
                  <div key={item.id} className="space-y-1">
                    <div className="flex items-start space-x-2">
                      <Checkbox 
                        id={`item-${item.id}`} 
                        checked={item.completed} 
                        onCheckedChange={() => toggleChecklistItem(item.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-grow">
                        {item.isEditing ? (
                          <Input 
                            defaultValue={item.label}
                            className="h-7 py-1 px-2 text-sm"
                            onBlur={(e) => saveChecklistItemLabel(item.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                saveChecklistItemLabel(item.id, e.currentTarget.value);
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          <label 
                            htmlFor={`item-${item.id}`}
                            className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                            onClick={() => startEditingChecklistItem(item.id)}
                          >
                            {item.label}
                          </label>
                        )}
                      </div>
                      <div className="flex space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          onClick={() => moveChecklistItem(item.id, "up")}
                        >
                          <ArrowUp size={14} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          onClick={() => moveChecklistItem(item.id, "down")}
                        >
                          <ArrowDown size={14} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-destructive" 
                          onClick={() => deleteChecklistItem(item.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                    <Input
                      placeholder="Add description (optional)"
                      value={item.description || ''}
                      onChange={(e) => updateChecklistItemDescription(item.id, e.target.value)}
                      className="ml-7 text-xs h-6 py-1 px-2 bg-muted/70"
                    />
                  </div>
                ))}
              </div>
            </div>

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
          </TabsContent>

          <TabsContent value="notes" className="h-full mt-0">
            <div className="flex flex-col h-full">
              <Textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-1/2 min-h-40 bg-muted border-input resize-none font-mono mb-4"
                placeholder="Take your meeting notes here..."
              />
              
              <div className="h-1/2 bg-muted border border-input rounded-md p-4 overflow-auto">
                <div 
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: renderedNotes }}
                />
              </div>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};

export default NotesPanel;
