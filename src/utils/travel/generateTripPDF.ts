import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface TripPDFData {
  destination: string;
  departureCity: string;
  startDate: string;
  endDate: string;
  travellers: number;
  budget: number;
  currency: string;
  accommodation: string;
  interests: string[];
  estimatedTotal: number;
  flightEstimate: string;
  nights: number;
  aiPlanText: string;
  goalTargetAmount: number;
  goalCurrentSavings: number;
  goalProgress: number;
  weeklyNeeded: number;
}

/* ── colour palette ─────────────────────────────────────────── */
const darkGreen: [number, number, number] = [10, 26, 15];
const primaryGreen: [number, number, number] = [19, 236, 91];
const jamaicanGold: [number, number, number] = [244, 209, 37];
const bodyTextColor: [number, number, number] = [30, 30, 30];
const mutedText: [number, number, number] = [120, 120, 120];
const lightGreen: [number, number, number] = [245, 255, 248];
const accentBg: [number, number, number] = [235, 250, 240];
const warningOrange: [number, number, number] = [255, 152, 0];
const successGreen: [number, number, number] = [34, 197, 94];
const dangerRed: [number, number, number] = [239, 68, 68];

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
    if (/^(tip|note|warning|important|💡|⚠️|📌|savings)/i.test(line)) {
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
const money = (currency: string, amount: number) => `${currency} ${amount.toLocaleString()}`;

function ensurePage(doc: jsPDF, y: number, required = 20): number {
  if (y + required < doc.internal.pageSize.height - 22) return y;
  doc.addPage();
  return 22;
}

function drawHeader(doc: jsPDF, title: string, destination: string): void {
  const pageW = doc.internal.pageSize.width;

  doc.setFillColor(...darkGreen);
  doc.rect(0, 0, pageW, 54, 'F');
  doc.setFillColor(...jamaicanGold);
  doc.rect(0, 54, pageW, 3, 'F');
  doc.setFillColor(...primaryGreen);
  doc.rect(0, 0, 4, 54, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...primaryGreen);
  doc.text('LIKKLE WISDOM', 14, 15);

  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text(title, 14, 30);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(200, 210, 204);
  doc.text(`Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 40);

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(pageW - 80, 14, 66, 12, 6, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...darkGreen);
  doc.text(destination.slice(0, 28), pageW - 47, 21.5, { align: 'center' });
}

function drawStatCard(doc: jsPDF, x: number, y: number, w: number, h: number, icon: string, label: string, value: string, color: [number, number, number]): void {
  doc.setFillColor(...lightGreen);
  doc.setDrawColor(220, 235, 225);
  doc.setLineWidth(0.2);
  doc.roundedRect(x, y, w, h, 3, 3, 'FD');

  // Color accent top
  doc.setFillColor(...color);
  doc.roundedRect(x, y, w, 2.5, 3, 3, 'F');
  doc.setFillColor(...lightGreen);
  doc.rect(x, y + 1.5, w, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...mutedText);
  doc.text(label.toUpperCase(), x + 5, y + 10);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...darkGreen);
  doc.text(value, x + 5, y + 18);
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
  const lines = doc.splitTextToSize(text, 176);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...bodyTextColor);
  for (const line of lines) {
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
    doc.setFillColor(...primaryGreen);
    doc.circle(19, y - 1.2, 1.2, 'F');
    const lines = doc.splitTextToSize(item, 170);
    for (let j = 0; j < lines.length; j++) {
      if (j > 0) y = ensurePage(doc, y, 6);
      doc.text(lines[j], 24, y);
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
    doc.setFillColor(...primaryGreen);
    doc.circle(19, y - 1.2, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...darkGreen);
    doc.text(String(idx + 1), 19, y - 0.2, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...bodyTextColor);
    const lines = doc.splitTextToSize(items[idx], 168);
    for (let j = 0; j < lines.length; j++) {
      if (j > 0) y = ensurePage(doc, y, 6);
      doc.text(lines[j], 26, y);
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
  const lines = doc.splitTextToSize(text, 168);
  doc.text(lines[0], 21, y + 5);
  return y + 16;
}

function drawContentTable(doc: jsPDF, y: number, headers: string[], rows: string[][]): number {
  y = ensurePage(doc, y, 20);
  // Sanitise any Unicode the AI might have included
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
        doc.line(14, y, doc.internal.pageSize.width - 14, y);
        y += 5;
        break;
    }
  }
  return y;
}

function addFooter(doc: jsPDF): void {
  const pageW = doc.internal.pageSize.width;
  const pageH = doc.internal.pageSize.height;
  const totalPages = (doc.internal as any).getNumberOfPages();

  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);
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
    doc.text('Financial Planner Module', 50, pageH - 10);
    doc.text('All cost estimates are approximate. Verify prices with providers before booking.', pageW / 2, pageH - 10, { align: 'center' });
    doc.text(`Page ${page} of ${totalPages}`, pageW - 14, pageH - 10, { align: 'right' });
  }
}

/* ── public: generate trip financial PDF ────────────────────── */
export function generateTripPDF(data: TripPDFData): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.width;

  drawHeader(doc, 'Travel Financial Overview', data.destination);

  const stayNights = data.nights || 1;
  const accomRate = data.accommodation === 'Hostel' ? 55 : data.accommodation === 'Villa' ? 280 : data.accommodation === 'Airbnb' ? 120 : 180;
  const accommodationTotal = accomRate * stayNights;
  const mealsCost = 55 * stayNights * data.travellers;
  const activitiesCost = 45 * stayNights * data.travellers;
  const essentialsCost = 160 * data.travellers;
  const budgetRatio = data.budget ? data.estimatedTotal / data.budget : 0;
  const statusColor: [number, number, number] = data.estimatedTotal <= data.budget ? successGreen : data.estimatedTotal <= data.budget * 1.15 ? [251, 191, 36] : dangerRed;

  /* ── Quick Stats Row ─────────────────────────────────── */
  let y = 66;
  const cardW = (pageW - 28 - 18) / 4;
  drawStatCard(doc, 14, y, cardW, 24, '✈️', 'Flights', data.flightEstimate, primaryGreen);
  drawStatCard(doc, 14 + cardW + 6, y, cardW, 24, '🏨', `${stayNights} Night(s)`, money(data.currency, accommodationTotal), [56, 189, 248]);
  drawStatCard(doc, 14 + (cardW + 6) * 2, y, cardW, 24, '🍽️', 'Meals', money(data.currency, mealsCost), jamaicanGold);
  drawStatCard(doc, 14 + (cardW + 6) * 3, y, cardW, 24, '🎒', 'Essentials', money(data.currency, essentialsCost), warningOrange);
  y += 32;

  /* ── Trip Summary + Budget Status side by side ──────── */
  const gap = 8;
  const halfW = (pageW - 28 - gap) / 2;

  // Trip Summary card
  doc.setFillColor(...lightGreen);
  doc.setDrawColor(220, 235, 225);
  doc.setLineWidth(0.2);
  doc.roundedRect(14, y, halfW, 50, 4, 4, 'FD');
  doc.setFillColor(...primaryGreen);
  doc.roundedRect(14, y, halfW, 2.5, 4, 4, 'F');
  doc.setFillColor(...lightGreen);
  doc.rect(14, y + 1.5, halfW, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...darkGreen);
  doc.text('TRIP SUMMARY', 19, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...bodyTextColor);
  const summaryLines = [
    `Destination: ${data.destination}`,
    `Dates: ${data.startDate || '—'} to ${data.endDate || '—'} (${data.nights} nights)`,
    `Travellers: ${data.travellers}`,
    `Accommodation: ${data.accommodation}`,
    `Interests: ${data.interests.join(', ')}`
  ];
  summaryLines.forEach((line, idx) => {
    doc.text(doc.splitTextToSize(line, halfW - 12)[0], 19, y + 18 + idx * 6);
  });

  // Budget Status card
  const bx = 14 + halfW + gap;
  doc.setFillColor(...lightGreen);
  doc.setDrawColor(220, 235, 225);
  doc.roundedRect(bx, y, halfW, 50, 4, 4, 'FD');
  doc.setFillColor(...statusColor);
  doc.roundedRect(bx, y, halfW, 2.5, 4, 4, 'F');
  doc.setFillColor(...lightGreen);
  doc.rect(bx, y + 1.5, halfW, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...darkGreen);
  doc.text('BUDGET STATUS', bx + 5, y + 10);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...darkGreen);
  doc.text(money(data.currency, data.estimatedTotal), bx + 5, y + 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...mutedText);
  doc.text(`Budget: ${money(data.currency, data.budget)}`, bx + 5, y + 30);

  const statusText = data.estimatedTotal <= data.budget
    ? 'Within budget'
    : `${money(data.currency, data.estimatedTotal - data.budget)} over budget`;
  doc.setTextColor(...(data.estimatedTotal <= data.budget ? successGreen : dangerRed));
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(statusText, bx + 5, y + 37);

  // Progress bar
  doc.setFillColor(220, 230, 220);
  doc.roundedRect(bx + 5, y + 41, halfW - 15, 4.5, 2, 2, 'F');
  doc.setFillColor(...statusColor);
  doc.roundedRect(bx + 5, y + 41, (halfW - 15) * Math.min(1, budgetRatio), 4.5, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...darkGreen);
  doc.text(`${Math.round(budgetRatio * 100)}%`, bx + halfW - 12, y + 40, { align: 'right' });

  y += 58;

  /* ── Cost Breakdown Table ──────────────────────────── */
  y = drawSectionHeader(doc, y, 'Cost Breakdown');
  autoTable(doc, {
    startY: y,
    head: [['CATEGORY', 'ESTIMATE', 'NOTES']],
    body: [
      ['Flights', data.flightEstimate, `${data.departureCity} to ${data.destination}`],
      ['Accommodation', money(data.currency, accommodationTotal), `${stayNights} night(s) x ${money(data.currency, accomRate)}/night`],
      ['Meals & Dining', money(data.currency, mealsCost), `${stayNights} day(s) x ${data.travellers} traveller(s)`],
      ['Activities', money(data.currency, activitiesCost), 'Attraction entry, tours, local activities'],
      ['Travel Essentials', money(data.currency, essentialsCost), 'Per-traveller packing & prep estimate']
    ],
    foot: [
      [{ content: 'TOTAL ESTIMATE', styles: { fontStyle: 'bold' } }, money(data.currency, data.estimatedTotal), ''],
      [{ content: 'YOUR BUDGET', styles: { fontStyle: 'bold' } }, money(data.currency, data.budget), ''],
      [{ content: 'STATUS', styles: { fontStyle: 'bold' } }, data.estimatedTotal <= data.budget ? 'Within budget' : `${money(data.currency, data.estimatedTotal - data.budget)} over`, '']
    ],
    headStyles: { fillColor: primaryGreen, textColor: darkGreen, fontStyle: 'bold', fontSize: 7.5, cellPadding: 3 },
    bodyStyles: { fontSize: 8, cellPadding: 3.5, textColor: bodyTextColor },
    alternateRowStyles: { fillColor: lightGreen },
    footStyles: { fillColor: darkGreen, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 38 },
      1: { cellWidth: 38 }
    },
    tableLineColor: [200, 230, 210],
    tableLineWidth: 0.15,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    styles: { overflow: 'linebreak' }
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  /* ── Savings Goal Table ────────────────────────────── */
  y = drawSectionHeader(doc, y, 'Savings Goal Tracker');
  autoTable(doc, {
    startY: y,
    head: [['TARGET', 'CURRENT SAVINGS', 'PROGRESS', 'WEEKLY NEEDED']],
    body: [[
      money(data.currency, data.goalTargetAmount),
      money(data.currency, data.goalCurrentSavings),
      `${data.goalProgress}%`,
      `${money(data.currency, data.weeklyNeeded)} / week`
    ]],
    headStyles: { fillColor: primaryGreen, textColor: darkGreen, fontStyle: 'bold', fontSize: 7.5, cellPadding: 3 },
    bodyStyles: { fontSize: 9, cellPadding: 4, textColor: bodyTextColor, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: lightGreen },
    tableLineColor: [200, 230, 210],
    tableLineWidth: 0.15,
    margin: { left: 14, right: 14 },
    theme: 'grid'
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  /* ── Travel Essentials Checklist ────────────────────── */
  y = drawSectionHeader(doc, y, 'Travel Essentials Checklist');
  autoTable(doc, {
    startY: y,
    head: [['ITEM', 'EST. COST', 'PRIORITY']],
    body: [
      ['Swimwear', '$45 - $120', 'HIGH'],
      ['Reef-safe sunscreen', '$12 - $25', 'HIGH'],
      ['Beach shoes / sandals', '$25 - $70', 'MEDIUM'],
      ['Travel adapter & power bank', '$30 - $80', 'HIGH'],
      ['Snorkelling gear', '$35 - $100', 'OPTIONAL'],
      ['Mini cosmetics kit', '$25 - $75', 'MEDIUM'],
      ['Waterproof phone pouch', '$10 - $25', 'MEDIUM'],
      ['Light first-aid kit', '$12 - $30', 'HIGH']
    ],
    headStyles: { fillColor: primaryGreen, textColor: darkGreen, fontStyle: 'bold', fontSize: 7.5, cellPadding: 3 },
    bodyStyles: { fontSize: 8, cellPadding: 3, textColor: bodyTextColor },
    alternateRowStyles: { fillColor: lightGreen },
    columnStyles: {
      0: { cellWidth: 65 },
      1: { cellWidth: 35 },
      2: { fontStyle: 'bold', cellWidth: 28, halign: 'center' as const }
    },
    tableLineColor: [200, 230, 210],
    tableLineWidth: 0.15,
    margin: { left: 14, right: 14 },
    theme: 'grid'
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  /* ── AI-Generated Trip Plan ────────────────────────── */
  if (data.aiPlanText) {
    y = drawSectionHeader(doc, y, 'AI-Generated Trip Plan');
    const blocks = parseMarkdownToBlocks(data.aiPlanText);
    y = renderBlocks(doc, blocks, y);
  }

  addFooter(doc);

  const dateStr = new Date().toISOString().slice(0, 10);
  const safeDestination = data.destination.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  doc.save(`LikkleWisdom_${dateStr}_Financial-Planner_${safeDestination}.pdf`);
}
