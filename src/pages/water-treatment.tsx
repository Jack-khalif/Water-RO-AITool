import { useEffect, useState } from 'react';
import { Box, Container, Heading, Text, VStack, useToast } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import WaterTreatmentAgent from '../components/WaterTreatmentAgent';
import { useAuth } from '../context/AuthContext';

export default function WaterTreatmentPage() {
  const router = useRouter();
  const toast = useToast();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const { isAuthenticated, user } = useAuth?.() || { isAuthenticated: false, user: null };

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to access this page',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      router.push('/login?redirect=/water-treatment');
      return;
    }

    // User is authenticated, set authorized state
    setIsAuthorized(true);
  }, [isAuthenticated, router, toast]);

  if (!isAuthorized) {
    return (
      <Container maxW="container.xl" py={10}>
        <VStack spacing={4}>
          <Heading>Authenticating...</Heading>
          <Text>Please wait while we verify your credentials.</Text>
        </VStack>
      </Container>
    );
  }

  return (
    <Box>
      <Container maxW="container.xl" py={4}>
        <VStack spacing={8} align="stretch">
          <WaterTreatmentAgent />
        </VStack>
      </Container>
    </Box>
  );
}
