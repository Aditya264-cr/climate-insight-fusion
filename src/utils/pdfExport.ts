import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ExportOptions {
  filename?: string;
  includeCharts?: boolean;
  includeImages?: boolean;
  quality?: number;
}

export const exportToPDF = async (options: ExportOptions = {}): Promise<void> => {
  const {
    filename = `climate-report-${new Date().toISOString().split('T')[0]}.pdf`,
    includeCharts = true,
    includeImages = true,
    quality = 0.95
  } = options;

  try {
    // Create a new PDF document
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    let currentY = margin;

    // Helper function to add page if needed
    const checkAddPage = (requiredHeight: number) => {
      if (currentY + requiredHeight > pageHeight - margin) {
        pdf.addPage();
        currentY = margin;
      }
    };

    // Title Page
    pdf.setFontSize(24);
    pdf.setFont(undefined, 'bold');
    pdf.text('Climate-Economy Insight Report', pageWidth / 2, currentY, { align: 'center' });
    currentY += 15;

    pdf.setFontSize(14);
    pdf.setFont(undefined, 'normal');
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 20;

    // Get all sections to export
    const sections = [
      'insights',
      'forecast', 
      'analysis',
      'search',
      'sources'
    ];

    for (const sectionId of sections) {
      const sectionElement = document.querySelector(`[data-state="active"][data-value="${sectionId}"]`)?.parentElement?.querySelector('[role="tabpanel"]');
      
      if (sectionElement) {
        checkAddPage(30);
        
        // Section title
        pdf.setFontSize(18);
        pdf.setFont(undefined, 'bold');
        const sectionTitle = getSectionTitle(sectionId);
        pdf.text(sectionTitle, margin, currentY);
        currentY += 15;

        try {
          // Capture section as canvas
          const canvas = await html2canvas(sectionElement as HTMLElement, {
            scale: quality,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            width: sectionElement.scrollWidth,
            height: sectionElement.scrollHeight
          });

          const imgData = canvas.toDataURL('image/png');
          const imgWidth = contentWidth;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          // Check if image fits on current page
          if (currentY + imgHeight > pageHeight - margin) {
            pdf.addPage();
            currentY = margin;
          }

          pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight);
          currentY += imgHeight + 10;

        } catch (error) {
          console.warn(`Failed to capture section ${sectionId}:`, error);
          // Add placeholder text
          pdf.setFontSize(12);
          pdf.setFont(undefined, 'normal');
          pdf.text(`[Content from ${sectionTitle} section]`, margin, currentY);
          currentY += 20;
        }
      }
    }

    // Footer on all pages
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.text(
        `Page ${i} of ${totalPages} • Climate-Economy Insight Engine`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Save the PDF
    pdf.save(filename);
    
  } catch (error) {
    console.error('PDF export failed:', error);
    throw new Error('Failed to export PDF. Please try again.');
  }
};

const getSectionTitle = (sectionId: string): string => {
  const titles = {
    insights: 'Executive Insights',
    forecast: 'Forecast Analysis',
    analysis: 'Image Analysis',
    search: 'Vector Search Results',
    sources: 'Data Sources'
  };
  return titles[sectionId as keyof typeof titles] || 'Report Section';
};

export default exportToPDF;