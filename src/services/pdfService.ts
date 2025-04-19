import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function generateQuotationPDF(quotation: any) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);
  
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  // Add content
  page.drawText('HydroFlow Quotation', {
    x: 50,
    y: height - 50,
    size: 24,
    font,
    color: rgb(0, 0, 0.5),
  });
  
  // Add more content here...
  
  return await pdfDoc.save();
}
