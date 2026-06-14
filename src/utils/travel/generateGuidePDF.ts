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

export function generateGuidePDF(prompt: string, response: string): void {
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
  doc.text('AI Destination Guide', 14, 23);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.text(`Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 31);

  let y = 48;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('YOUR QUERY', 14, y);
  y += 6;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9.5);
  doc.setTextColor(40, 40, 40);
  const promptLines = doc.splitTextToSize(`"${prompt}"`, 182);
  doc.text(promptLines, 14, y);
  y += promptLines.length * 5 + 8;

  doc.setDrawColor(19, 236, 91);
  doc.setLineWidth(0.4);
  doc.line(14, y, 196, y);
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(19, 236, 91);
  doc.text('GUIDE RESPONSE', 14, y);
  y += 7;

  const bodyLines = doc.splitTextToSize(stripMarkdown(response), 182);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  const pageH = doc.internal.pageSize.height;
  bodyLines.forEach((line: string) => {
    if (y > pageH - 20) {
      doc.addPage();
      y = 20;
    }
    doc.text(line, 14, y);
    y += 5;
  });

  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    const footerY = doc.internal.pageSize.height - 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(160, 160, 160);
    doc.text('Likkle Wisdom Travel Planner - All suggestions are for informational purposes only.', 14, footerY);
    doc.text(`Page ${page} of ${totalPages}`, pageW - 14, footerY, { align: 'right' });
  }

  doc.save(`likkle-wisdom-guide-${Date.now()}.pdf`);
}
