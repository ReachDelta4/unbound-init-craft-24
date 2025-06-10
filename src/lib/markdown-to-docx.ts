import { Document, Packer, Paragraph, TextRun, HeadingLevel, ExternalHyperlink } from 'docx';

export interface MeetingNote {
  id: string;
  meetingId: string;
  text: string;
  createdAt: Date;
}

export interface MeetingChecklistItem {
  id: string;
  meetingId: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

export const convertMarkdownToDocx = async (markdownContent: string, title: string = 'Document'): Promise<Blob> => {
  const lines = markdownContent.split('\n');
  const paragraphs: Paragraph[] = [];

  lines.forEach((line) => {
    if (line.trim() === '') {
      paragraphs.push(new Paragraph({}));
      return;
    }

    // Handle headers
    if (line.startsWith('# ')) {
      paragraphs.push(new Paragraph({
        text: line.substring(2),
        heading: HeadingLevel.HEADING_1,
      }));
    } else if (line.startsWith('## ')) {
      paragraphs.push(new Paragraph({
        text: line.substring(3),
        heading: HeadingLevel.HEADING_2,
      }));
    } else if (line.startsWith('### ')) {
      paragraphs.push(new Paragraph({
        text: line.substring(4),
        heading: HeadingLevel.HEADING_3,
      }));
    } else {
      // Handle regular text with basic formatting
      const textRuns: TextRun[] = [];
      let currentText = line;

      // Simple link handling
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      let lastIndex = 0;
      let match;

      while ((match = linkRegex.exec(line)) !== null) {
        // Add text before link
        if (match.index > lastIndex) {
          textRuns.push(new TextRun(line.substring(lastIndex, match.index)));
        }
        
        // Add link as regular text for now (docx links are complex)
        textRuns.push(new TextRun({
          text: match[1],
          color: "0000FF",
          underline: {},
        }));
        
        lastIndex = match.index + match[0].length;
      }

      // Add remaining text
      if (lastIndex < line.length) {
        textRuns.push(new TextRun(line.substring(lastIndex)));
      }

      if (textRuns.length === 0) {
        textRuns.push(new TextRun(line));
      }

      paragraphs.push(new Paragraph({
        children: textRuns,
      }));
    }
  });

  const doc = new Document({
    sections: [{
      properties: {},
      children: paragraphs,
    }],
  });

  return await Packer.toBlob(doc);
};
