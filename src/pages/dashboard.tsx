import { Box, Container, Heading, SimpleGrid, VStack, Icon, Text, Button } from '@chakra-ui/react';
import { FaWater, FaFlask, FaFileAlt, FaUpload } from 'react-icons/fa';
import Layout from '../components/Layout';
import { useRouter } from 'next/router';

interface FeatureProps {
  title: string;
  text: string;
  icon: any;
  onClick: () => void;
}

const Feature = ({ title, text, icon, onClick }: FeatureProps) => {
  return (
    <VStack
      bg="white"
      p={8}
      borderRadius="lg"
      boxShadow="md"
      spacing={4}
      align="flex-start"
      cursor="pointer"
      onClick={onClick}
      transition="all 0.2s"
      _hover={{ transform: 'translateY(-4px)', boxShadow: 'lg' }}
    >
      <Icon as={icon} w={8} h={8} color="blue.500" />
      <Heading size="md">{title}</Heading>
      <Text color="gray.600">{text}</Text>
      <Button size="sm" colorScheme="blue" rightIcon={<Icon as={FaUpload} />}>
        Get Started
      </Button>
    </VStack>
  );
};

export default function Dashboard() {
  const router = useRouter();

  return (
    <Layout>
      <Box py={20}>
        <Container maxW="container.xl">
          <VStack spacing={12}>
            <Heading textAlign="center" size="2xl" mb={8}>
              Welcome to HydroFlow
            </Heading>
            <Text fontSize="xl" textAlign="center" maxW="2xl" mb={12}>
              Select a feature to get started with your water treatment analysis and proposal generation.
            </Text>
            <SimpleGrid columns={1} spacing={10} width="100%">
              <Feature
                icon={FaWater}
                title="Lab Report Analysis"
                text="Upload and analyze water quality parameters from your lab reports automatically."
                onClick={() => router.push('/upload')}
              />
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>
    </Layout>
  );
}
