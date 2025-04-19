import { Box, Container, Flex, HStack, Image, Link, Text, Button, useToast, Stack } from '@chakra-ui/react';
import { ReactNode } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const toast = useToast();

  // Check if user is authenticated
  const isAuthenticated = false; // TODO: Replace with actual auth check

  // List of protected routes
  const protectedRoutes = ['/upload', '/proposal'];

  useEffect(() => {
    // Check if current route is protected
    if (protectedRoutes.includes(router.pathname) && !isAuthenticated) {
      toast({
        title: 'Access Denied',
        description: 'Please login to access this page',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      router.push('/');
    }
  }, [router.pathname, isAuthenticated]);

  return (
    <Box minH="100vh" display="flex" flexDirection="column">
      {/* Header */}
      <Box as="header" bg="white" boxShadow="sm" py={4}>
        <Container maxW="container.xl">
          <Flex justify="space-between" align="center">
            <Link as={NextLink} href="/" _hover={{ textDecoration: 'none' }}>
              <HStack spacing={4}>
                <Image
                  src="/images/logo.png"
                  alt="Logo"
                  width={40}
                  height={40}
                  fallbackSrc="https://via.placeholder.com/40"
                />
                <Text fontSize="xl" fontWeight="bold" color="blue.500">
                  HydroFlow
                </Text>
              </HStack>
            </Link>

            <HStack spacing={8}>
              {isAuthenticated ? (
                <>
                  <Link
                    as={NextLink}
                    href="/upload"
                    fontWeight="medium"
                    color={router.pathname === '/upload' ? 'blue.500' : 'gray.600'}
                  >
                    Upload Report
                  </Link>
                  <Link
                    as={NextLink}
                    href="/proposal"
                    fontWeight="medium"
                    color={router.pathname === '/proposal' ? 'blue.500' : 'gray.600'}
                  >
                    Proposals
                  </Link>
                  <Button colorScheme="blue" size="sm" onClick={() => {
                    // TODO: Add actual logout logic
                    router.push('/');
                  }}>
                    Logout
                  </Button>
                </>
              ) : null}
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="container.xl" py={8}>
        {children}
      </Container>

      {/* Footer */}
      <Box bg="gray.800" color="white" mt="auto">
        <Container maxW="container.xl" py={8}>
          <Stack spacing={8} direction={{ base: 'column', md: 'row' }} justify="space-between">
            <Box>
              <Text fontSize="lg" fontWeight="bold" mb={4}>
                Davis & Shirtliff
              </Text>
              <Stack spacing={2}>
                <Text>Water & Energy Solutions</Text>
                <Text>Since 1946</Text>
              </Stack>
            </Box>
            <Box>
              <Text fontSize="lg" fontWeight="bold" mb={4}>
                Quick Links
              </Text>
              <Stack spacing={2}>
                <Link>Home</Link>
                <Link>Products</Link>
                <Link>About Us</Link>
                <Link>Contact</Link>
              </Stack>
            </Box>
            <Box>
              <Text fontSize="lg" fontWeight="bold" mb={4}>
                Contact Us
              </Text>
              <Stack spacing={2}>
                <Text>Email: info@dayliff.com</Text>
                <Text>Tel: +254 (20) 6968000</Text>
                <Text>Mobile: +254 711 079000</Text>
              </Stack>
            </Box>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
