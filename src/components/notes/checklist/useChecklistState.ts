
import { useState } from "react";
import { ChecklistItem } from "./types";

export const useChecklistState = () => {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);

  // Toggle checklist item completion
  const toggleChecklistItem = (id: string, completed: boolean) => {
    const updatedChecklist = [...checklist];
    const itemIndex = updatedChecklist.findIndex(item => item.id === id);
    
    if (itemIndex === -1) return;
    
    updatedChecklist[itemIndex] = { 
      ...updatedChecklist[itemIndex], 
      completed 
    };
    
    // Update children if this is a parent
    if (updatedChecklist[itemIndex].children && updatedChecklist[itemIndex].children.length > 0) {
      const updateChildrenRecursively = (childIds: string[]) => {
        childIds.forEach(childId => {
          const childIndex = updatedChecklist.findIndex(item => item.id === childId);
          if (childIndex !== -1) {
            updatedChecklist[childIndex] = {
              ...updatedChecklist[childIndex],
              completed
            };
            
            if (updatedChecklist[childIndex].children.length > 0) {
              updateChildrenRecursively(updatedChecklist[childIndex].children);
            }
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
        
        updatedChecklist[parentIndex] = {
          ...updatedChecklist[parentIndex],
          completed: allChildrenCompleted
        };
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
    // Generate a new unique ID without relying on Math.max()
    const newId = crypto.randomUUID().slice(0, 8);
    
    const newItem: ChecklistItem = { 
      id: newId, 
      label: "New item", 
      completed: false, 
      parentId: parentId,
      isEditing: true,
      children: [],
      isOpen: false
    };

    // If this is a child, add it to parent's children array
    if (parentId) {
      setChecklist(prevList => {
        const updatedList = [...prevList];
        const parentIndex = updatedList.findIndex(item => item.id === parentId);
        
        if (parentIndex !== -1) {
          // Update parent to include new child and ensure it's open
          updatedList[parentIndex] = {
            ...updatedList[parentIndex],
            children: [...updatedList[parentIndex].children, newId],
            isOpen: true // Open parent to show new child
          };
        }
        
        // Add the new item to the list
        return [...updatedList, newItem];
      });
    } else {
      // Add as a top-level item
      setChecklist(prevList => [...prevList, newItem]);
    }
  };

  // Delete checklist item
  const deleteChecklistItem = (id: string) => {
    // First find the item to get its parent info
    const itemToDelete = checklist.find(item => item.id === id);
    if (!itemToDelete) return;

    setChecklist(prevList => {
      let updatedList = [...prevList];
      
      // If it has a parent, update the parent's children array
      if (itemToDelete.parentId) {
        updatedList = updatedList.map(item => 
          item.id === itemToDelete.parentId
            ? {
                ...item,
                children: item.children.filter(childId => childId !== id)
              }
            : item
        );
      }
      
      // Remove the item and all its children recursively
      const idsToRemove = new Set<string>([id]);
      
      // Find all descendants
      const findChildrenToRemove = (parentId: string) => {
        updatedList.forEach(item => {
          if (item.parentId === parentId) {
            idsToRemove.add(item.id);
            findChildrenToRemove(item.id);
          }
        });
      };
      
      findChildrenToRemove(id);
      
      // Remove all identified items
      return updatedList.filter(item => !idsToRemove.has(item.id));
    });
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
      return; // Already at the edge, can't move further
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
    setChecklist(prevList => 
      prevList.map(item => 
        item.id === id ? { ...item, isEditing: true } : item
      )
    );
  };

  // Save checklist item label
  const saveChecklistItemLabel = (id: string, label: string) => {
    setChecklist(prevList => 
      prevList.map(item => 
        item.id === id ? { ...item, label, isEditing: false } : item
      )
    );
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
