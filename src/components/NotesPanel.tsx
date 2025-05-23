
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, CheckSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChecklistPanel from "./notes/ChecklistPanel";
import QuestionsPanel from "./notes/QuestionsPanel";
import MarkdownEditor from "./notes/MarkdownEditor";
import { useNotesState } from "@/hooks/use-notes-state";

interface NotesPanelProps {
  isCallActive: boolean;
}

const NotesPanel = ({ isCallActive }: NotesPanelProps) => {
  const { resetNotes } = useNotesState();
  
  // Reset notes when call starts
  React.useEffect(() => {
    if (isCallActive) {
      resetNotes();
    }
  }, [isCallActive, resetNotes]);
  
  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="checklist" className="w-full h-full flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Notes & Agenda</h2>
          <TabsList>
            <TabsTrigger value="checklist">
              <CheckSquare size={16} className="mr-1" /> Checklist
            </TabsTrigger>
            <TabsTrigger value="notes">
              <Pencil size={16} className="mr-1" /> Notes
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-grow">
          <TabsContent value="checklist" className="mt-0">
            <ChecklistPanel />
            <QuestionsPanel />
          </TabsContent>

          <TabsContent value="notes" className="h-full mt-0">
            <MarkdownEditor />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};

export default NotesPanel;
