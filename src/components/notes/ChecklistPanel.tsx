
import React, { useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChecklistState } from "./checklist/useChecklistState";
import ChecklistItem from "./checklist/ChecklistItem";
import LockableHeader from "./LockableHeader";
import { useNotesState } from "@/hooks/use-notes-state";

const ChecklistPanel = () => {
  const { 
    checklist, 
    toggleChecklistItem, 
    toggleItemOpen, 
    addChecklistItem, 
    deleteChecklistItem, 
    moveChecklistItem, 
    startEditingChecklistItem, 
    saveChecklistItemLabel, 
    setChecklist
  } = useChecklistState();

  const {
    saveNote,
    isNoteLocked,
    toggleNoteLock,
    notes,
    isLoading
  } = useNotesState();

  const isLocked = isNoteLocked('checklist');

  // Load checklist from database if it exists
  useEffect(() => {
    if (!isLoading) {
      const checklistNote = notes.find(note => note.note_type === 'checklist');
      if (checklistNote && checklistNote.content) {
        setChecklist(checklistNote.content);
      }
    }
  }, [notes, isLoading, setChecklist]);

  // Save checklist to database when it changes
  useEffect(() => {
    if (checklist.length > 0) {
      saveNote('checklist', checklist, isLocked);
    }
  }, [checklist, isLocked, saveNote]);

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
        />
      );
    });
  };

  const handleToggleLock = () => {
    toggleNoteLock('checklist');
  };

  return (
    <div className="bg-muted rounded-lg p-4 mb-4">
      <LockableHeader
        title="Call Structure"
        isLocked={isLocked}
        onToggleLock={handleToggleLock}
        onAddItem={() => addChecklistItem()}
        showAddButton={true}
      />
      <div className="space-y-4 group">
        {renderChecklistItems()}
      </div>
    </div>
  );
};

export default ChecklistPanel;
