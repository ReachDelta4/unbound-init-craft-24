
import React, { useState } from "react";
import { Pencil, Plus, Trash2, ArrowDown, ArrowUp } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChecklistItem {
  id: number;
  label: string;
  completed: boolean;
  description?: string;
  isEditing?: boolean;
}

const ChecklistPanel = () => {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: 1, label: "Introduction", completed: true, description: "Brief company overview" },
    { id: 2, label: "Understand client needs", completed: true, description: "Ask about pain points" },
    { id: 3, label: "Present key features", completed: false },
    { id: 4, label: "Address pricing questions", completed: false },
    { id: 5, label: "Discuss implementation timeline", completed: false },
    { id: 6, label: "Agree on next steps", completed: false },
  ]);

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

  return (
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
  );
};

export default ChecklistPanel;
