import React, { useState, useRef } from "react";
import { useNotesState } from "@/hooks/use-notes-state";
import { useMeetingState } from "@/hooks/use-meeting-state";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import TextareaAutosize from "react-textarea-autosize";
import remarkBreaks from "remark-breaks";
import jsPDF from "jspdf";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";
import { saveAs } from "file-saver";
import { markdownToDocxBlob } from "@/lib/markdown-to-docx";

const MarkdownEditor = () => {
  const { activeMeeting } = useMeetingState();
  const meetingId = activeMeeting?.id || null;
  const { markdown, setMarkdown } = useNotesState(meetingId, activeMeeting);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isHtmlCopied, setIsHtmlCopied] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(true);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const htmlPreviewRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  // Copy markdown to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1500);
  };

  // Copy rendered HTML (rich text) to clipboard
  const handleCopyHtml = async () => {
    if (htmlPreviewRef.current) {
      const html = htmlPreviewRef.current.innerHTML;
      try {
        await navigator.clipboard.write([
          new window.ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([htmlPreviewRef.current.innerText], { type: "text/plain" })
          })
        ]);
        setIsHtmlCopied(true);
        setTimeout(() => setIsHtmlCopied(false), 1500);
      } catch (err) {
        toast && toast({
          title: "Copy failed",
          description: "Could not copy rich text to clipboard.",
          variant: "destructive",
        });
      }
    }
  };

  // Export as PDF (text-based, not screenshot)
  const handleExportPdf = async () => {
    if (!htmlPreviewRef.current) return;
    const element = htmlPreviewRef.current;
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    await pdf.html(element, {
      x: 20,
      y: 20,
      html2canvas: { scale: 0.7, backgroundColor: null },
      callback: () => {
        pdf.save("notes.pdf");
      }
    });
  };

  // Import handler
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === "txt") {
      const text = await file.text();
      setMarkdown(text);
      setIsEditing(true);
    } else if (ext === "docx") {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      setMarkdown(result.value);
      setIsEditing(true);
    } else if (ext === "pdf") {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(" ") + "\n";
      }
      setMarkdown(text);
      setIsEditing(true);
    } else {
      toast && toast({
        title: "Unsupported file type",
        description: "Please upload a .txt, .docx, or .pdf file.",
        variant: "destructive",
      });
    }
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Focus textarea when switching to edit mode
  React.useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  // Handle blur to switch to preview
  const handleBlur = () => {
    setIsEditing(false);
  };

  // Handle click on preview to switch to edit
  const handlePreviewClick = () => {
    setIsEditing(true);
  };

  return (
    <div className="bg-muted rounded-lg p-4">
      <div className="flex gap-2 mb-2 justify-end">
        <Button size="sm" variant="outline" onClick={handleExportPdf}>Export PDF</Button>
        <label className="inline-block">
          <input
            type="file"
            accept=".txt,.docx,.pdf"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImport}
          />
          <Button size="sm" variant="outline" asChild>
            <span>Import</span>
          </Button>
        </label>
      </div>
      {isEditing ? (
        <TextareaAutosize
          ref={textareaRef}
          className="w-full min-h-[200px] max-h-[600px] p-3 rounded border border-input bg-background text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary font-mono mb-4"
          value={markdown}
          onChange={e => setMarkdown(e.target.value)}
          onBlur={handleBlur}
          placeholder="Type your notes in markdown..."
          spellCheck={true}
        />
      ) : (
        <div
          className="prose prose-invert prose-sm max-w-none bg-background p-3 rounded border border-input min-h-[10rem] cursor-text mb-4"
          onClick={handlePreviewClick}
          tabIndex={0}
          ref={htmlPreviewRef}
        >
          <ReactMarkdown remarkPlugins={[remarkBreaks]}>{markdown || "Start typing to see preview..."}</ReactMarkdown>
        </div>
      )}
      <div className="flex justify-end mt-2 gap-2">
        <Button size="sm" variant="outline" onClick={handleCopy}>
          {isCopied ? "Copied!" : "Copy Markdown"}
        </Button>
        <Button size="sm" variant="outline" onClick={handleCopyHtml}>
          {isHtmlCopied ? "Copied!" : "Copy Rich Text"}
        </Button>
      </div>
    </div>
  );
};

export default MarkdownEditor;
