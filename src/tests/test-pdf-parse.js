import PDFParser from 'pdf2json';
import { readFileSync } from 'fs';

const testPDF = async () => {
  const pdfParser = new PDFParser();
  
  pdfParser.on('pdfParser_dataError', (errData) => {
    console.error('Error:', errData);
  });
  
  pdfParser.on('pdfParser_dataReady', (pdfData) => {
    console.log('PDF parsed successfully!');
    console.log('Data object keys:', Object.keys(pdfData));
    
    // Try different methods to get text
    const rawText = pdfParser.getRawTextContent();
    console.log('\ngetRawTextContent():', rawText ? rawText.substring(0, 200) : 'EMPTY');
    console.log('Length:', rawText ? rawText.length : 0);
    
    // Check the actual data structure
    if (pdfData && pdfData.Pages) {
      console.log('\nNumber of pages:', pdfData.Pages.length);
      if (pdfData.Pages[0] && pdfData.Pages[0].Texts) {
        console.log('Texts on first page:', pdfData.Pages[0].Texts.length);
        if (pdfData.Pages[0].Texts[0]) {
          console.log('First text item:', pdfData.Pages[0].Texts[0]);
        }
      }
    }
  });
  
  // You'll need to provide a PDF file path here
  console.log('Please provide a PDF file path as first argument');
  const pdfPath = process.argv[2];
  if (!pdfPath) {
    console.log('Usage: node test-pdf-parse.js <path-to-pdf>');
    process.exit(1);
  }
  
  const buffer = readFileSync(pdfPath);
  pdfParser.parseBuffer(buffer);
};

testPDF();
