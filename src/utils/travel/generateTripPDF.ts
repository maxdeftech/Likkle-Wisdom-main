import { jsPDF } from 'jspdf';

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

function sectionHeading(doc: jsPDF, text: string, y: number): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(19, 236, 91);
  doc.text(text.toUpperCase(), 14, y);
  doc.setDrawColor(19, 236, 91);
  doc.setLineWidth(0.4);
  doc.line(14, y + 1.5, 196, y + 1.5);
  return y + 8;
}

function bodyText(doc: jsPDF, text: string, y: number, maxWidth = 182): number {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  const lines = doc.splitTextToSize(text, maxWidth);
  const pageH = doc.internal.pageSize.height;
  lines.forEach((line: string) => {
    if (y > pageH - 20) {
      doc.addPage();
      y = 20;
    }
    doc.text(line, 14, y);
    y += 5;
  });
  return y + 2;
}

export function generateTripPDF(data: TripPDFData): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.width;

  doc.setFillColor(10, 26, 15);
  doc.rect(0, 0, pageW, 38, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(19, 236, 91);
  doc.text('LIKKLE WISDOM', 14, 13);
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('Travel Financial Overview', 14, 23);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.text(`Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 31);

  let y = 48;
  y = sectionHeading(doc, 'Trip Summary', y);
  y = bodyText(doc, [
    `Destination: ${data.destination}`,
    `Departure: ${data.departureCity}`,
    `Travel Dates: ${data.startDate || '-'} to ${data.endDate || '-'} (${data.nights} nights)`,
    `Travellers: ${data.travellers}`,
    `Budget: ${data.currency} ${data.budget.toLocaleString()}`,
    `Accommodation: ${data.accommodation}`,
    `Interests: ${data.interests.join(', ')}`
  ].join('\n'), y);
  y += 4;

  y = sectionHeading(doc, 'Estimated Cost Breakdown', y);
  const stayNights = data.nights || 1;
  const accomRate = data.accommodation === 'Hostel' ? 55 : data.accommodation === 'Villa' ? 280 : data.accommodation === 'Airbnb' ? 120 : 180;
  const mealsCost = 55 * stayNights * data.travellers;
  const activitiesCost = 45 * stayNights * data.travellers;
  const essentialsCost = 160 * data.travellers;
  y = bodyText(doc, [
    `Flights estimate: ${data.flightEstimate}`,
    `Accommodation: ${data.currency} ${(accomRate * stayNights).toLocaleString()} (${stayNights} night(s) at about ${data.currency} ${accomRate}/night)`,
    `Meals: ${data.currency} ${mealsCost.toLocaleString()} estimate`,
    `Activities: ${data.currency} ${activitiesCost.toLocaleString()} estimate`,
    `Travel Essentials: ${data.currency} ${essentialsCost.toLocaleString()} estimate`,
    `Total Estimate: ${data.currency} ${data.estimatedTotal.toLocaleString()}`,
    `Your Budget: ${data.currency} ${data.budget.toLocaleString()}`,
    `Status: ${data.estimatedTotal <= data.budget ? 'Within budget' : `${data.currency} ${(data.estimatedTotal - data.budget).toLocaleString()} over budget`}`
  ].join('\n'), y);
  y += 4;

  y = sectionHeading(doc, 'Savings Goal', y);
  y = bodyText(doc, [
    `Target: ${data.currency} ${data.goalTargetAmount.toLocaleString()}`,
    `Current savings: ${data.currency} ${data.goalCurrentSavings.toLocaleString()}`,
    `Progress: ${data.goalProgress}%`,
    `Weekly needed: ${data.currency} ${data.weeklyNeeded.toLocaleString()} per week`
  ].join('\n'), y);
  y += 4;

  if (data.aiPlanText) {
    y = sectionHeading(doc, 'AI-Generated Trip Plan', y);
    y = bodyText(doc, stripMarkdown(data.aiPlanText), y);
    y += 4;
  }

  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    const footerY = doc.internal.pageSize.height - 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(160, 160, 160);
    doc.text('Likkle Wisdom Travel Planner - All cost estimates are approximate. Verify prices with providers before booking.', 14, footerY);
    doc.text(`Page ${page} of ${totalPages}`, pageW - 14, footerY, { align: 'right' });
  }

  const fileName = `likkle-wisdom-trip-${data.destination.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.pdf`;
  doc.save(fileName);
}
