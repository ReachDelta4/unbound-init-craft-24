
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Copy, Check } from "lucide-react";
import { useNotesState } from "@/hooks/use-notes-state";
import { useToast } from "@/hooks/use-toast";

const MarkdownEditor = () => {
  const [markdown, setMarkdown] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('edit');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const { saveNote, notes, isLoading } = useNotesState();
  const { toast } = useToast();

  // Load markdown from database
  useEffect(() => {
    if (!isLoading) {
      const markdownNote = notes.find(note => note.note_type === 'markdown');
      if (markdownNote && markdownNote.content && markdownNote.content.raw) {
        setMarkdown(markdownNote.content.raw);
      }
    }
  }, [notes, isLoading]);

  // Save markdown to database
  const saveMarkdown = async () => {
    setIsSaving(true);
    try {
      await saveNote('markdown', { raw: markdown });
      toast({
        title: "Notes saved",
        description: "Your notes have been saved.",
      });
    } catch (error) {
      console.error('Error saving markdown:', error);
      toast({
        title: "Failed to save notes",
        description: "There was an error saving your notes.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save markdown whenever it changes
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (markdown) {
        saveNote('markdown', { raw: markdown }).catch(err => 
          console.error('Auto-save error:', err)
        );
      }
    }, 1000);

    return () => clearTimeout(debounceTimer);
  }, [markdown, saveNote]);

  // Copy markdown to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(markdown)
      .then(() => {
        setIsCopied(true);
        toast({
          title: "Copied to clipboard",
          description: "The notes have been copied to your clipboard.",
        });
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch(err => {
        console.error('Error copying to clipboard:', err);
        toast({
          title: "Failed to copy",
          description: "There was an error copying to your clipboard.",
          variant: "destructive",
        });
      });
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="bg-card border rounded-lg shadow-sm h-full flex flex-col">
      <div className="flex justify-between items-center p-4 border-b">
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList>
            <TabsTrigger value="edit">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex gap-2 ml-2">
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            className="gap-1"
          >
            {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {isCopied ? "Copied" : "Copy"}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={saveMarkdown}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="flex-grow overflow-hidden">
        <TabsContent value="edit" className="h-full p-0 m-0 border-none">
          <Textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder="# Meeting Notes
            
Use markdown to format your notes:
- Use **bold** for important points
- Create lists like this
- Add ### headings for sections

Record action items:
- [ ] Task to be completed
- [x] Completed task"
            className="h-full min-h-[calc(100%-1rem)] p-4 resize-none font-mono text-sm border-0 focus-visible:ring-0 rounded-none"
          />
        </TabsContent>
        
        <TabsContent value="preview" className="h-full p-0 m-0 border-none">
          <div className="p-4 h-full overflow-auto markdown-content">
            <ReactMarkdown>
              {markdown || "No content to preview. Start typing in the edit tab."}
            </ReactMarkdown>
          </div>
        </TabsContent>
      </div>
    </div>
  );
};

export default MarkdownEditor;
