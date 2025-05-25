import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { Document, Paragraph, TextRun, HeadingLevel, Packer, ExternalHyperlink, TabStopType, TabStopPosition, Table, TableRow, TableCell } from 'docx';

// Helper to recursively convert markdown AST to docx Paragraphs
function astToDocxParagraphs(node: any): (Paragraph | Table)[] {
  if (!node) return [];
  switch (node.type) {
    case 'root':
      return node.children.flatMap(astToDocxParagraphs);
    case 'paragraph':
      return [new Paragraph({
        children: node.children ? node.children.flatMap(astToDocxRuns) : [],
      })];
    case 'heading':
      return [new Paragraph({
        text: node.children.map((c: any) => c.value || '').join(''),
        heading: headingLevel(node.depth),
      })];
    case 'list':
      return node.children.flatMap((item: any) => astToDocxListItem(item, node.ordered));
    case 'code':
      return [new Paragraph({
        children: [new TextRun({ text: node.value, font: 'Consolas', size: 20, color: '333333' })],
      })];
    case 'thematicBreak':
      return [new Paragraph({ text: '---' })];
    case 'table':
      return [astToDocxTable(node)];
    default:
      return [];
  }
}

function astToDocxRuns(node: any): TextRun[] {
  if (!node) return [];
  switch (node.type) {
    case 'text':
      return [new TextRun(node.value)];
    case 'strong':
      return node.children.flatMap((c: any) => astToDocxRuns({ ...c, strong: true })).map(run => run.bold());
    case 'emphasis':
      return node.children.flatMap((c: any) => astToDocxRuns({ ...c, emphasis: true })).map(run => run.italics());
    case 'inlineCode':
      return [new TextRun({ text: node.value, font: 'Consolas', size: 20, color: '333333' })];
    case 'link':
      return [
        new ExternalHyperlink({
          children: [new TextRun({ text: node.children.map((c: any) => c.value || '').join(''), style: 'Hyperlink' })],
          link: node.url,
        })
      ];
    case 'break':
      return [new TextRun({ text: '\n' })];
    default:
      if (node.children) {
        return node.children.flatMap(astToDocxRuns);
      }
      return [];
  }
}

function astToDocxListItem(node: any, ordered: boolean): Paragraph[] {
  // Each listItem has children: [paragraph, ...]
  return node.children.flatMap((child: any) => {
    if (child.type === 'paragraph') {
      return [
        new Paragraph({
          text: child.children.map((c: any) => c.value || '').join(''),
          bullet: !ordered ? { level: 0 } : undefined,
          numbering: ordered ? { reference: 'numbered-list', level: 0 } : undefined,
        })
      ];
    } else {
      return astToDocxParagraphs(child);
    }
  });
}

function astToDocxTable(node: any): Table {
  const rows = node.children.map((row: any) =>
    new TableRow({
      children: row.children.map((cell: any) =>
        new TableCell({
          children: astToDocxParagraphs(cell),
        })
      ),
    })
  );
  return new Table({ rows });
}

function headingLevel(depth: number): HeadingLevel {
  switch (depth) {
    case 1: return HeadingLevel.HEADING_1;
    case 2: return HeadingLevel.HEADING_2;
    case 3: return HeadingLevel.HEADING_3;
    case 4: return HeadingLevel.HEADING_4;
    case 5: return HeadingLevel.HEADING_5;
    case 6: return HeadingLevel.HEADING_6;
    default: return HeadingLevel.HEADING_1;
  }
}

export async function markdownToDocxBlob(markdown: string): Promise<Blob> {
  const tree = unified().use(remarkParse).parse(markdown);
  const children = astToDocxParagraphs(tree);
  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });
  return await Packer.toBlob(doc);
} 