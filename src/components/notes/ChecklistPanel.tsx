
import React, { useState, useEffect } from "react";
import { MoreHorizontal, Pencil, Plus, Trash2, ArrowDown, ArrowUp } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChecklistItem {
  id: number;
  label: string;
  completed: boolean;
  description?: string;
  isEditing?: boolean;
  parentId?: number | null;
  children?: number[];
  isDescriptionOpen?: boolean;
}

const ChecklistPanel = () => {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: 1, label: "Introduction", completed: true, description: "Brief company overview", children: [], isDescriptionOpen: false },
    { id: 2, label: "Understand client needs", completed: true, description: "Ask about pain points", children: [3, 4], isDescriptionOpen: false },
    { id: 3, label: "Present key features", completed: false, parentId: 2, children: [], isDescriptionOpen: false },
    { id: 4, label: "Address pricing questions", completed: false, parentId: 2, children: [], isDescriptionOpen: false },
    { id: 5, label: "Discuss implementation timeline", completed: false, children: [], isDescriptionOpen: false },
    { id: 6, label: "Agree on next steps", completed: false, children: [], isDescriptionOpen: false },
  ]);

  // Toggle checklist item completion
  const toggleChecklistItem = (id: number, completed: boolean) => {
    const updatedChecklist = [...checklist];
    const itemIndex = updatedChecklist.findIndex(item => item.id === id);
    
    if (itemIndex === -1) return;
    
    updatedChecklist[itemIndex].completed = completed;
    
    // Update children if this is a parent
    if (updatedChecklist[itemIndex].children && updatedChecklist[itemIndex].children!.length > 0) {
      updatedChecklist[itemIndex].children!.forEach(childId => {
        const childIndex = updatedChecklist.findIndex(item => item.id === childId);
        if (childIndex !== -1) {
          updatedChecklist[childIndex].completed = completed;
        }
      });
    }
    
    // Update parent if this is a child
    const parentId = updatedChecklist[itemIndex].parentId;
    if (parentId) {
      const parentIndex = updatedChecklist.findIndex(item => item.id === parentId);
      if (parentIndex !== -1) {
        // Check if all siblings are completed
        const allChildrenCompleted = updatedChecklist
          .filter(item => item.parentId === parentId)
          .every(item => item.completed);
        
        updatedChecklist[parentIndex].completed = allChildrenCompleted;
      }
    }
    
    setChecklist(updatedChecklist);
  };

  // Toggle description visibility
  const toggleDescription = (id: number) => {
    setChecklist(checklist.map(item => 
      item.id === id ? { ...item, isDescriptionOpen: !item.isDescriptionOpen } : item
    ));
  };

  // Add new checklist item
  const addChecklistItem = () => {
    const newId = checklist.length > 0 ? Math.max(...checklist.map(item => item.id)) + 1 : 1;
    setChecklist([...checklist, { 
      id: newId, 
      label: "New step", 
      completed: false, 
      isEditing: true,
      children: [],
      isDescriptionOpen: false
    }]);
  };

  // Delete checklist item
  const deleteChecklistItem = (id: number) => {
    const itemToDelete = checklist.find(item => item.id === id);
    if (!itemToDelete) return;

    // First, handle the parent-child relationship
    if (itemToDelete.parentId) {
      // If it's a child, remove it from parent's children array
      setChecklist(checklist.map(item => 
        item.id === itemToDelete.parentId 
          ? { ...item, children: item.children!.filter(childId => childId !== id) } 
          : item
      ));
    }

    // Then remove the item and all its children
    const idsToRemove = new Set<number>([id]);
    
    // Recursively find all children to remove
    const findChildrenToRemove = (parentId: number) => {
      checklist.forEach(item => {
        if (item.parentId === parentId) {
          idsToRemove.add(item.id);
          findChildrenToRemove(item.id);
        }
      });
    };
    
    findChildrenToRemove(id);
    setChecklist(checklist.filter(item => !idsToRemove.has(item.id)));
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

  // Get indentation level based on parent-child relationship
  const getItemIndentation = (item: ChecklistItem): string => {
    return item.parentId ? "ml-6" : "";
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
          <div key={item.id} className={`space-y-1 ${getItemIndentation(item)}`}>
            <div className="flex items-start space-x-2">
              <Checkbox 
                id={`item-${item.id}`} 
                checked={item.completed} 
                onCheckedChange={(checked) => toggleChecklistItem(item.id, checked === true)}
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreHorizontal size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => moveChecklistItem(item.id, "up")}>
                    <ArrowUp size={14} className="mr-2" /> Move Up
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => moveChecklistItem(item.id, "down")}>
                    <ArrowDown size={14} className="mr-2" /> Move Down
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => deleteChecklistItem(item.id)}
                    className="text-destructive"
                  >
                    <Trash2 size={14} className="mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {(item.description || '') !== '' && (
              <Collapsible 
                open={item.isDescriptionOpen} 
                onOpenChange={() => toggleDescription(item.id)}
                className="ml-7"
              >
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-5 p-0 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {item.isDescriptionOpen ? "Hide details" : "Show details"}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <Input
                    placeholder="Add description (optional)"
                    value={item.description || ''}
                    onChange={(e) => updateChecklistItemDescription(item.id, e.target.value)}
                    className="text-xs h-6 py-1 px-2 bg-muted/70 mt-1"
                  />
                </CollapsibleContent>
              </Collapsible>
            )}
            {!item.description && (
              <div className="ml-7">
                <Input
                  placeholder="Add description (optional)"
                  value={''}
                  onChange={(e) => updateChecklistItemDescription(item.id, e.target.value)}
                  className="text-xs h-6 py-1 px-2 bg-muted/70"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChecklistPanel;
