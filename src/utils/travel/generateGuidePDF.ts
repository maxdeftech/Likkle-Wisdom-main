import { jsPDF } from 'jspdf';
import {
  darkGreen, primaryGreen, jamaicanGold, bodyTextColor, mutedText,
  sanitise, ensurePage,
  drawHeader, drawSectionHeader, addFooter,
  parseMarkdownToBlocks, renderBlocks
} from './pdfHelpers';

const MARGIN = 14;
const PAGE_W = 210;
const CONTENT_W = PAGE_W - MARGIN * 2;

export function generateGuidePDF(prompt: string, response: string): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  drawHeader(doc, 'AI Destination Guide');

  let y = 66;

  // Query card
  const safePrompt = sanitise(prompt);
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...darkGreen);
  doc.setLineWidth(0.35);
  doc.roundedRect(MARGIN, y, CONTENT_W, 24, 4, 4, 'D');
  doc.setFillColor(...primaryGreen);
  doc.roundedRect(MARGIN, y, 3.5, 24, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...mutedText);
  doc.text('YOUR QUERY', MARGIN + 8, y + 7);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(...bodyTextColor);
  const queryLines = doc.splitTextToSize(`"${safePrompt}"`, CONTENT_W - 14);
  doc.text(queryLines.slice(0, 2), MARGIN + 8, y + 14);
  y += 32;

  // Divider
  doc.setFillColor(...jamaicanGold);
  doc.rect(MARGIN, y, CONTENT_W, 1, 'F');
  y += 7;

  // Parse and render content
  const blocks = parseMarkdownToBlocks(response);

  if (blocks.length > 0 && blocks[0].type !== 'heading') {
    y = drawSectionHeader(doc, y, 'Destination Guide');
  }

  y = renderBlocks(doc, blocks, y);

  addFooter(doc, 'AI Guide Module');

  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`LikkleWisdom_${dateStr}_AI-Destination-Guide.pdf`);
}
