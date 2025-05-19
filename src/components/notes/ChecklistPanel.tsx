
import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChecklistState } from "./checklist/useChecklistState";
import ChecklistItem from "./checklist/ChecklistItem";

const ChecklistPanel = () => {
  const { 
    checklist, 
    toggleChecklistItem, 
    toggleItemOpen, 
    addChecklistItem, 
    deleteChecklistItem, 
    moveChecklistItem, 
    startEditingChecklistItem, 
    saveChecklistItemLabel 
  } = useChecklistState();

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
        />
      );
    });
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
