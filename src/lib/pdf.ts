import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function generatePDF(
  element: HTMLElement,
  filename: string = 'invoice.pdf'
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    width: 794, // A4 width at 96dpi
    windowWidth: 794,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;

  // If the image is taller than one page, scale to fit
  if (imgHeight > pdfHeight) {
    const ratio = pdfHeight / imgHeight;
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth * ratio, pdfHeight);
  } else {
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
  }

  pdf.save(filename);
}

export async function printInvoice(element: HTMLElement): Promise<void> {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.print();
    return;
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    width: 794,
    windowWidth: 794,
  });

  const imgData = canvas.toDataURL('image/png');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Print Invoice</title>
      <style>
        @page { size: A4; margin: 0; }
        body { margin: 0; padding: 0; }
        img { width: 100%; height: auto; }
      </style>
    </head>
    <body>
      <img src="${imgData}" />
      <script>
        window.onload = function() {
          window.print();
          window.close();
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}
