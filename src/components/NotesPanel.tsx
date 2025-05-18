
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, CheckSquare } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

interface NotesPanelProps {
  isCallActive: boolean;
}

const NotesPanel = ({ isCallActive }: NotesPanelProps) => {
  const [notes, setNotes] = useState<string>(
    "# Meeting Notes\n\nKey points:\n- Client interested in our enterprise plan\n- Need to follow up with pricing details\n- Technical integration is a priority\n"
  );
  
  const [checklist, setChecklist] = useState([
    { id: 1, label: "Introduction", completed: true },
    { id: 2, label: "Understand client needs", completed: true },
    { id: 3, label: "Present key features", completed: false },
    { id: 4, label: "Address pricing questions", completed: false },
    { id: 5, label: "Discuss implementation timeline", completed: false },
    { id: 6, label: "Agree on next steps", completed: false },
  ]);

  const toggleChecklistItem = (id: number) => {
    setChecklist(checklist.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="checklist" className="w-full h-full flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Notes & Agenda</h2>
          <TabsList className="bg-slate-700">
            <TabsTrigger value="checklist" className="data-[state=active]:bg-slate-600">
              <CheckSquare size={16} className="mr-1" /> Checklist
            </TabsTrigger>
            <TabsTrigger value="notes" className="data-[state=active]:bg-slate-600">
              <Pencil size={16} className="mr-1" /> Notes
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="checklist" className="flex-grow mt-0">
          <div className="bg-slate-700 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-medium mb-2 text-slate-300">Call Structure</h3>
            <div className="space-y-2">
              {checklist.map((item) => (
                <div key={item.id} className="flex items-start space-x-2">
                  <Checkbox 
                    id={`item-${item.id}`} 
                    checked={item.completed} 
                    onCheckedChange={() => toggleChecklistItem(item.id)}
                    className="mt-0.5"
                  />
                  <label 
                    htmlFor={`item-${item.id}`}
                    className={`text-sm ${item.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}
                  >
                    {item.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-700 rounded-lg p-4">
            <h3 className="text-sm font-medium mb-2 text-slate-300">Key Questions to Ask</h3>
            <ul className="space-y-1 ml-5 list-disc text-sm">
              <li>What are your biggest challenges with your current solution?</li>
              <li>What's your timeline for implementation?</li>
              <li>Who else is involved in the decision-making process?</li>
              <li>What's your budget range for this project?</li>
              <li>What would success look like for you in 6 months?</li>
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="notes" className="flex-grow h-full mt-0">
          <Textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="h-full bg-slate-700 border-slate-600 resize-none font-mono"
            placeholder="Take your meeting notes here..."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotesPanel;
