
export interface ChecklistItem {
  id: number;
  label: string;
  completed: boolean;
  parentId?: number | null;
  children: number[];
  isEditing?: boolean;
  isOpen?: boolean;
}
