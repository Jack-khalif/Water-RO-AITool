import { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Progress,
  useToast,
  SimpleGrid,
  Icon,
  List,
  ListItem,
  ListIcon,
  Card,
  CardHeader,
  CardBody,
  Divider,
  Badge,
} from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { FaUpload, FaCheck, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import { MdCheckCircle, MdError } from 'react-icons/md';

export default function Upload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const router = useRouter();
  const { data: session } = useSession();

  // Redirect if not authenticated
  if (!session) {
    router.push('/');
    return null;
  }

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setFile(file);
  };

  const handleUpload = async () => {
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF file',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    setIsUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload/process-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      toast({
        title: 'Upload successful',
        description: 'Your PDF has been processed successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      setResult(result);

    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'There was an error processing your file',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
      setIsUploading(false);
      setProgress(0);
    }
  };

  return (
    <Layout>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box>
            <Heading size="xl" mb={2}>Upload Lab Report</Heading>
            <Text color="gray.600">
              Upload your water analysis report to get an AI-powered RO system design and proposal.
            </Text>
          </Box>

          {/* Upload Section */}
          <Card>
            <CardHeader>
              <Heading size="md">Document Upload</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={6} align="stretch">
                <Box
                  border="2px dashed"
                  borderColor={file ? 'green.500' : 'gray.300'}
                  borderRadius="xl"
                  p={8}
                  textAlign="center"
                  bg={file ? 'green.50' : 'gray.50'}
                  transition="all 0.3s"
                  _hover={{ borderColor: 'blue.500', bg: 'blue.50' }}
                  cursor="pointer"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <input
                    id="file-upload"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <Icon
                    as={file ? FaCheck : FaUpload}
                    w={8}
                    h={8}
                    color={file ? 'green.500' : 'gray.400'}
                    mb={4}
                  />
                  <Text fontWeight="medium" mb={2}>
                    {file ? file.name : 'Click or drag to upload PDF'}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    Supported format: PDF up to 10MB
                  </Text>
                </Box>

                <Button
                  colorScheme="blue"
                  size="lg"
                  leftIcon={loading ? <FaSpinner /> : <FaUpload />}
                  onClick={handleUpload}
                  isLoading={loading}
                  loadingText="Processing..."
                  disabled={!file}
                  width="full"
                >
                  Analyze Report
                </Button>
              </VStack>
            </CardBody>
          </Card>

          {/* Progress Section */}
          {loading && (
            <Card>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Text fontWeight="medium">Analysis Progress</Text>
                  <Progress
                    value={progress}
                    size="lg"
                    colorScheme="blue"
                    hasStripe
                    isAnimated
                  />
                  <Text color="gray.600" fontSize="sm">
                    Processing...
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          )}

          {/* Results Section */}
          {result && !loading && (
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
              {/* Water Analysis Results */}
              <Card>
                <CardHeader>
                  <HStack justify="space-between">
                    <Heading size="md">Water Analysis</Heading>
                    <Badge
                      colorScheme={result.age_status === 'current' ? 'green' : 'yellow'}
                    >
                      {result.age_status === 'current' ? 'Current' : 'Budgetary'}
                    </Badge>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <VStack align="stretch" spacing={4}>
                    <List spacing={3}>
                      {Object.entries(result.parameters || {}).map(([key, value]) => (
                        <ListItem key={key}>
                          <HStack justify="space-between">
                            <Text>{key}:</Text>
                            <Text fontWeight="medium">{value}</Text>
                          </HStack>
                        </ListItem>
                      ))}
                    </List>
                    
                    <Divider />
                    
                    <Box>
                      <Text fontWeight="medium" mb={2}>Concerns:</Text>
                      <List spacing={2}>
                        {result.concerns?.map((concern, index) => (
                          <ListItem key={index}>
                            <ListIcon as={FaExclamationTriangle} color="yellow.500" />
                            {concern}
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  </VStack>
                </CardBody>
              </Card>

              {/* System Design */}
              <Card>
                <CardHeader>
                  <Heading size="md">Recommended System</Heading>
                </CardHeader>
                <CardBody>
                  <VStack align="stretch" spacing={4}>
                    <Box>
                      <Text fontWeight="medium" mb={2}>Pretreatment:</Text>
                      <List spacing={2}>
                        {result.pretreatment_recommendations?.map((rec, index) => (
                          <ListItem key={index}>
                            <ListIcon as={MdCheckCircle} color="green.500" />
                            {rec}
                          </ListItem>
                        ))}
                      </List>
                    </Box>

                    {result.system_specifications && (
                      <Box>
                        <Text fontWeight="medium" mb={2}>System Specifications:</Text>
                        <List spacing={2}>
                          {Object.entries(result.system_specifications).map(([key, value]) => (
                            <ListItem key={key}>
                              <HStack justify="space-between">
                                <Text>{key}:</Text>
                                <Text fontWeight="medium">{value}</Text>
                              </HStack>
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}

                    <Button
                      colorScheme="green"
                      size="lg"
                      width="full"
                      onClick={() => router.push('/proposal')}
                    >
                      Generate Proposal
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            </SimpleGrid>
          )}
        </VStack>
      </Container>
    </Layout>
  );
}
