
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

export const markdownToDocxBlob = async (markdown: string): Promise<Blob> => {
  // Simple markdown to docx conversion
  const lines = markdown.split('\n');
  const children: Paragraph[] = [];

  for (const line of lines) {
    if (line.startsWith('# ')) {
      children.push(
        new Paragraph({
          text: line.substring(2),
          heading: HeadingLevel.HEADING_1,
        })
      );
    } else if (line.startsWith('## ')) {
      children.push(
        new Paragraph({
          text: line.substring(3),
          heading: HeadingLevel.HEADING_2,
        })
      );
    } else if (line.startsWith('### ')) {
      children.push(
        new Paragraph({
          text: line.substring(4),
          heading: HeadingLevel.HEADING_3,
        })
      );
    } else if (line.trim() === '') {
      children.push(new Paragraph({}));
    } else {
      children.push(
        new Paragraph({
          children: [new TextRun(line)],
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        children,
      },
    ],
  });

  return await Packer.toBlob(doc);
};

export const downloadDocxFromMarkdown = async (markdown: string, filename: string = 'document.docx') => {
  try {
    const blob = await markdownToDocxBlob(markdown);
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error creating DOCX:', error);
    throw error;
  }
};
