import { Box, Heading } from '@chakra-ui/react';
import QuotationForm from '../components/QuotationForm';

export default function QuotationPage() {
  return (
    <Box p={8} maxWidth="800px" margin="0 auto">
      <Heading as="h1" size="xl" mb={8}>
        RO System Quotation Generator
      </Heading>
      <QuotationForm />
    </Box>
  );
}
