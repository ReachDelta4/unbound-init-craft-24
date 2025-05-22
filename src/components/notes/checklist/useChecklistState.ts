
import { useState } from "react";
import { ChecklistItem } from "./types";

export const useChecklistState = () => {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);

  // Toggle checklist item completion
  const toggleChecklistItem = (id: string, completed: boolean) => {
    const updatedChecklist = [...checklist];
    const itemIndex = updatedChecklist.findIndex(item => item.id === id);
    
    if (itemIndex === -1) return;
    
    updatedChecklist[itemIndex].completed = completed;
    
    // Update children if this is a parent
    if (updatedChecklist[itemIndex].children && updatedChecklist[itemIndex].children.length > 0) {
      const updateChildrenRecursively = (childIds: string[]) => {
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
  const toggleItemOpen = (id: string) => {
    setChecklist(checklist.map(item => 
      item.id === id ? { ...item, isOpen: !item.isOpen } : item
    ));
  };

  // Add new checklist item
  const addChecklistItem = (parentId?: string) => {
    const newId = String(checklist.length > 0 ? Math.max(...checklist.map(item => parseInt(item.id))) + 1 : 1);
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
  const deleteChecklistItem = (id: string) => {
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
    const idsToRemove = new Set<string>([id]);
    
    // Recursively find all children to remove
    const findChildrenToRemove = (parentId: string) => {
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
  const moveChecklistItem = (id: string, direction: "up" | "down") => {
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
  const startEditingChecklistItem = (id: string) => {
    setChecklist(checklist.map(item => 
      item.id === id ? { ...item, isEditing: true } : item
    ));
  };

  // Save checklist item label
  const saveChecklistItemLabel = (id: string, label: string) => {
    setChecklist(checklist.map(item => 
      item.id === id ? { ...item, label, isEditing: false } : item
    ));
  };

  return {
    checklist,
    setChecklist,
    toggleChecklistItem,
    toggleItemOpen,
    addChecklistItem,
    deleteChecklistItem,
    moveChecklistItem,
    startEditingChecklistItem,
    saveChecklistItemLabel
  };
};
