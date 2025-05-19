
import React, { useState } from "react";
import { MoreHorizontal, Plus, Trash2, ArrowDown, ArrowUp, ChevronRight, ChevronDown } from "lucide-react";
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
  parentId?: number | null;
  children: number[];
  isEditing?: boolean;
  isOpen?: boolean;
}

const ChecklistPanel = () => {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: 1, label: "Introduction", completed: true, children: [], isOpen: false },
    { id: 2, label: "Present key features", completed: false, children: [3, 4], isOpen: false },
    { id: 3, label: "Technical details", completed: false, parentId: 2, children: [], isOpen: false },
    { id: 4, label: "Benefits", completed: false, parentId: 2, children: [], isOpen: false },
    { id: 5, label: "Endoscopy", completed: false, children: [6], isOpen: false },
    { id: 6, label: "Advanced techniques", completed: false, parentId: 5, children: [], isOpen: false },
  ]);

  // Toggle checklist item completion
  const toggleChecklistItem = (id: number, completed: boolean) => {
    const updatedChecklist = [...checklist];
    const itemIndex = updatedChecklist.findIndex(item => item.id === id);
    
    if (itemIndex === -1) return;
    
    updatedChecklist[itemIndex].completed = completed;
    
    // Update children if this is a parent
    if (updatedChecklist[itemIndex].children && updatedChecklist[itemIndex].children.length > 0) {
      const updateChildrenRecursively = (childIds: number[]) => {
        childIds.forEach(childId => {
          const childIndex = updatedChecklist.findIndex(item => item.id === childId);
          if (childIndex !== -1) {
            updatedChecklist[childIndex].completed = completed;
            updateChildrenRecursively(updatedChecklist[childIndex].children);
          }
        });
      };
      
      updateChildrenRecursively(updatedChecklist[itemIndex].children);
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

  // Toggle item open/closed state
  const toggleItemOpen = (id: number) => {
    setChecklist(checklist.map(item => 
      item.id === id ? { ...item, isOpen: !item.isOpen } : item
    ));
  };

  // Add new checklist item
  const addChecklistItem = (parentId?: number) => {
    const newId = checklist.length > 0 ? Math.max(...checklist.map(item => item.id)) + 1 : 1;
    const newItem: ChecklistItem = { 
      id: newId, 
      label: "New item", 
      completed: false, 
      parentId: parentId,
      isEditing: true,
      children: [],
      isOpen: false
    };

    const updatedChecklist = [...checklist, newItem];
    
    // If this is a child, update the parent's children array
    if (parentId) {
      const parentIndex = updatedChecklist.findIndex(item => item.id === parentId);
      if (parentIndex !== -1) {
        updatedChecklist[parentIndex] = {
          ...updatedChecklist[parentIndex],
          children: [...updatedChecklist[parentIndex].children, newId],
          isOpen: true // Ensure parent is open to show the new child
        };
      }
    }
    
    setChecklist(updatedChecklist);
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
          ? { ...item, children: item.children.filter(childId => childId !== id) } 
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
    if (index === -1) return;
    
    const currentItem = checklist[index];
    
    // Get siblings (items with the same parent)
    const siblings = checklist.filter(item => item.parentId === currentItem.parentId);
    const siblingIndex = siblings.findIndex(item => item.id === id);
    
    if ((direction === "up" && siblingIndex === 0) || 
        (direction === "down" && siblingIndex === siblings.length - 1)) {
      return;
    }

    // Find the sibling to swap with
    const targetSiblingIndex = direction === "up" ? siblingIndex - 1 : siblingIndex + 1;
    const targetSibling = siblings[targetSiblingIndex];
    
    // Get the indices in the full checklist
    const targetIndex = checklist.findIndex(item => item.id === targetSibling.id);
    
    // Create a new array with swapped items
    const newChecklist = [...checklist];
    [newChecklist[index], newChecklist[targetIndex]] = [newChecklist[targetIndex], newChecklist[index]];
    
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

  // Get indentation level based on parent-child relationship
  const getItemIndentation = (item: ChecklistItem): string => {
    return item.parentId ? "ml-6" : "";
  };

  // Render checklist items (recursively for better organization)
  const renderChecklistItems = () => {
    // First render top level items (no parent)
    const topLevelItems = checklist.filter(item => !item.parentId);
    
    return topLevelItems.map(item => (
      <div key={item.id} className="space-y-1">
        <div className="flex items-start space-x-2">
          <Checkbox 
            id={`item-${item.id}`} 
            checked={item.completed} 
            onCheckedChange={(checked) => toggleChecklistItem(item.id, checked === true)}
            className="mt-0.5"
          />
          
          <Collapsible
            open={item.isOpen}
            onOpenChange={() => toggleItemOpen(item.id)}
            className="flex-grow"
          >
            <div className="flex items-center gap-1">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  {item.isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              
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
                <span
                  className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                  onDoubleClick={() => startEditingChecklistItem(item.id)}
                >
                  {item.label}
                </span>
              )}
            </div>
            
            <CollapsibleContent className="space-y-2 mt-1">
              {/* Render child items */}
              {item.children.map(childId => {
                const childItem = checklist.find(i => i.id === childId);
                if (!childItem) return null;
                
                return (
                  <div key={childId} className="ml-6 flex items-start space-x-2">
                    <Checkbox 
                      id={`item-${childId}`} 
                      checked={childItem.completed} 
                      onCheckedChange={(checked) => toggleChecklistItem(childId, checked === true)}
                      className="mt-0.5"
                    />
                    <div className="flex-grow">
                      {childItem.isEditing ? (
                        <Input 
                          defaultValue={childItem.label}
                          className="h-7 py-1 px-2 text-sm"
                          onBlur={(e) => saveChecklistItemLabel(childId, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              saveChecklistItemLabel(childId, e.currentTarget.value);
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <span
                          className={`text-sm ${childItem.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                          onDoubleClick={() => startEditingChecklistItem(childId)}
                        >
                          {childItem.label}
                        </span>
                      )}
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                          <MoreHorizontal size={14} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => moveChecklistItem(childId, "up")}>
                          <ArrowUp size={14} className="mr-2" /> Move Up
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => moveChecklistItem(childId, "down")}>
                          <ArrowDown size={14} className="mr-2" /> Move Down
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => deleteChecklistItem(childId)}
                          className="text-destructive"
                        >
                          <Trash2 size={14} className="mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
              
              {/* Add subtask button */}
              <div className="ml-6 flex items-center">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 px-2 text-xs flex items-center text-muted-foreground hover:text-foreground"
                  onClick={() => addChecklistItem(item.id)}
                >
                  <Plus size={14} className="mr-1" /> Add subtask
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
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
      </div>
    ));
  };

  return (
    <div className="bg-muted rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-muted-foreground">Call Structure</h3>
        <Button variant="ghost" size="sm" onClick={() => addChecklistItem()} title="Add item">
          <Plus size={16} />
        </Button>
      </div>
      <div className="space-y-4 group">
        {renderChecklistItems()}
      </div>
    </div>
  );
};

export default ChecklistPanel;
