import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/* ── colour palette ─────────────────────────────────────────── */
const darkGreen: [number, number, number] = [10, 26, 15];
const primaryGreen: [number, number, number] = [19, 236, 91];
const jamaicanGold: [number, number, number] = [244, 209, 37];
const bodyTextColor: [number, number, number] = [30, 30, 30];
const mutedText: [number, number, number] = [120, 120, 120];
const lightGreen: [number, number, number] = [245, 255, 248];
const accentBg: [number, number, number] = [235, 250, 240];
const warningOrange: [number, number, number] = [255, 152, 0];

/* ── markdown → structured content parser ───────────────────── */
interface ContentBlock {
  type: 'heading' | 'subheading' | 'paragraph' | 'bullet' | 'numbered' | 'table' | 'divider' | 'tip';
  text?: string;
  items?: string[];
  rows?: string[][];
  headers?: string[];
}

function parseMarkdownToBlocks(text: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const lines = text.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    if (!line) { i++; continue; }

    // Headings
    if (/^#{1,2}\s+/.test(line)) {
      blocks.push({ type: 'heading', text: line.replace(/^#{1,6}\s+/, '').replace(/\*\*/g, '') });
      i++; continue;
    }
    if (/^#{3,6}\s+/.test(line)) {
      blocks.push({ type: 'subheading', text: line.replace(/^#{1,6}\s+/, '').replace(/\*\*/g, '') });
      i++; continue;
    }

    // Table detection: line with pipes
    if (/^\|(.+)\|/.test(line)) {
      const tableLines: string[] = [];
      while (i < lines.length && /^\|(.+)\|/.test(lines[i].trim())) {
        tableLines.push(lines[i].trim());
        i++;
      }
      // Filter out separator rows
      const dataRows = tableLines.filter(row => !/^\|[-:|\s]+\|$/.test(row));
      if (dataRows.length > 0) {
        const parsed = dataRows.map(row =>
          row.split('|').slice(1, -1).map(cell => cell.trim().replace(/\*\*/g, ''))
        );
        const headers = parsed[0] || [];
        const rows = parsed.slice(1);
        if (rows.length > 0) {
          blocks.push({ type: 'table', headers, rows });
        } else {
          // Single-row table → bullets
          headers.forEach(h => {
            if (h) blocks.push({ type: 'bullet', text: h });
          });
        }
      }
      continue;
    }

    // Separator line
    if (/^[-*_]{3,}$/.test(line) || /^[-|:]+$/.test(line)) {
      blocks.push({ type: 'divider' });
      i++; continue;
    }

    // Bullet points
    if (/^[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*+]\s+/, '').replace(/\*\*/g, '').replace(/\*/g, ''));
        i++;
      }
      blocks.push({ type: 'bullet', items });
      continue;
    }

    // Numbered list
    if (/^\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+[.)]\s+/, '').replace(/\*\*/g, '').replace(/\*/g, ''));
        i++;
      }
      blocks.push({ type: 'numbered', items });
      continue;
    }

    // Tip/note detection
    if (/^(tip|note|warning|important|💡|⚠️|📌)/i.test(line)) {
      blocks.push({ type: 'tip', text: line.replace(/\*\*/g, '').replace(/\*/g, '') });
      i++; continue;
    }

    // Blockquote
    if (/^>\s+/.test(line)) {
      blocks.push({ type: 'tip', text: line.replace(/^>\s+/, '').replace(/\*\*/g, '') });
      i++; continue;
    }

    // Plain paragraph (clean up inline markdown)
    const cleaned = line
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    // Detect heading-like lines (short, all-caps or title case with colon)
    if (cleaned.length <= 60 && (cleaned === cleaned.toUpperCase() || /^[A-Z][A-Za-z\s&-]{3,55}:?$/.test(cleaned))) {
      blocks.push({ type: 'subheading', text: cleaned.replace(/:$/, '') });
    } else {
      blocks.push({ type: 'paragraph', text: cleaned });
    }
    i++;
  }

  return blocks;
}

/* ── PDF layout helpers ─────────────────────────────────────── */
function drawHeader(doc: jsPDF, title: string, subtitle?: string): void {
  const pageW = doc.internal.pageSize.width;

  // Dark gradient header
  doc.setFillColor(...darkGreen);
  doc.rect(0, 0, pageW, 54, 'F');

  // Gold accent strip
  doc.setFillColor(...jamaicanGold);
  doc.rect(0, 54, pageW, 3, 'F');

  // Decorative corner accent
  doc.setFillColor(...primaryGreen);
  doc.rect(0, 0, 4, 54, 'F');

  // Brand
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...primaryGreen);
  doc.text('LIKKLE WISDOM', 14, 15);

  // Title
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text(title, 14, 30);

  // Subtitle / date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(200, 210, 204);
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(`Generated ${dateStr}`, 14, 40);

  if (subtitle) {
    // Destination badge
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(pageW - 80, 14, 66, 12, 6, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...darkGreen);
    doc.text(subtitle.slice(0, 28), pageW - 47, 21.5, { align: 'center' });
  }
}

function addFooter(doc: jsPDF, moduleName: string): void {
  const pageW = doc.internal.pageSize.width;
  const pageH = doc.internal.pageSize.height;
  const totalPages = (doc.internal as any).getNumberOfPages();

  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);

    // Footer line
    doc.setDrawColor(...primaryGreen);
    doc.setLineWidth(0.3);
    doc.line(14, pageH - 16, pageW - 14, pageH - 16);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...primaryGreen);
    doc.text('LIKKLE WISDOM', 14, pageH - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(...mutedText);
    doc.text(`${moduleName} Module`, 50, pageH - 10);

    doc.text('All estimates are approximate. Verify with providers before booking.', pageW / 2, pageH - 10, { align: 'center' });
    doc.text(`Page ${page} of ${totalPages}`, pageW - 14, pageH - 10, { align: 'right' });
  }
}

function ensurePage(doc: jsPDF, y: number, required = 20): number {
  if (y + required < doc.internal.pageSize.height - 22) return y;
  doc.addPage();
  return 22;
}

function drawSectionHeader(doc: jsPDF, y: number, title: string): number {
  const pageW = doc.internal.pageSize.width;
  y = ensurePage(doc, y, 16);
  doc.setFillColor(...darkGreen);
  doc.roundedRect(14, y, pageW - 28, 9, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(title.toUpperCase(), 18, y + 6.5);
  return y + 14;
}

function drawSubheading(doc: jsPDF, y: number, title: string): number {
  y = ensurePage(doc, y, 12);
  doc.setFillColor(...accentBg);
  doc.roundedRect(14, y - 3, doc.internal.pageSize.width - 28, 8, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...darkGreen);
  doc.text(title, 18, y + 2.5);
  return y + 10;
}

function drawParagraph(doc: jsPDF, y: number, text: string): number {
  const wrappedLines = doc.splitTextToSize(text, 176);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...bodyTextColor);
  for (const line of wrappedLines) {
    y = ensurePage(doc, y, 6);
    doc.text(line, 16, y);
    y += 4.8;
  }
  return y + 2;
}

function drawBullets(doc: jsPDF, y: number, items: string[]): number {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...bodyTextColor);
  for (const item of items) {
    y = ensurePage(doc, y, 8);
    // Green bullet dot
    doc.setFillColor(...primaryGreen);
    doc.circle(19, y - 1.2, 1.2, 'F');
    const wrappedLines = doc.splitTextToSize(item, 170);
    for (let j = 0; j < wrappedLines.length; j++) {
      if (j > 0) y = ensurePage(doc, y, 6);
      doc.text(wrappedLines[j], 24, y);
      y += 4.8;
    }
    y += 0.5;
  }
  return y + 1;
}

function drawNumberedList(doc: jsPDF, y: number, items: string[]): number {
  doc.setFontSize(8.5);
  doc.setTextColor(...bodyTextColor);
  for (let idx = 0; idx < items.length; idx++) {
    y = ensurePage(doc, y, 8);
    // Number badge
    doc.setFillColor(...primaryGreen);
    doc.circle(19, y - 1.2, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...darkGreen);
    doc.text(String(idx + 1), 19, y - 0.2, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...bodyTextColor);
    const wrappedLines = doc.splitTextToSize(items[idx], 168);
    for (let j = 0; j < wrappedLines.length; j++) {
      if (j > 0) y = ensurePage(doc, y, 6);
      doc.text(wrappedLines[j], 26, y);
      y += 4.8;
    }
    y += 1;
  }
  return y + 1;
}

function drawTip(doc: jsPDF, y: number, text: string): number {
  const pageW = doc.internal.pageSize.width;
  y = ensurePage(doc, y, 16);
  doc.setFillColor(255, 248, 225);
  doc.setDrawColor(...warningOrange);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, y - 2, pageW - 28, 12, 2, 2, 'FD');
  doc.setFillColor(...warningOrange);
  doc.roundedRect(14, y - 2, 3, 12, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(180, 100, 0);
  const wrappedLines = doc.splitTextToSize(text, 168);
  doc.text(wrappedLines[0], 21, y + 5);
  return y + 16;
}

function drawContentTable(doc: jsPDF, y: number, headers: string[], rows: string[][]): number {
  y = ensurePage(doc, y, 20);
  const cleanHeaders = headers.map(h => h.replace(/[^\x20-\x7E]/g, ''));
  const cleanRows = rows.map(row => row.map(cell => cell.replace(/[^\x20-\x7E]/g, '')));
  autoTable(doc, {
    startY: y,
    head: [cleanHeaders],
    body: cleanRows,
    headStyles: {
      fillColor: primaryGreen,
      textColor: darkGreen,
      fontStyle: 'bold',
      fontSize: 7.5,
      cellPadding: 3,
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: bodyTextColor,
      lineWidth: 0.1,
      lineColor: [220, 235, 225]
    },
    alternateRowStyles: { fillColor: lightGreen },
    tableLineColor: [200, 230, 210],
    tableLineWidth: 0.15,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    styles: { overflow: 'linebreak', cellWidth: 'wrap' }
  });
  return (doc as any).lastAutoTable.finalY + 6;
}

/* ── render blocks into PDF ─────────────────────────────────── */
function renderBlocks(doc: jsPDF, blocks: ContentBlock[], startY: number): number {
  let y = startY;
  for (const block of blocks) {
    switch (block.type) {
      case 'heading':
        y = drawSectionHeader(doc, y, block.text!);
        break;
      case 'subheading':
        y = drawSubheading(doc, y, block.text!);
        break;
      case 'paragraph':
        y = drawParagraph(doc, y, block.text!);
        break;
      case 'bullet':
        if (block.items) {
          y = drawBullets(doc, y, block.items);
        } else if (block.text) {
          y = drawBullets(doc, y, [block.text]);
        }
        break;
      case 'numbered':
        y = drawNumberedList(doc, y, block.items!);
        break;
      case 'table':
        y = drawContentTable(doc, y, block.headers!, block.rows!);
        break;
      case 'tip':
        y = drawTip(doc, y, block.text!);
        break;
      case 'divider':
        y = ensurePage(doc, y, 6);
        doc.setDrawColor(...primaryGreen);
        doc.setLineWidth(0.2);
        doc.line(14, y, doc.internal.pageSize.width - 14, y);
        y += 5;
        break;
    }
  }
  return y;
}

/* ── public: generate AI destination guide PDF ──────────────── */
export function generateGuidePDF(prompt: string, response: string): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.width;

  drawHeader(doc, 'AI Destination Guide');

  let y = 66;

  // Query card
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...darkGreen);
  doc.setLineWidth(0.35);
  doc.roundedRect(14, y, pageW - 28, 24, 4, 4, 'D');
  doc.setFillColor(...primaryGreen);
  doc.roundedRect(14, y, 3.5, 24, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...mutedText);
  doc.text('YOUR QUERY', 22, y + 7);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(...bodyTextColor);
  const queryLines = doc.splitTextToSize(`"${prompt}"`, 162);
  doc.text(queryLines.slice(0, 2), 22, y + 14);
  y += 32;

  // Divider
  doc.setFillColor(...jamaicanGold);
  doc.rect(14, y, pageW - 28, 1, 'F');
  y += 7;

  // Parse and render content
  const blocks = parseMarkdownToBlocks(response);

  if (blocks.length > 0 && blocks[0].type !== 'heading') {
    y = drawSectionHeader(doc, y, 'Destination Guide');
  }

  y = renderBlocks(doc, blocks, y);

  addFooter(doc, 'AI Guide');

  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`LikkleWisdom_${dateStr}_AI-Destination-Guide.pdf`);
}
