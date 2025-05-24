
import { useState, useRef, useCallback } from "react";
import { ChecklistItem } from "./types";

export const useChecklistState = () => {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const savePendingRef = useRef<NodeJS.Timeout | null>(null);
  const [pendingChanges, setPendingChanges] = useState(false);
  
  // Debounced setter for checklist to prevent rapid UI updates
  const setChecklistWithDebounce = useCallback((newChecklist: ChecklistItem[]) => {
    // Immediately update UI for responsiveness
    setChecklist(newChecklist);
    
    // Mark that there are pending changes to save
    setPendingChanges(true);
  }, []);
  
  // Toggle checklist item completion with optimistic updates
  const toggleChecklistItem = useCallback((id: string, completed: boolean) => {
    setChecklistWithDebounce(prevList => {
      const updatedChecklist = [...prevList];
      const itemIndex = updatedChecklist.findIndex(item => item.id === id);
      
      if (itemIndex === -1) return prevList;
      
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
      
      return updatedChecklist;
    });
  }, [setChecklistWithDebounce]);

  // Toggle item open/closed state
  const toggleItemOpen = useCallback((id: string) => {
    setChecklistWithDebounce(prevList => 
      prevList.map(item => 
        item.id === id ? { ...item, isOpen: !item.isOpen } : item
      )
    );
  }, [setChecklistWithDebounce]);

  // Add new checklist item
  const addChecklistItem = useCallback((parentId?: string) => {
    // Generate a new unique ID
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
      setChecklistWithDebounce(prevList => {
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
      setChecklistWithDebounce(prevList => [...prevList, newItem]);
    }
  }, [setChecklistWithDebounce]);

  // Delete checklist item
  const deleteChecklistItem = useCallback((id: string) => {
    // Find the item to get its parent info
    setChecklistWithDebounce(prevList => {
      const itemToDelete = prevList.find(item => item.id === id);
      if (!itemToDelete) return prevList;

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
  }, [setChecklistWithDebounce]);

  // Move checklist item up or down
  const moveChecklistItem = useCallback((id: string, direction: "up" | "down") => {
    setChecklistWithDebounce(prevList => {
      const index = prevList.findIndex(item => item.id === id);
      if (index === -1) return prevList;
      
      const currentItem = prevList[index];
      
      // Get siblings (items with the same parent)
      const siblings = prevList.filter(item => item.parentId === currentItem.parentId);
      const siblingIndex = siblings.findIndex(item => item.id === id);
      
      if ((direction === "up" && siblingIndex === 0) || 
          (direction === "down" && siblingIndex === siblings.length - 1)) {
        return prevList; // Already at the edge, can't move further
      }

      // Find the sibling to swap with
      const targetSiblingIndex = direction === "up" ? siblingIndex - 1 : siblingIndex + 1;
      const targetSibling = siblings[targetSiblingIndex];
      
      // Get the indices in the full checklist
      const targetIndex = prevList.findIndex(item => item.id === targetSibling.id);
      
      // Create a new array with swapped items
      const newChecklist = [...prevList];
      [newChecklist[index], newChecklist[targetIndex]] = [newChecklist[targetIndex], newChecklist[index]];
      
      return newChecklist;
    });
  }, [setChecklistWithDebounce]);

  // Edit checklist item label
  const startEditingChecklistItem = useCallback((id: string) => {
    setChecklistWithDebounce(prevList => 
      prevList.map(item => 
        item.id === id ? { ...item, isEditing: true } : item
      )
    );
  }, [setChecklistWithDebounce]);

  // Save checklist item label
  const saveChecklistItemLabel = useCallback((id: string, label: string) => {
    setChecklistWithDebounce(prevList => 
      prevList.map(item => 
        item.id === id ? { ...item, label, isEditing: false } : item
      )
    );
  }, [setChecklistWithDebounce]);

  // Return the function to let external components know if there are pending changes
  const hasPendingChanges = () => pendingChanges;
  
  // Reset pending changes flag
  const resetPendingChanges = () => {
    setPendingChanges(false);
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
    saveChecklistItemLabel,
    hasPendingChanges,
    resetPendingChanges
  };
};
