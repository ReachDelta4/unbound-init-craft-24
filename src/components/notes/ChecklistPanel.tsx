import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LockableHeader from "./LockableHeader";
import { useNotesState } from "@/hooks/use-notes-state";
import { useMeetingState } from "@/hooks/use-meeting-state";

const ChecklistPanel = () => {
  const { activeMeeting } = useMeetingState();
  const meetingId = activeMeeting?.id || null;
  const { checklist, setChecklist } = useNotesState(meetingId, activeMeeting);

  // Add new checklist item
  const handleAddItem = () => {
    const newId = crypto.randomUUID().slice(0, 8);
    setChecklist([
      ...checklist,
      { id: newId, label: "New item", completed: false, parentId: null, children: [], isEditing: true, isOpen: false },
    ]);
  };

  // Delete checklist item
  const handleDeleteItem = (id: string) => {
    setChecklist(checklist.filter(item => item.id !== id));
  };

  // Edit checklist item
  const handleEditItem = (id: string) => {
    setChecklist(checklist.map(item =>
      item.id === id ? { ...item, isEditing: true } : item
    ));
  };

  // Save checklist item
  const handleSaveItem = (id: string, label: string) => {
    setChecklist(checklist.map(item =>
      item.id === id ? { ...item, label, isEditing: false } : item
    ));
  };

  // Toggle completed
  const handleToggleCompleted = (id: string) => {
    setChecklist(checklist.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  return (
    <div className="bg-muted rounded-lg p-4">
      <LockableHeader
        title="Checklist"
        onAddItem={handleAddItem}
        showAddButton={true}
      />
      <div className="space-y-2">
        {checklist.map((item) => (
          <div key={item.id} className="flex items-start group">
            <input
              type="checkbox"
              checked={item.completed}
              onChange={() => handleToggleCompleted(item.id)}
              className="mr-2 mt-1"
            />
            <div className="flex-grow">
              {item.isEditing ? (
                <Input
                  defaultValue={item.label}
                  className="text-sm"
                  onBlur={(e) => handleSaveItem(item.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSaveItem(item.id, e.currentTarget.value);
                    }
                  }}
                  autoFocus
                />
              ) : (
                <p
                  className="text-sm cursor-text"
                  onClick={() => handleEditItem(item.id)}
                >
                  {item.label}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteItem(item.id);
              }}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChecklistPanel;
