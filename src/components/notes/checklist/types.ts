
export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  parentId?: string | null;
  children: string[];
  isEditing?: boolean;
  isOpen?: boolean;
}

// Alias for backward compatibility
export type ChecklistItemType = ChecklistItem;
