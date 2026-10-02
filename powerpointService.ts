import pptxgen from 'pptxgenjs';
import * as htmlToImage from 'html-to-image';

export const exportToPowerPoint = async (slideIds: string[], fileName: string = 'Bao_Cao_San_Xuat.pptx') => {
  const pptx = new pptxgen();

  // Set presentation properties
  pptx.title = 'Báo cáo Sản xuất';
  pptx.layout = 'LAYOUT_16x9';

  for (const id of slideIds) {
    const element = document.getElementById(id);
    if (!element) {
      console.warn(`Element with id ${id} not found`);
      continue;
    }

    try {
      // Use html-to-image which supports oklch better than html2canvas
      const dataUrl = await htmlToImage.toPng(element, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        skipFonts: true, // Prevent CORS errors with external fonts
        fontEmbedCSS: '', // Ensure no attempt to embed external fonts
        // Filter out elements that shouldn't be in the PPT
        filter: (node) => {
          if (node instanceof HTMLElement) {
            // Hide elements that are marked as hidden for print or specifically for PPT
            if (node.classList.contains('print:hidden') || 
                node.classList.contains('hidden-ppt') ||
                node.tagName.toLowerCase() === 'button') {
              return false;
            }
          }
          return true;
        }
      });

      const slide = pptx.addSlide();
      
      // Add background image (the whole slide)
      slide.addImage({
        data: dataUrl,
        x: 0,
        y: 0,
        w: '100%',
        h: '100%'
      });
    } catch (error) {
      console.error(`Error capturing slide ${id}:`, error);
    }
  }

  return pptx.writeFile({ fileName });
};
