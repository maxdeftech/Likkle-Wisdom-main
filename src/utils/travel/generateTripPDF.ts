import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  darkGreen, primaryGreen, jamaicanGold, bodyTextColor, mutedText,
  lightGreen, successGreen, dangerRed, warningOrange,
  sanitise, money, ensurePage,
  drawHeader, drawStatCard, drawSectionHeader, addFooter,
  parseMarkdownToBlocks, renderBlocks,
  type RGB
} from './pdfHelpers';

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

const MARGIN = 14;
const PAGE_W = 210;
const CONTENT_W = PAGE_W - MARGIN * 2;

export function generateTripPDF(data: TripPDFData): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  drawHeader(doc, 'Travel Financial Overview', data.destination);

  const stayNights = data.nights || 1;
  const accomRate = data.accommodation === 'Hostel' ? 55 : data.accommodation === 'Villa' ? 280 : data.accommodation === 'Airbnb' ? 120 : 180;
  const accommodationTotal = accomRate * stayNights;
  const mealsCost = 55 * stayNights * data.travellers;
  const activitiesCost = 45 * stayNights * data.travellers;
  const essentialsCost = 160 * data.travellers;
  const budgetRatio = data.budget ? data.estimatedTotal / data.budget : 0;
  const statusColor: RGB = data.estimatedTotal <= data.budget ? successGreen : data.estimatedTotal <= data.budget * 1.15 ? [251, 191, 36] : dangerRed;

  /* ── Quick Stats Row ─────────────────────────────────── */
  let y = 66;
  const cardW = (CONTENT_W - 18) / 4;
  drawStatCard(doc, MARGIN, y, cardW, 24, '', 'Flights', sanitise(data.flightEstimate), primaryGreen);
  drawStatCard(doc, MARGIN + cardW + 6, y, cardW, 24, '', `${stayNights} Night(s)`, money(data.currency, accommodationTotal), [56, 189, 248]);
  drawStatCard(doc, MARGIN + (cardW + 6) * 2, y, cardW, 24, '', 'Meals', money(data.currency, mealsCost), jamaicanGold);
  drawStatCard(doc, MARGIN + (cardW + 6) * 3, y, cardW, 24, '', 'Essentials', money(data.currency, essentialsCost), warningOrange);
  y += 32;

  /* ── Trip Summary + Budget Status side by side ──────── */
  const gap = 8;
  const halfW = (CONTENT_W - gap) / 2;

  // Trip Summary card
  doc.setFillColor(...lightGreen);
  doc.setDrawColor(220, 235, 225);
  doc.setLineWidth(0.2);
  doc.roundedRect(MARGIN, y, halfW, 50, 4, 4, 'FD');
  doc.setFillColor(...primaryGreen);
  doc.roundedRect(MARGIN, y, halfW, 2.5, 4, 4, 'F');
  doc.setFillColor(...lightGreen);
  doc.rect(MARGIN, y + 1.5, halfW, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...darkGreen);
  doc.text('TRIP SUMMARY', MARGIN + 5, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...bodyTextColor);
  const summaryLines = [
    `Destination: ${sanitise(data.destination)}`,
    `Dates: ${data.startDate || '--'} to ${data.endDate || '--'} (${data.nights} nights)`,
    `Travellers: ${data.travellers}`,
    `Accommodation: ${sanitise(data.accommodation)}`,
    `Interests: ${data.interests.map(sanitise).join(', ')}`
  ];
  summaryLines.forEach((line, idx) => {
    const trimmed = doc.splitTextToSize(line, halfW - 12)[0];
    doc.text(trimmed, MARGIN + 5, y + 18 + idx * 6);
  });

  // Budget Status card
  const bx = MARGIN + halfW + gap;
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
  const barW = halfW - 15;
  doc.setFillColor(220, 230, 220);
  doc.roundedRect(bx + 5, y + 41, barW, 4.5, 2, 2, 'F');
  doc.setFillColor(...statusColor);
  doc.roundedRect(bx + 5, y + 41, barW * Math.min(1, budgetRatio), 4.5, 2, 2, 'F');
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
      ['Flights', sanitise(data.flightEstimate), `${sanitise(data.departureCity)} to ${sanitise(data.destination)}`],
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
      0: { cellWidth: 40 },
      1: { cellWidth: 40 },
      2: { cellWidth: 'auto' }
    },
    tableLineColor: [200, 230, 210],
    tableLineWidth: 0.15,
    margin: { left: MARGIN, right: MARGIN },
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
    margin: { left: MARGIN, right: MARGIN },
    theme: 'grid',
    styles: { overflow: 'linebreak', cellWidth: 'auto' }
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
      2: { fontStyle: 'bold', cellWidth: 30, halign: 'center' as const }
    },
    tableLineColor: [200, 230, 210],
    tableLineWidth: 0.15,
    margin: { left: MARGIN, right: MARGIN },
    theme: 'grid',
    styles: { overflow: 'linebreak' }
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  /* ── AI-Generated Trip Plan ────────────────────────── */
  if (data.aiPlanText) {
    y = drawSectionHeader(doc, y, 'AI-Generated Trip Plan');
    const blocks = parseMarkdownToBlocks(data.aiPlanText);
    y = renderBlocks(doc, blocks, y);
  }

  addFooter(doc, 'Financial Planner Module');

  const dateStr = new Date().toISOString().slice(0, 10);
  const safeDestination = data.destination.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  doc.save(`LikkleWisdom_${dateStr}_Financial-Planner_${safeDestination}.pdf`);
}
