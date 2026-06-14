import { jsPDF } from 'jspdf';

function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^[-*+]\s+/gm, '- ')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/`{1,3}([^`]*)`{1,3}/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^>\s+/gm, '')
    .replace(/\|[^\n]*\|/g, '')
    .replace(/^[-|:]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const darkGreen: [number, number, number] = [10, 26, 15];
const primaryGreen: [number, number, number] = [19, 236, 91];
const jamaicanGold: [number, number, number] = [244, 209, 37];
const bodyTextColor: [number, number, number] = [30, 30, 30];

function drawHeader(doc: jsPDF): void {
  const pageW = doc.internal.pageSize.width;
  doc.setFillColor(...darkGreen);
  doc.rect(0, 0, pageW, 50, 'F');
  doc.setFillColor(...jamaicanGold);
  doc.rect(0, 50, pageW, 2.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...primaryGreen);
  doc.text('LIKKLE WISDOM', 14, 16);
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('AI Destination Guide', 14, 29);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(200, 210, 204);
  doc.text(`Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 38);
}

function ensurePage(doc: jsPDF, y: number, required = 16): number {
  if (y + required < doc.internal.pageSize.height - 18) return y;
  doc.addPage();
  return 20;
}

function addFooter(doc: jsPDF): void {
  const pageW = doc.internal.pageSize.width;
  const pageH = doc.internal.pageSize.height;
  doc.setPage(1);
  doc.setFillColor(...jamaicanGold);
  doc.rect(0, pageH - 16, pageW, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('likklewisdom.com', pageW / 2, pageH - 11, { align: 'center' });

  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${page} of ${totalPages}`, pageW - 14, pageH - 9, { align: 'right' });
  }
}

function isHeadingLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 60) return false;
  return trimmed === trimmed.toUpperCase() || /^[A-Z][A-Za-z\s-]{3,55}:?$/.test(trimmed);
}

export function generateGuidePDF(prompt: string, response: string): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.width;
  drawHeader(doc);

  let y = 64;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...darkGreen);
  doc.setLineWidth(0.35);
  doc.roundedRect(14, y, pageW - 28, 28, 4, 4, 'D');
  doc.setFillColor(...primaryGreen);
  doc.roundedRect(14, y, 3, 28, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...darkGreen);
  doc.text('YOUR QUERY', 21, y + 8);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(...bodyTextColor);
  doc.text(doc.splitTextToSize(`"${prompt}"`, 168), 21, y + 16);
  y += 38;

  doc.setFillColor(...jamaicanGold);
  doc.rect(14, y, pageW - 28, 1, 'F');
  y += 8;

  doc.setFillColor(...darkGreen);
  doc.roundedRect(14, y, pageW - 28, 8, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('DESTINATION GUIDE', 18, y + 5.5);
  y += 14;

  stripMarkdown(response).split('\n').forEach(rawLine => {
    const line = rawLine.trim();
    if (!line) {
      y += 3;
      return;
    }
    y = ensurePage(doc, y);
    if (isHeadingLine(line)) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...primaryGreen);
      doc.text(line.replace(/:$/, ''), 14, y);
      y += 6;
      return;
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...bodyTextColor);
    const lines = doc.splitTextToSize(line, 182);
    lines.forEach((wrapped: string) => {
      y = ensurePage(doc, y, 8);
      doc.text(wrapped, 14, y);
      y += 5;
    });
  });

  addFooter(doc);
  doc.save(`likkle-wisdom-guide-${Date.now()}.pdf`);
}
