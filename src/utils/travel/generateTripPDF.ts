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
const mutedText: [number, number, number] = [120, 120, 120];
const lightGreen: [number, number, number] = [245, 255, 248];

const money = (currency: string, amount: number) => `${currency} ${amount.toLocaleString()}`;

function drawHeader(doc: jsPDF, title: string, destination: string): void {
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
  doc.text(title, 14, 29);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(200, 210, 204);
  doc.text(`Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 38);

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(pageW - 74, 13, 60, 10, 5, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...darkGreen);
  doc.text(destination.slice(0, 24), pageW - 44, 19.5, { align: 'center' });
}

function drawCard(doc: jsPDF, x: number, y: number, w: number, h: number, title: string): void {
  doc.setFillColor(...lightGreen);
  doc.setDrawColor(...primaryGreen);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, w, h, 4, 4, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...darkGreen);
  doc.text(title.toUpperCase(), x + 5, y + 8);
}

function addFooter(doc: jsPDF): void {
  const pageW = doc.internal.pageSize.width;
  const pageH = doc.internal.pageSize.height;
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...primaryGreen);
    doc.text('LIKKLE WISDOM', 14, pageH - 9);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(150, 150, 150);
    doc.text('All cost estimates are approximate. Verify prices with providers before booking.', pageW / 2, pageH - 9, { align: 'center' });
    doc.text(`Page ${page} of ${totalPages}`, pageW - 14, pageH - 9, { align: 'right' });
  }
}

function ensurePage(doc: jsPDF, y: number, required = 32): number {
  if (y + required < doc.internal.pageSize.height - 18) return y;
  doc.addPage();
  return 20;
}

function addBodyText(doc: jsPDF, text: string, y: number): number {
  const lines = doc.splitTextToSize(text, 182);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...bodyTextColor);
  lines.forEach((line: string) => {
    y = ensurePage(doc, y, 8);
    doc.text(line, 14, y);
    y += 5;
  });
  return y;
}

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
  const statusColor: [number, number, number] = data.estimatedTotal <= data.budget ? primaryGreen : data.estimatedTotal <= data.budget * 1.15 ? [251, 191, 36] : [239, 68, 68];

  let y = 62;
  const gap = 8;
  const cardW = (pageW - 28 - gap) / 2;
  drawCard(doc, 14, y, cardW, 48, 'Trip Summary');
  drawCard(doc, 14 + cardW + gap, y, cardW, 48, 'Budget Status');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...bodyTextColor);
  [
    `Destination: ${data.destination}`,
    `Dates: ${data.startDate || '-'} to ${data.endDate || '-'} (${data.nights} nights)`,
    `Travellers: ${data.travellers}`,
    `Accommodation: ${data.accommodation}`,
    `Interests: ${data.interests.join(', ')}`
  ].forEach((line, index) => doc.text(line, 19, y + 16 + index * 6));

  const statusX = 19 + cardW + gap;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...darkGreen);
  doc.text(money(data.currency, data.estimatedTotal), statusX, y + 20);
  doc.setFontSize(8);
  doc.setTextColor(...mutedText);
  doc.text(`Budget: ${money(data.currency, data.budget)}`, statusX, y + 28);
  doc.text(data.estimatedTotal <= data.budget ? 'Within budget' : `${money(data.currency, data.estimatedTotal - data.budget)} over budget`, statusX, y + 35);
  doc.setFillColor(220, 230, 220);
  doc.roundedRect(statusX, y + 39, cardW - 10, 4.5, 2, 2, 'F');
  doc.setFillColor(...statusColor);
  doc.roundedRect(statusX, y + 39, (cardW - 10) * Math.min(1, budgetRatio), 4.5, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...darkGreen);
  doc.text(`${Math.round(budgetRatio * 100)}%`, statusX + cardW - 10, y + 37, { align: 'right' });

  y += 60;
  autoTable(doc, {
    startY: y,
    head: [['CATEGORY', 'ESTIMATE', 'NOTES']],
    body: [
      ['Flights', data.flightEstimate, `${data.departureCity} to ${data.destination}`],
      ['Accommodation', money(data.currency, accommodationTotal), `${stayNights} night(s) at about ${money(data.currency, accomRate)}/night`],
      ['Meals', money(data.currency, mealsCost), `${stayNights} day(s) x ${data.travellers} traveller(s)`],
      ['Activities', money(data.currency, activitiesCost), 'Estimated attraction and local activity costs'],
      ['Travel Essentials', money(data.currency, essentialsCost), 'Per traveller packing and prep estimate']
    ],
    foot: [
      ['TOTAL ESTIMATE', money(data.currency, data.estimatedTotal), ''],
      ['YOUR BUDGET', money(data.currency, data.budget), ''],
      ['STATUS', data.estimatedTotal <= data.budget ? 'Within budget' : `${money(data.currency, data.estimatedTotal - data.budget)} over`, '']
    ],
    headStyles: { fillColor: primaryGreen, textColor: darkGreen, fontStyle: 'bold', fontSize: 8, cellPadding: 3 },
    bodyStyles: { fontSize: 8.5, cellPadding: 3, textColor: bodyTextColor },
    alternateRowStyles: { fillColor: lightGreen },
    footStyles: { fillColor: darkGreen, textColor: primaryGreen, fontStyle: 'bold', fontSize: 8.5 },
    tableLineColor: [200, 230, 210],
    tableLineWidth: 0.2,
    margin: { left: 14, right: 14 },
    theme: 'grid'
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  autoTable(doc, {
    startY: y,
    head: [['TARGET', 'CURRENT SAVINGS', 'PROGRESS', 'WEEKLY NEEDED']],
    body: [[
      money(data.currency, data.goalTargetAmount),
      money(data.currency, data.goalCurrentSavings),
      `${data.goalProgress}%`,
      `${money(data.currency, data.weeklyNeeded)}/week`
    ]],
    headStyles: { fillColor: primaryGreen, textColor: darkGreen, fontStyle: 'bold', fontSize: 8, cellPadding: 3 },
    bodyStyles: { fontSize: 8.5, cellPadding: 3, textColor: bodyTextColor },
    alternateRowStyles: { fillColor: lightGreen },
    tableLineColor: [200, 230, 210],
    tableLineWidth: 0.2,
    margin: { left: 14, right: 14 },
    theme: 'grid'
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  autoTable(doc, {
    startY: y,
    head: [['TRAVEL ESSENTIAL', 'EST. COST']],
    body: [
      ['Swimwear', '$45-120'],
      ['Reef-safe sunscreen', '$12-25'],
      ['Beach shoes / sandals', '$25-70'],
      ['Travel adapter & power bank', '$30-80'],
      ['Snorkelling gear', '$35-100'],
      ['Mini cosmetics kit', '$25-75'],
      ['Waterproof phone pouch', '$10-25'],
      ['Light first-aid kit', '$12-30']
    ],
    headStyles: { fillColor: primaryGreen, textColor: darkGreen, fontStyle: 'bold', fontSize: 8, cellPadding: 3 },
    bodyStyles: { fontSize: 8.5, cellPadding: 3, textColor: bodyTextColor },
    alternateRowStyles: { fillColor: lightGreen },
    tableLineColor: [200, 230, 210],
    tableLineWidth: 0.2,
    margin: { left: 14, right: 14 },
    theme: 'grid'
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  if (data.aiPlanText) {
    y = ensurePage(doc, y, 24);
    doc.setFillColor(...darkGreen);
    doc.roundedRect(14, y, pageW - 28, 8, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('AI-GENERATED TRIP PLAN', 18, y + 5.5);
    y += 14;
    y = addBodyText(doc, stripMarkdown(data.aiPlanText), y);
  }

  addFooter(doc);
  doc.save(`likkle-wisdom-trip-${data.destination.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.pdf`);
}
