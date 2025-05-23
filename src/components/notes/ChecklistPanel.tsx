
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useChecklistState } from "./checklist/useChecklistState";
import ChecklistItem from "./checklist/ChecklistItem";
import LockableHeader from "./LockableHeader";
import { useNotesState } from "@/hooks/use-notes-state";
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

  const { saveNote, notes, isLoading } = useNotesState();
  const { toast } = useToast();
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
      setInitialLoadDone(true);
    }
  }, [notes, isLoading, setChecklist]);

  // Save checklist to database when it changes
  useEffect(() => {
    const saveChecklistToDatabase = async () => {
      if (initialLoadDone) {
        try {
          await saveNote('checklist', checklist);
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
  }, [checklist, saveNote, toast, initialLoadDone]);

  // Handle adding a new checklist item
  const handleAddItem = () => {
    addChecklistItem();
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
          allItems={checklist}
        />
      );
    });
  };

  return (
    <div className="bg-muted rounded-lg p-4 mb-4">
      <LockableHeader
        title="Call Structure"
        onAddItem={handleAddItem}
        showAddButton={true}
      />
      <div className="space-y-4 group">
        {renderChecklistItems()}
        {checklist.length === 0 && (
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
