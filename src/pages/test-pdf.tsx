import { generateQuotationPDF } from '../services/pdfService';
import { Button } from '@chakra-ui/react';

export default function TestPDF() {
  const handleGenerate = async () => {
    const pdfBytes = await generateQuotationPDF({
      county: 'Nairobi',
      subCounty: 'Westlands',
      travelCost: 7500,
      clientInfo: { name: 'Test Client' }
    });
    
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    window.open(url);
  };

  return (
    <Button onClick={handleGenerate} colorScheme="blue">
      Generate Test PDF
    </Button>
  );
}
