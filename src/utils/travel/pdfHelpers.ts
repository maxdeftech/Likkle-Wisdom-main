import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/* ── colour palette ─────────────────────────────────────────── */
export const darkGreen: RGB = [10, 26, 15];
export const primaryGreen: RGB = [19, 236, 91];
export const jamaicanGold: RGB = [244, 209, 37];
export const bodyTextColor: RGB = [30, 30, 30];
export const mutedText: RGB = [120, 120, 120];
export const lightGreen: RGB = [245, 255, 248];
export const accentBg: RGB = [235, 250, 240];
export const warningOrange: RGB = [255, 152, 0];
export const successGreen: RGB = [34, 197, 94];
export const dangerRed: RGB = [239, 68, 68];

export type RGB = [number, number, number];

/* ── layout constants ───────────────────────────────────────── */
const MARGIN = 14;           // mm each side
const PAGE_W = 210;          // A4 portrait
const CONTENT_W = PAGE_W - MARGIN * 2;   // 182mm usable
const TEXT_LEFT = MARGIN + 2;             // 16mm — body text indent
const TEXT_W = PAGE_W - MARGIN - TEXT_LEFT; // 180mm max text width
const BULLET_LEFT = MARGIN + 10;          // 24mm — after bullet dot
const BULLET_W = PAGE_W - MARGIN - BULLET_LEFT; // 172mm
const FOOTER_H = 22;        // reserved footer space

/* ── sanitise Unicode that Helvetica can't render ───────────── */
export function sanitise(text: string): string {
  return text
    .replace(/●/g, '*')          // ●
    .replace(/○/g, '-')          // ○
    .replace(/→/g, '->')         // →
    .replace(/←/g, '<-')         // ←
    .replace(/×/g, 'x')         // ×
    .replace(/[✓✔]/g, '[ok]') // ✓ ✔
    .replace(/[✗✘]/g, '[x]')  // ✗ ✘
    // All dash-like Unicode -> spaced ASCII dash (prevents "$350$450" glued ranges)
    .replace(/[‐-―−﹘﹣－─]/g, ' - ')
    .replace(/…/g, '...')        // …
    .replace(/[“”]/g, '"')  // " "
    .replace(/[‘’]/g, "'")  // ' '
    .replace(/ /g, ' ')          // non-breaking space
    .replace(/[\u200b-\u200f\u2028\u2029\ufeff]/g, '') // zero-width / line seps
    .replace(/[^\x0A\x0D\x20-\x7E]/g, ' ');  // remaining non-ASCII -> space (not stripped)
}

/* ── markdown → structured content parser ───────────────────── */
export interface ContentBlock {
  type: 'heading' | 'subheading' | 'paragraph' | 'bullet' | 'numbered' | 'table' | 'divider' | 'tip';
  text?: string;
  items?: string[];
  rows?: string[][];
  headers?: string[];
}

export function parseMarkdownToBlocks(rawText: string): ContentBlock[] {
  const text = sanitise(rawText);
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

    // Table detection
    if (/^\|(.+)\|/.test(line)) {
      const tableLines: string[] = [];
      while (i < lines.length && /^\|(.+)\|/.test(lines[i].trim())) {
        tableLines.push(lines[i].trim());
        i++;
      }
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
          headers.forEach(h => { if (h) blocks.push({ type: 'bullet', text: h }); });
        }
      }
      continue;
    }

    // Separator
    if (/^[-*_]{3,}$/.test(line) || /^[-|:]+$/.test(line)) {
      blocks.push({ type: 'divider' });
      i++; continue;
    }

    // Bullets
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

    // Tip/note
    if (/^(tip|note|warning|important|savings)/i.test(line)) {
      blocks.push({ type: 'tip', text: line.replace(/\*\*/g, '').replace(/\*/g, '') });
      i++; continue;
    }

    // Blockquote
    if (/^>\s+/.test(line)) {
      blocks.push({ type: 'tip', text: line.replace(/^>\s+/, '').replace(/\*\*/g, '') });
      i++; continue;
    }

    // Paragraph
    const cleaned = line
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    if (cleaned.length <= 60 && (cleaned === cleaned.toUpperCase() || /^[A-Z][A-Za-z\s&-]{3,55}:?$/.test(cleaned))) {
      blocks.push({ type: 'subheading', text: cleaned.replace(/:$/, '') });
    } else {
      blocks.push({ type: 'paragraph', text: cleaned });
    }
    i++;
  }
  return blocks;
}

/* ── PDF helpers ─────────────────────────────────────────────── */
export const money = (currency: string, amount: number) => `${currency} ${amount.toLocaleString()}`;

export function ensurePage(doc: jsPDF, y: number, required = 20): number {
  if (y + required < doc.internal.pageSize.height - FOOTER_H) return y;
  doc.addPage();
  return 22;
}

export function drawHeader(doc: jsPDF, title: string, subtitle?: string): void {
  doc.setFillColor(...darkGreen);
  doc.rect(0, 0, PAGE_W, 54, 'F');
  doc.setFillColor(...jamaicanGold);
  doc.rect(0, 54, PAGE_W, 3, 'F');
  doc.setFillColor(...primaryGreen);
  doc.rect(0, 0, 4, 54, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...primaryGreen);
  doc.text('LIKKLE WISDOM', MARGIN, 15);

  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text(title, MARGIN, 30);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(200, 210, 204);
  doc.text(`Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, MARGIN, 40);

  if (subtitle) {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(PAGE_W - 80, 14, 66, 12, 6, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...darkGreen);
    doc.text(sanitise(subtitle).slice(0, 28), PAGE_W - 47, 21.5, { align: 'center' });
  }
}

export function drawStatCard(
  doc: jsPDF, x: number, y: number, w: number, h: number,
  _icon: string, label: string, value: string, color: RGB
): void {
  doc.setFillColor(...lightGreen);
  doc.setDrawColor(220, 235, 225);
  doc.setLineWidth(0.2);
  doc.roundedRect(x, y, w, h, 3, 3, 'FD');

  doc.setFillColor(...color);
  doc.roundedRect(x, y, w, 2.5, 3, 3, 'F');
  doc.setFillColor(...lightGreen);
  doc.rect(x, y + 1.5, w, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...mutedText);
  doc.text(sanitise(label).toUpperCase(), x + 5, y + 10);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...darkGreen);
  // Truncate value to fit card width with padding
  const safeVal = sanitise(value);
  const maxValW = w - 10;
  const valLines = doc.splitTextToSize(safeVal, maxValW);
  doc.text(valLines[0], x + 5, y + 18);
}

export function drawSectionHeader(doc: jsPDF, y: number, title: string): number {
  y = ensurePage(doc, y, 16);
  doc.setFillColor(...darkGreen);
  doc.roundedRect(MARGIN, y, CONTENT_W, 9, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(sanitise(title).toUpperCase(), MARGIN + 4, y + 6.5);
  return y + 14;
}

export function drawSubheading(doc: jsPDF, y: number, title: string): number {
  y = ensurePage(doc, y, 12);
  doc.setFillColor(...accentBg);
  doc.roundedRect(MARGIN, y - 3, CONTENT_W, 8, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...darkGreen);
  doc.text(sanitise(title), MARGIN + 4, y + 2.5);
  return y + 10;
}

export function drawParagraph(doc: jsPDF, y: number, text: string): number {
  const lines = doc.splitTextToSize(sanitise(text), TEXT_W);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...bodyTextColor);
  for (const line of lines) {
    y = ensurePage(doc, y, 6);
    doc.text(line, TEXT_LEFT, y);
    y += 4.8;
  }
  return y + 2;
}

export function drawBullets(doc: jsPDF, y: number, items: string[]): number {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...bodyTextColor);
  for (const item of items) {
    y = ensurePage(doc, y, 8);
    doc.setFillColor(...primaryGreen);
    doc.circle(MARGIN + 5, y - 1.2, 1.2, 'F');
    const lines = doc.splitTextToSize(sanitise(item), BULLET_W);
    for (let j = 0; j < lines.length; j++) {
      if (j > 0) y = ensurePage(doc, y, 6);
      doc.text(lines[j], BULLET_LEFT, y);
      y += 4.8;
    }
    y += 0.5;
  }
  return y + 1;
}

export function drawNumberedList(doc: jsPDF, y: number, items: string[]): number {
  doc.setFontSize(8.5);
  doc.setTextColor(...bodyTextColor);
  for (let idx = 0; idx < items.length; idx++) {
    y = ensurePage(doc, y, 8);
    doc.setFillColor(...primaryGreen);
    doc.circle(MARGIN + 5, y - 1.2, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...darkGreen);
    doc.text(String(idx + 1), MARGIN + 5, y - 0.2, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...bodyTextColor);
    const lines = doc.splitTextToSize(sanitise(items[idx]), BULLET_W - 2);
    for (let j = 0; j < lines.length; j++) {
      if (j > 0) y = ensurePage(doc, y, 6);
      doc.text(lines[j], BULLET_LEFT + 2, y);
      y += 4.8;
    }
    y += 1;
  }
  return y + 1;
}

export function drawTip(doc: jsPDF, y: number, text: string): number {
  const safeText = sanitise(text);
  const wrappedLines = doc.splitTextToSize(safeText, CONTENT_W - 12);
  const lineH = 4.5;
  const padding = 6;
  const boxH = padding * 2 + wrappedLines.length * lineH;

  y = ensurePage(doc, y, boxH + 4);
  doc.setFillColor(255, 248, 225);
  doc.setDrawColor(...warningOrange);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, y - 2, CONTENT_W, boxH, 2, 2, 'FD');
  doc.setFillColor(...warningOrange);
  doc.roundedRect(MARGIN, y - 2, 3, boxH, 1, 1, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(180, 100, 0);
  for (let i = 0; i < wrappedLines.length; i++) {
    doc.text(wrappedLines[i], MARGIN + 7, y + padding - 1 + i * lineH);
  }
  return y + boxH + 4;
}

export function drawContentTable(doc: jsPDF, y: number, headers: string[], rows: string[][]): number {
  y = ensurePage(doc, y, 20);
  const cleanHeaders = headers.map(h => sanitise(h));
  const cleanRows = rows.map(row => row.map(cell => sanitise(cell)));

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
    margin: { left: MARGIN, right: MARGIN },
    theme: 'grid',
    styles: { overflow: 'linebreak', cellWidth: 'auto' }
  });
  return (doc as any).lastAutoTable.finalY + 6;
}

export function renderBlocks(doc: jsPDF, blocks: ContentBlock[], startY: number): number {
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
        if (block.items) y = drawBullets(doc, y, block.items);
        else if (block.text) y = drawBullets(doc, y, [block.text]);
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
        doc.line(MARGIN, y, PAGE_W - MARGIN, y);
        y += 5;
        break;
    }
  }
  return y;
}

export function addFooter(doc: jsPDF, moduleName: string): void {
  const pageH = doc.internal.pageSize.height;
  const totalPages = (doc.internal as any).getNumberOfPages();

  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);
    doc.setDrawColor(...primaryGreen);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, pageH - 16, PAGE_W - MARGIN, pageH - 16);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...primaryGreen);
    doc.text('LIKKLE WISDOM', MARGIN, pageH - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(...mutedText);
    doc.text(`${moduleName}`, 50, pageH - 10);
    doc.text('All estimates are approximate. Verify with providers before booking.', PAGE_W / 2, pageH - 10, { align: 'center' });
    doc.text(`Page ${page} of ${totalPages}`, PAGE_W - MARGIN, pageH - 10, { align: 'right' });
  }
}
