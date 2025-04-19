import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Button,
  Text,
  useToast,
  Box,
} from '@chakra-ui/react';
import { useState } from 'react';

interface QuestionnaireProps {
  onSubmit: (data: any) => void;
  type: 'design' | 'analysis' | 'proposal';
}

export default function RequirementsQuestionnaire({ onSubmit, type }: QuestionnaireProps) {
  const [formData, setFormData] = useState({
    useCase: '',
    industry: '',
    location: '',
    dailyDemand: 0,
    operatingHours: 0,
    waterSource: '',
    specificRequirements: '',
    budget: '',
    timeline: '',
  });

  const toast = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.useCase || !formData.location || !formData.dailyDemand) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        status: 'error',
        duration: 3000,
      });
      return;
    }
    onSubmit(formData);
  };

  return (
    <Box as="form" onSubmit={handleSubmit}>
      <VStack spacing={6} align="stretch">
        <Text fontSize="lg" fontWeight="bold">
          Help us understand your requirements better
        </Text>

        <FormControl isRequired>
          <FormLabel>Primary Use Case</FormLabel>
          <Select
            value={formData.useCase}
            onChange={(e) => setFormData({ ...formData, useCase: e.target.value })}
          >
            <option value="">Select Use Case</option>
            <option value="Industrial">Industrial Process</option>
            <option value="Commercial">Commercial</option>
            <option value="Residential">Residential</option>
            <option value="Agricultural">Agricultural</option>
          </Select>
        </FormControl>

        {formData.useCase === 'Industrial' && (
          <FormControl isRequired>
            <FormLabel>Industry Type</FormLabel>
            <Select
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            >
              <option value="">Select Industry</option>
              <option value="Food">Food & Beverage</option>
              <option value="Pharmaceutical">Pharmaceutical</option>
              <option value="Power">Power Generation</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Chemical">Chemical</option>
              <option value="Other">Other</option>
            </Select>
          </FormControl>
        )}

        <FormControl isRequired>
          <FormLabel>Location</FormLabel>
          <Select
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          >
            <option value="">Select Location Type</option>
            <option value="Coastal">Coastal Region</option>
            <option value="Urban">Urban Area</option>
            <option value="Rural">Rural Area</option>
            <option value="Industrial">Industrial Zone</option>
          </Select>
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Daily Water Demand (m³/day)</FormLabel>
          <NumberInput
            value={formData.dailyDemand}
            onChange={(_, value) => setFormData({ ...formData, dailyDemand: value })}
            min={0}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormControl>

        <FormControl>
          <FormLabel>Operating Hours per Day</FormLabel>
          <NumberInput
            value={formData.operatingHours}
            onChange={(_, value) => setFormData({ ...formData, operatingHours: value })}
            min={0}
            max={24}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormControl>

        <FormControl>
          <FormLabel>Water Source</FormLabel>
          <Select
            value={formData.waterSource}
            onChange={(e) => setFormData({ ...formData, waterSource: e.target.value })}
          >
            <option value="">Select Water Source</option>
            <option value="Municipal">Municipal Supply</option>
            <option value="Borehole">Borehole/Well</option>
            <option value="Surface">Surface Water (River/Lake)</option>
            <option value="Brackish">Brackish Water</option>
            <option value="Seawater">Seawater</option>
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel>Specific Requirements or Concerns</FormLabel>
          <Input
            value={formData.specificRequirements}
            onChange={(e) => setFormData({ ...formData, specificRequirements: e.target.value })}
            placeholder="e.g., Space constraints, noise limitations, etc."
          />
        </FormControl>

        {type === 'proposal' && (
          <>
            <FormControl>
              <FormLabel>Budget Range (KES)</FormLabel>
              <Select
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              >
                <option value="">Select Budget Range</option>
                <option value="0-500k">0 - 500,000</option>
                <option value="500k-1m">500,000 - 1,000,000</option>
                <option value="1m-5m">1,000,000 - 5,000,000</option>
                <option value="5m+">Above 5,000,000</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Implementation Timeline</FormLabel>
              <Select
                value={formData.timeline}
                onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
              >
                <option value="">Select Timeline</option>
                <option value="urgent">Urgent (Within 1 month)</option>
                <option value="normal">Normal (1-3 months)</option>
                <option value="planned">Planned (3+ months)</option>
              </Select>
            </FormControl>
          </>
        )}

        <Button type="submit" colorScheme="blue" size="lg">
          Submit Requirements
        </Button>
      </VStack>
    </Box>
  );
}
