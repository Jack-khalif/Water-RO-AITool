import { Box, Container, Heading, SimpleGrid, VStack, Icon, Text, Button, Image, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { FaWater, FaFlask, FaFileAlt, FaUser, FaUserPlus } from 'react-icons/fa';
import Layout from '../components/Layout';
import EmailOTP from '../components/EmailOTP';
import LoginForm from '../components/LoginForm';
import SignupForm from '../components/SignupForm';
import { verifyDevice } from '../utils/userDb';

interface FeatureProps {
  title: string;
  text: string;
  icon: any;
}

const Feature = ({ title, text, icon }: FeatureProps) => {
  return (
    <VStack
      bg="white"
      p={8}
      borderRadius="lg"
      boxShadow="md"
      spacing={4}
      align="flex-start"
    >
      <Icon as={icon} w={8} h={8} color="blue.500" />
      <Heading size="md">{title}</Heading>
      <Text color="gray.600">{text}</Text>
    </VStack>
  );
};

export default function Home() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [email, setEmail] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check for remembered device
    const deviceId = localStorage.getItem('deviceId');
    const userEmail = localStorage.getItem('userEmail');
    
    if (deviceId && userEmail && verifyDevice(userEmail, deviceId)) {
      router.push('/dashboard');
    }
  }, []);

  const handleAuthSuccess = (userEmail: string) => {
    setEmail(userEmail);
    setShowOTP(true);
    setShowLoginModal(false);
    setShowSignupModal(false);
  };

  const handleLogin = () => setShowLoginModal(true);
  const handleSignup = () => setShowSignupModal(true);

  return (
    <Layout>
      {/* Hero Section */}
      <Box position="relative" minHeight="calc(100vh - 80px)">
        {/* Background Image */}
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          opacity={0.05}
          zIndex={1}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Box width="60%" height="60%">
            <Image
              src="/images/ds-logo-large.png"
              alt="Davis and Shirtliff"
              width="100%"
              height="100%"
              style={{ objectFit: 'contain' }}
            />
          </Box>
        </Box>

        {/* Content */}
        <Box
          bgGradient="linear(to-r, blue.400, blue.600)"
          color="white"
          minHeight="calc(100vh - 80px)"
          position="relative"
          zIndex={2}
          py={20}
        >
          <Container maxW="container.xl" height="100%" display="flex" alignItems="center">
            <SimpleGrid
              columns={{ base: 1, md: 2 }}
              spacing={10}
              alignItems="center"
              width="100%"
            >
              <VStack align="center" spacing={8}>
                <Image
                  src="/images/ds-logo.png"
                  alt="Davis and Shirtliff"
                  width={200}
                  height={80}
                  style={{ objectFit: 'contain' }}
                />
                <VStack spacing={4} align="center">
                  <Heading as="h1" size="2xl" textAlign="center">
                    Welcome to HydroFlow
                  </Heading>
                  <Text fontSize="xl" textAlign="center" maxW="md">
                    AI-Powered Water Treatment Solutions
                  </Text>
                  <Box
                    bg="white"
                    p={8}
                    borderRadius="xl"
                    boxShadow="xl"
                    width="100%"
                    maxW="md"
                  >
                    <VStack spacing={6}>
  <Button
    size="lg"
    colorScheme="blue"
    width="100%"
    height="60px"
    onClick={() => router.push('/dashboard')}
    leftIcon={<Icon as={FaUser} boxSize={5} />}
  >
    Go to Dashboard
  </Button>
</VStack>
                  </Box>
                </VStack>
              </VStack>
              <VStack align="center" spacing={8} display={{ base: 'none', md: 'flex' }}>
                <Image
                  src="/images/ro-system.png"
                  alt="Water Treatment System"
                  width={600}
                  height={400}
                  style={{ objectFit: 'cover' }}
                  fallbackSrc="https://via.placeholder.com/600x400?text=RO+System"
                />
                <Text fontSize="lg" color="white" textAlign="center" maxW="md">
                  Automate your water treatment analysis and proposal generation with our advanced AI system.
                </Text>
              </VStack>
            </SimpleGrid>
          </Container>
        </Box>
      </Box>



      {/* Login Modal */}
      <Modal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Login to HydroFlow</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <LoginForm onSuccess={handleAuthSuccess} onClose={() => setShowLoginModal(false)} />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Signup Modal */}
      <Modal isOpen={showSignupModal} onClose={() => setShowSignupModal(false)} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create HydroFlow Account</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <SignupForm onSuccess={handleAuthSuccess} onClose={() => setShowSignupModal(false)} />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Email OTP Verification */}
      <EmailOTP
        isOpen={showOTP}
        onClose={() => setShowOTP(false)}
        email={email}
        onVerify={() => router.push('/dashboard')}
      />
    </Layout>
  );
}
