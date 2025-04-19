import { useState } from 'react';
import { Box, Button, Container, Heading, Text, VStack, useToast } from '@chakra-ui/react';

export default function TestUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const toast = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: 'No file selected',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload/process-pdf', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResult(data);
      
      toast({
        title: 'Upload successful',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxW="container.xl" py={10}>
      <VStack spacing={6} align="stretch">
        <Heading>Test PDF Upload</Heading>
        
        <Box>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            style={{ marginBottom: '1rem' }}
          />
          <Button
            colorScheme="blue"
            onClick={handleUpload}
            isLoading={loading}
            loadingText="Processing..."
            disabled={!file}
          >
            Upload and Process
          </Button>
        </Box>

        {result && (
          <Box>
            <Heading size="md" mb={4}>Results:</Heading>
            <Text whiteSpace="pre-wrap" fontFamily="monospace">
              {JSON.stringify(result, null, 2)}
            </Text>
          </Box>
        )}
      </VStack>
    </Container>
  );
}
