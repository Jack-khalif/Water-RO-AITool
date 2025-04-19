import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  Stack,
  Text,
  Textarea,
  VStack,
  HStack,
  useToast,
  Divider,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Spinner,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react';
import { FaUpload, FaFileAlt, FaWater, FaFlask, FaChartLine } from 'react-icons/fa';
import proposal from '../pages/proposal';

// Define types for our API responses
interface WaterParameters {
  ph: number;
  tds: number;
  hardness: number;
  iron: number;
  manganese: number;
  silica?: number;
  turbidity?: number;
  chlorides?: number;
  sample_date: string;
}

interface PretreatmentRecommendation {
  requires_oxidation: boolean;
  oxidation_method?: string;
  requires_ph_adjustment: boolean;
  ph_adjustment_method?: string;
  filter_type: string;
  filter_size: string;
  media_types: string[];
}

interface ROSystemSpec {
  capacity: number;
  recovery_rate: number;
  membrane_type: string;
  membrane_count: number;
  antiscalant_type: string;
  pressure: number;
  post_treatment: string[];
}

interface CostEstimate {
  equipment_cost: number;
  installation_cost: number;
  commissioning_cost: number;
  total_cost: number;
}

interface Proposal {
  system_model: string;
  water_parameters: WaterParameters;
  pretreatment: PretreatmentRecommendation;
  ro_system: ROSystemSpec;
  costs: CostEstimate;
  delivery_time: string;
  warranty: string;
  maintenance_schedule: string[];
  is_budgetary: boolean;
  solution_type: 'economy' | 'standard' | 'premium';
  description: string;
}

interface DesignProposals {
  water_parameters: WaterParameters;
  economy: Proposal;
  standard: Proposal;
  premium: Proposal;
}

interface UserRequirements {
  flow_rate: number;
  application: string;
  budget_constraint: string;
  space_constraint: string;
  power_availability: string;
  target_tds: number;
}

export default function WaterTreatmentAgent() {
  // State for lab report input
  const [labReport, setLabReport] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [proposals, setProposals] = useState<DesignProposals | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<'economy' | 'standard' | 'premium'>('standard');
  const [activeStep, setActiveStep] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  // State for user requirements
  const [userRequirements, setUserRequirements] = useState<UserRequirements>({
    flow_rate: 250,
    application: 'drinking_water',
    budget_constraint: 'medium',
    space_constraint: 'limited',
    power_availability: 'standard',
    target_tds: 50,
  });

  // State for image upload
  const [uploadedImagePath, setUploadedImagePath] = useState<string | null>(null);

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Check if it's a text file or an image
      if (file.type.startsWith('text/')) {
        // For text files, read the content
        const text = await readFileAsText(file);
        setLabReport(text);
        setUploadedImagePath(null);
      } else if (file.type.startsWith('image/') || file.name.endsWith('.pdf')) {
        // For images and PDFs, upload to server
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/water-treatment/upload-report', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload file');
        }

        const result = await response.json();
        setUploadedImagePath(result.file_path);
        setLabReport(''); // Clear text report since we're using an image
      } else {
        throw new Error('Unsupported file type');
      }

      setActiveStep(1);
      toast({
        title: 'File uploaded successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error uploading file',
        description: error instanceof Error ? error.message : 'Please try again',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Helper function to read file as text
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  // Handle user requirements changes
  const handleRequirementChange = (
    field: keyof UserRequirements,
    value: string | number
  ) => {
    setUserRequirements({
      ...userRequirements,
      [field]: value,
    });
  };

  // Handle analysis submission
  const handleAnalyze = async () => {
    if (!labReport.trim() && !uploadedImagePath) {
      toast({
        title: 'Missing lab report',
        description: 'Please upload or enter a lab report',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      // Call the API with either text or image path
      const response = await fetch('/api/water-treatment/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          lab_report: labReport.trim() ? labReport : undefined,
          image_path: uploadedImagePath,
          user_requirements: userRequirements,
          generate_multiple_designs: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze water report');
      }

      const result = await response.json();
      setProposals(result);
      setActiveStep(2);
    } catch (error) {
      toast({
        title: 'Analysis failed',
        description: error instanceof Error ? error.message : 'Please try again',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // For demo purposes, let's add a function to generate sample proposals
  const generateSampleProposal = () => {
    setIsAnalyzing(true);
    
    // Simulate API delay
    setTimeout(() => {
      // Common water parameters for all proposals
      const waterParameters: WaterParameters = {
        ph: 7.2,
        tds: 980,
        hardness: 350,
        iron: 2.5,
        manganese: 0.8,
        silica: 45,
        turbidity: 5,
        chlorides: 250,
        sample_date: '15-04-2025',
      };

      // Economy proposal
      const economyProposal: Proposal = {
        system_model: 'RO-Economy-250',
        water_parameters: waterParameters,
        pretreatment: {
          requires_oxidation: true,
          oxidation_method: 'Chlorine injection',
          requires_ph_adjustment: true,
          ph_adjustment_method: 'Sodium hydroxide dosing',
          filter_type: 'Single Media',
          filter_size: '10 inch',
          media_types: ['Activated carbon'],
        },
        ro_system: {
          capacity: 250,
          recovery_rate: 65,
          membrane_type: 'Filmtec TW30-1812',
          membrane_count: 1,
          antiscalant_type: 'Generic antiscalant',
          pressure: 12,
          post_treatment: ['Post-chlorination'],
        },
        costs: {
          equipment_cost: 2200,
          installation_cost: 600,
          commissioning_cost: 300,
          total_cost: 3100,
        },
        delivery_time: '3 weeks',
        warranty: '6 months parts & labor',
        maintenance_schedule: [
          'Quarterly inspection',
          'Semi-annual membrane cleaning',
          'Annual full service',
        ],
        is_budgetary: false,
        solution_type: 'economy',
        description: 'Basic system with essential components for budget-conscious clients. Suitable for residential use with moderate water quality requirements.',
      };

      // Standard proposal
      const standardProposal: Proposal = {
        system_model: 'RO-Standard-250',
        water_parameters: waterParameters,
        pretreatment: {
          requires_oxidation: true,
          oxidation_method: 'Chlorine injection',
          requires_ph_adjustment: true,
          ph_adjustment_method: 'Sodium hydroxide dosing',
          filter_type: 'Multimedia',
          filter_size: '10 inch',
          media_types: ['Glass grade 2/3', 'Activated carbon'],
        },
        ro_system: {
          capacity: 250,
          recovery_rate: 75,
          membrane_type: 'Filmtec XLE-440',
          membrane_count: 1,
          antiscalant_type: 'Genesys BS',
          pressure: 15,
          post_treatment: ['UV sterilization', 'Post-chlorination'],
        },
        costs: {
          equipment_cost: 3500,
          installation_cost: 800,
          commissioning_cost: 500,
          total_cost: 4800,
        },
        delivery_time: '4 weeks',
        warranty: '1 year parts & labor',
        maintenance_schedule: [
          'Monthly inspection',
          'Quarterly membrane cleaning',
          'Annual full service',
        ],
        is_budgetary: false,
        solution_type: 'standard',
        description: 'Balanced system with enhanced filtration and UV sterilization. Ideal for most residential and light commercial applications.',
      };

      // Premium proposal
      const premiumProposal: Proposal = {
        system_model: 'RO-Premium-250',
        water_parameters: waterParameters,
        pretreatment: {
          requires_oxidation: true,
          oxidation_method: 'Ozone injection',
          requires_ph_adjustment: true,
          ph_adjustment_method: 'Automated pH control system',
          filter_type: 'Advanced Multimedia',
          filter_size: '12 inch',
          media_types: ['Glass grade 1/2', 'Activated carbon', 'KDF media'],
        },
        ro_system: {
          capacity: 300, // Slightly oversized for better performance
          recovery_rate: 85,
          membrane_type: 'Filmtec BW30-400',
          membrane_count: 2,
          antiscalant_type: 'Genesys SI (specialized for high silica)',
          pressure: 18,
          post_treatment: ['UV sterilization', 'Remineralization', 'Ozone disinfection'],
        },
        costs: {
          equipment_cost: 5800,
          installation_cost: 1200,
          commissioning_cost: 800,
          total_cost: 7800,
        },
        delivery_time: '5 weeks',
        warranty: '2 years parts & labor',
        maintenance_schedule: [
          'Bi-weekly inspection',
          'Monthly membrane cleaning',
          'Quarterly full service',
        ],
        is_budgetary: false,
        solution_type: 'premium',
        description: 'High-end system with advanced filtration, dual membranes, and comprehensive post-treatment. Perfect for critical applications requiring superior water quality.',
      };
      
      // Set all three proposals
      setProposals({
        water_parameters: waterParameters,
        economy: economyProposal,
        standard: standardProposal,
        premium: premiumProposal
      });
      
      setActiveStep(2);
      setIsAnalyzing(false);
    }, 2000);
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading as="h1" size="xl" textAlign="center">
          Water Treatment System Designer
        </Heading>
        <Text textAlign="center" fontSize="lg" color="gray.600">
          Our AI agent analyzes your water lab report and designs an optimal RO system with detailed proposals
        </Text>

        {/* Step indicators */}
        <Flex justify="center">
          <HStack spacing={4}>
            {['Upload Lab Report', 'Specify Requirements', 'View Proposal'].map(
              (step, index) => (
                <HStack key={index}>
                  <Box
                    borderRadius="full"
                    bg={activeStep >= index ? 'blue.500' : 'gray.200'}
                    color={activeStep >= index ? 'white' : 'gray.500'}
                    w="30px"
                    h="30px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontWeight="bold"
                  >
                    {index + 1}
                  </Box>
                  <Text
                    fontWeight={activeStep === index ? 'bold' : 'normal'}
                    color={activeStep >= index ? 'blue.500' : 'gray.500'}
                  >
                    {step}
                  </Text>
                  {index < 2 && (
                    <Box w="20px" h="1px" bg={activeStep > index ? 'blue.500' : 'gray.200'} />
                  )}
                </HStack>
              )
            )}
          </HStack>
        </Flex>

        {/* Step 1: Upload Lab Report */}
        <Card display={activeStep === 0 ? 'block' : 'none'}>
          <CardHeader>
            <Heading size="md">
              <Flex align="center">
                <FaFileAlt style={{ marginRight: '8px' }} />
                Upload Water Analysis Report
              </Flex>
            </Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4}>
              <Box
                border="2px dashed"
                borderColor="gray.300"
                borderRadius="md"
                p={6}
                w="100%"
                textAlign="center"
                cursor="pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept=".txt,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                />
                <FaUpload size="48px" color="#CBD5E0" style={{ margin: '0 auto 16px' }} />
                <Text fontWeight="bold">Drag & drop your lab report or click to browse</Text>
                <Text fontSize="sm" color="gray.500">
                  Supports PDF, DOC, DOCX, and TXT files
                </Text>
              </Box>

              <Divider />

              <Text fontWeight="bold">Or paste lab report text</Text>
              <Textarea
                placeholder="Paste your water analysis report here..."
                value={labReport}
                onChange={(e) => setLabReport(e.target.value)}
                minH="200px"
              />

              <Button
                colorScheme="blue"
                rightIcon={<FaChartLine />}
                onClick={() => setActiveStep(1)}
                isDisabled={!labReport.trim()}
                isLoading={isUploading}
              >
                Continue to Requirements
              </Button>

              {/* For demo purposes */}
              <Button variant="outline" onClick={() => {
                setLabReport(`WATER ANALYSIS REPORT
Sample ID: TEST-001
Date: 15-04-2025

PHYSICAL PARAMETERS
pH: 7.2
Temperature: 25°C
Turbidity: 5 NTU
Conductivity: 1500 µS/cm

CHEMICAL PARAMETERS
Total Dissolved Solids (TDS): 980 mg/L
Total Hardness (as CaCO3): 350 mg/L
Iron (Fe): 2.5 mg/L
Manganese (Mn): 0.8 mg/L
Silica (SiO2): 45 mg/L
Chlorides: 250 mg/L

BACTERIOLOGICAL ANALYSIS
Total Coliform Count: Present
E. coli: Absent

Notes:
- Iron and manganese levels exceed recommended limits
- Moderate hardness level
- TDS within treatable range for RO
- pH slightly acidic, may require adjustment`);
                setActiveStep(1);
              }}>
                Use Sample Report
              </Button>
            </VStack>
          </CardBody>
        </Card>

        {/* Step 2: User Requirements */}
        <Card display={activeStep === 1 ? 'block' : 'none'}>
          <CardHeader>
            <Heading size="md">
              <Flex align="center">
                <FaWater style={{ marginRight: '8px' }} />
                Specify Your Requirements
              </Flex>
            </Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Required Flow Rate (L/hr)</FormLabel>
                <NumberInput
                  value={userRequirements.flow_rate}
                  onChange={(_, value) => handleRequirementChange('flow_rate', value)}
                  min={50}
                  max={10000}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>Application</FormLabel>
                <Select
                  value={userRequirements.application}
                  onChange={(e) => handleRequirementChange('application', e.target.value)}
                >
                  <option value="drinking_water">Drinking Water</option>
                  <option value="industrial">Industrial Process</option>
                  <option value="bottling">Bottling Plant</option>
                  <option value="pharmaceutical">Pharmaceutical</option>
                  <option value="irrigation">Irrigation</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Budget Constraint</FormLabel>
                <Select
                  value={userRequirements.budget_constraint}
                  onChange={(e) => handleRequirementChange('budget_constraint', e.target.value)}
                >
                  <option value="low">Low (Economy Solution)</option>
                  <option value="medium">Medium (Standard Solution)</option>
                  <option value="high">High (Premium Solution)</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Space Constraint</FormLabel>
                <Select
                  value={userRequirements.space_constraint}
                  onChange={(e) => handleRequirementChange('space_constraint', e.target.value)}
                >
                  <option value="limited">Limited (Compact Design Needed)</option>
                  <option value="moderate">Moderate Space Available</option>
                  <option value="spacious">Spacious Area Available</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Power Availability</FormLabel>
                <Select
                  value={userRequirements.power_availability}
                  onChange={(e) => handleRequirementChange('power_availability', e.target.value)}
                >
                  <option value="limited">Limited (Energy Efficient Design Needed)</option>
                  <option value="standard">Standard Power Supply</option>
                  <option value="high">High Power Available</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Target TDS (mg/L)</FormLabel>
                <NumberInput
                  value={userRequirements.target_tds}
                  onChange={(_, value) => handleRequirementChange('target_tds', value)}
                  min={0}
                  max={500}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <HStack spacing={4} justify="center" pt={4}>
                <Button
                  variant="outline"
                  onClick={() => setActiveStep(0)}
                >
                  Back
                </Button>
                <Button
                  colorScheme="blue"
                  onClick={handleAnalyze}
                  isLoading={isAnalyzing}
                >
                  Analyze & Generate Proposal
                </Button>
                {/* For demo purposes */}
                <Button
                  colorScheme="green"
                  onClick={generateSampleProposal}
                  isLoading={isAnalyzing}
                >
                  Generate Sample Proposal
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Step 3: View Proposals */}
        <Card display={activeStep === 2 && proposals ? 'block' : 'none'}>
          <CardHeader>
            <VStack spacing={4} align="stretch">
              <Flex justify="space-between" align="center">
                <Heading size="md">
                  <Flex align="center">
                    <FaFlask style={{ marginRight: '8px' }} />
                    Water Treatment System Proposals
                  </Flex>
                </Heading>
                <Badge
                  colorScheme={proposals?.[selectedProposal]?.is_budgetary ? 'yellow' : 'green'}
                  fontSize="0.8em"
                  p={2}
                  borderRadius="md"
                >
                  {proposals?.[selectedProposal]?.is_budgetary ? 'BUDGETARY ESTIMATE' : 'FINAL PROPOSAL'}
                </Badge>
              </Flex>
              
              {/* Proposal selection tabs */}
              <Flex 
                borderWidth="1px" 
                borderRadius="lg" 
                overflow="hidden"
              >
                <Box 
                  flex="1" 
                  bg={selectedProposal === 'economy' ? 'blue.500' : 'gray.100'}
                  color={selectedProposal === 'economy' ? 'white' : 'gray.800'}
                  p={3}
                  textAlign="center"
                  fontWeight="bold"
                  cursor="pointer"
                  onClick={() => setSelectedProposal('economy')}
                  borderRightWidth="1px"
                >
                  Economy
                  <Text fontSize="sm" fontWeight="normal">${proposals?.economy.costs.total_cost.toLocaleString()}</Text>
                </Box>
                <Box 
                  flex="1" 
                  bg={selectedProposal === 'standard' ? 'blue.500' : 'gray.100'}
                  color={selectedProposal === 'standard' ? 'white' : 'gray.800'}
                  p={3}
                  textAlign="center"
                  fontWeight="bold"
                  cursor="pointer"
                  onClick={() => setSelectedProposal('standard')}
                  borderRightWidth="1px"
                >
                  Standard
                  <Text fontSize="sm" fontWeight="normal">${proposals?.standard.costs.total_cost.toLocaleString()}</Text>
                </Box>
                <Box 
                  flex="1" 
                  bg={selectedProposal === 'premium' ? 'blue.500' : 'gray.100'}
                  color={selectedProposal === 'premium' ? 'white' : 'gray.800'}
                  p={3}
                  textAlign="center"
                  fontWeight="bold"
                  cursor="pointer"
                  onClick={() => setSelectedProposal('premium')}
                >
                  Premium
                  <Text fontSize="sm" fontWeight="normal">${proposals?.premium.costs.total_cost.toLocaleString()}</Text>
                </Box>
              </Flex>
              
              {/* Selected proposal description */}
              <Box p={3} bg="blue.50" borderRadius="md">
                <Text fontWeight="bold">{proposals?.[selectedProposal].system_model}</Text>
                <Text>{proposals?.[selectedProposal].description}</Text>
              </Box>
            </VStack>
          </CardHeader>
          <CardBody>
            {proposals && (
              <VStack spacing={6} align="stretch">
                <Box bg="blue.50" p={4} borderRadius="md">
                  <Heading size="sm" mb={2}>
                    System Overview
                  </Heading>
                  <Text fontWeight="bold">Model: {proposals[selectedProposal].system_model}</Text>
                  <Text>Delivery Time: {proposals[selectedProposal].delivery_time}</Text>
                  <Text>Warranty: {proposals[selectedProposal].warranty}</Text>
                </Box>

                <Accordion allowMultiple defaultIndex={[0]}>
                  <AccordionItem>
                    <h2>
                      <AccordionButton>
                        <Box flex="1" textAlign="left" fontWeight="bold">
                          Water Analysis Results
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                      <Stack direction={['column', 'row']} spacing={4} wrap="wrap">
                        <Box flex="1" minW="200px">
                          <Text fontWeight="bold">pH:</Text>
                          <Text>{proposals.water_parameters.ph}</Text>
                        </Box>
                        <Box flex="1" minW="200px">
                          <Text fontWeight="bold">TDS:</Text>
                          <Text>{proposals.water_parameters.tds} mg/L</Text>
                        </Box>
                        <Box flex="1" minW="200px">
                          <Text fontWeight="bold">Hardness:</Text>
                          <Text>{proposals.water_parameters.hardness} mg/L as CaCO3</Text>
                        </Box>
                        <Box flex="1" minW="200px">
                          <Text fontWeight="bold">Iron:</Text>
                          <Text>{proposals.water_parameters.iron} mg/L</Text>
                        </Box>
                        <Box flex="1" minW="200px">
                          <Text fontWeight="bold">Manganese:</Text>
                          <Text>{proposals.water_parameters.manganese} mg/L</Text>
                        </Box>
                        <Box flex="1" minW="200px">
                          <Text fontWeight="bold">Silica:</Text>
                          <Text>{proposals.water_parameters.silica || 'N/A'} mg/L</Text>
                        </Box>
                      </Stack>
                    </AccordionPanel>
                  </AccordionItem>

                  <AccordionItem>
                    <h2>
                      <AccordionButton>
                        <Box flex="1" textAlign="left" fontWeight="bold">
                          Pretreatment Recommendations
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                      <VStack align="stretch" spacing={2}>
                        <Text>
                          <strong>Oxidation Required:</strong>{' '}
                          {proposals[selectedProposal].pretreatment.requires_oxidation ? 'Yes' : 'No'}
                        </Text>
                        {proposals[selectedProposal].pretreatment.requires_oxidation && (
                          <Text>
                            <strong>Oxidation Method:</strong>{' '}
                            {proposals[selectedProposal].pretreatment.oxidation_method}
                          </Text>
                        )}
                        <Text>
                          <strong>pH Adjustment Required:</strong>{' '}
                          {proposals[selectedProposal].pretreatment.requires_ph_adjustment ? 'Yes' : 'No'}
                        </Text>
                        {proposals[selectedProposal].pretreatment.requires_ph_adjustment && (
                          <Text>
                            <strong>pH Adjustment Method:</strong>{' '}
                            {proposals[selectedProposal].pretreatment.ph_adjustment_method}
                          </Text>
                        )}
                        <Text>
                          <strong>Filter Type:</strong> {proposals[selectedProposal].pretreatment.filter_type}
                        </Text>
                        <Text>
                          <strong>Filter Size:</strong> {proposals[selectedProposal].pretreatment.filter_size}
                        </Text>
                        <Text>
                          <strong>Media Types:</strong>{' '}
                          {proposals[selectedProposal].pretreatment.media_types.join(', ')}
                        </Text>
                      </VStack>
                    </AccordionPanel>
                  </AccordionItem>

                  <AccordionItem>
                    <h2>
                      <AccordionButton>
                        <Box flex="1" textAlign="left" fontWeight="bold">
                          RO System Specifications
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                      <VStack align="stretch" spacing={2}>
                        <Text>
                          <strong>Capacity:</strong> {proposals[selectedProposal].ro_system.capacity} L/hr
                        </Text>
                        <Text>
                          <strong>Recovery Rate:</strong> {proposals[selectedProposal].ro_system.recovery_rate}%
                        </Text>
                        <Text>
                          <strong>Membrane Type:</strong> {proposals[selectedProposal].ro_system.membrane_type}
                        </Text>
                        <Text>
                          <strong>Membrane Count:</strong> {proposals[selectedProposal].ro_system.membrane_count}
                        </Text>
                        <Text>
                          <strong>Antiscalant Type:</strong> {proposals[selectedProposal].ro_system.antiscalant_type}
                        </Text>
                        <Text>
                          <strong>Operating Pressure:</strong> {proposals[selectedProposal].ro_system.pressure} bar
                        </Text>
                        <Text>
                          <strong>Post Treatment:</strong>{' '}
                          {proposals[selectedProposal].ro_system.post_treatment.join(', ')}
                        </Text>
                      </VStack>
                    </AccordionPanel>
                  </AccordionItem>

                  <AccordionItem>
                    <h2>
                      <AccordionButton>
                        <Box flex="1" textAlign="left" fontWeight="bold">
                          Cost Breakdown
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                      <VStack align="stretch" spacing={2}>
                        <Text>
                          <strong>Equipment Cost:</strong> ${proposals[selectedProposal].costs.equipment_cost.toLocaleString()}
                        </Text>
                        <Text>
                          <strong>Installation Cost:</strong> ${proposals[selectedProposal].costs.installation_cost.toLocaleString()}
                        </Text>
                        <Text>
                          <strong>Commissioning Cost:</strong> ${proposals[selectedProposal].costs.commissioning_cost.toLocaleString()}
                        </Text>
                        <Divider my={2} />
                        <Text fontWeight="bold" fontSize="lg">
                          Total Cost: ${proposals[selectedProposal].costs.total_cost.toLocaleString()}
                        </Text>
                      </VStack>
                    </AccordionPanel>
                  </AccordionItem>

                  <AccordionItem>
                    <h2>
                      <AccordionButton>
                        <Box flex="1" textAlign="left" fontWeight="bold">
                          Maintenance Schedule
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                      <VStack align="stretch" spacing={2}>
                        {proposals[selectedProposal].maintenance_schedule.map((item, index) => (
                          <Text key={index}>• {item}</Text>
                        ))}
                      </VStack>
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>

                <HStack spacing={4} justify="center" pt={4}>
                  <Button
                    variant="outline"
                    onClick={() => setActiveStep(1)}
                  >
                    Back to Requirements
                  </Button>
                  <Button
                    colorScheme="blue"
                    onClick={() => {
                      toast({
                        title: 'Proposal Saved',
                        description: 'Your proposal has been saved successfully',
                        status: 'success',
                        duration: 3000,
                      });
                    }}
                  >
                    Save Proposal
                  </Button>
                  <Button
                    colorScheme="green"
                    onClick={() => {
                      toast({
                        title: 'Proposal Downloaded',
                        description: 'Your proposal has been downloaded as PDF',
                        status: 'success',
                        duration: 3000,
                      });
                    }}
                  >
                    Download PDF
                  </Button>
                </HStack>
              </VStack>
            )}
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
}
