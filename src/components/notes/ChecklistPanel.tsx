
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useChecklistState } from "./checklist/useChecklistState";
import ChecklistItem from "./checklist/ChecklistItem";
import LockableHeader from "./LockableHeader";
import { useNotesState } from "@/hooks/use-notes-state";
import { ChecklistItem as ChecklistItemType } from "./checklist/types";
import { useToast } from "@/hooks/use-toast";

const ChecklistPanel = () => {
  const { 
    checklist, 
    setChecklist,
    toggleChecklistItem, 
    toggleItemOpen, 
    addChecklistItem, 
    deleteChecklistItem, 
    moveChecklistItem, 
    startEditingChecklistItem, 
    saveChecklistItemLabel
  } = useChecklistState();

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

  // Load checklist from database if it exists
  useEffect(() => {
    if (!isLoading) {
      const checklistNote = notes.find(note => note.note_type === 'checklist');
      if (checklistNote && checklistNote.content) {
        try {
          // Ensure content is the expected format
          if (Array.isArray(checklistNote.content)) {
            setChecklist(checklistNote.content);
          }
        } catch (error) {
          console.error('Error setting checklist data:', error);
        }
      }
      
      // Update local lock state
      const locked = isNoteLocked('checklist');
      setIsLocked(locked);
      setInitialLoadDone(true);
    }
  }, [notes, isLoading, setChecklist, isNoteLocked]);

  // Save checklist to database when it changes
  useEffect(() => {
    const saveChecklistToDatabase = async () => {
      if (initialLoadDone && checklist.length > 0) {
        try {
          await saveNote('checklist', checklist, isLocked);
        } catch (error) {
          console.error('Error saving checklist:', error);
          toast({
            title: "Failed to save checklist",
            description: "There was an error saving your checklist items.",
            variant: "destructive",
          });
        }
      }
    };
    
    saveChecklistToDatabase();
  }, [checklist, isLocked, saveNote, toast, initialLoadDone]);

  // Handle toggling lock
  const handleToggleLock = async () => {
    try {
      const newLockState = await toggleNoteLock('checklist');
      setIsLocked(newLockState);
      toast({
        title: newLockState ? "Checklist locked" : "Checklist unlocked",
        description: newLockState 
          ? "The checklist will be preserved for future calls." 
          : "The checklist will be reset for new calls.",
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

  // Handle adding a new checklist item
  const handleAddItem = () => {
    if (!isLocked) {
      addChecklistItem();
    }
  };

  // Render checklist items (recursively for better organization)
  const renderChecklistItems = () => {
    // First render top level items (no parent)
    const topLevelItems = checklist.filter(item => !item.parentId);
    
    return topLevelItems.map(item => {
      // Get child items for this parent
      const childItems = checklist.filter(childItem => childItem.parentId === item.id);
      
      return (
        <ChecklistItem
          key={item.id}
          item={item}
          childItems={childItems}
          onToggleComplete={toggleChecklistItem}
          onToggleOpen={toggleItemOpen}
          onAddItem={addChecklistItem}
          onDeleteItem={deleteChecklistItem}
          onMoveItem={moveChecklistItem}
          onStartEditing={startEditingChecklistItem}
          onSaveLabel={saveChecklistItemLabel}
          disabled={isLocked}
          allItems={checklist} // Pass the entire checklist for recursive rendering
        />
      );
    });
  };

  return (
    <div className="bg-muted rounded-lg p-4 mb-4">
      <LockableHeader
        title="Call Structure"
        isLocked={isLocked}
        onToggleLock={handleToggleLock}
        onAddItem={handleAddItem}
        showAddButton={!isLocked}
      />
      <div className="space-y-4 group">
        {renderChecklistItems()}
        {!isLocked && checklist.length === 0 && (
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleAddItem}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add your first checklist item
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChecklistPanel;
