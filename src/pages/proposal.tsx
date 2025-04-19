import {
  Box,
  Container,
  Heading,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Button,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Text,
} from '@chakra-ui/react';
import { useState } from 'react';
import { ProposalProvider, useProposal } from '../context/ProposalContext';

function ClientInfoForm({ onNext }) {
  const { form, setForm } = useProposal();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={4} align="stretch">
        <FormControl isRequired>
          <FormLabel>Client Type</FormLabel>
          <Select
            name="clientType"
            value={form.clientType}
            onChange={handleChange}
            placeholder="Select client type"
          >
            <option value="domestic">Domestic</option>
            <option value="commercial">Commercial</option>
            <option value="industrial">Industrial</option>
          </Select>
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Application</FormLabel>
          <Select
            name="application"
            value={form.application}
            onChange={handleChange}
            placeholder="Select application"
          >
            <option value="drinking">Drinking</option>
            <option value="bottling">Bottling</option>
            <option value="process">Process Water</option>
          </Select>
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Desired Output (L/hr)</FormLabel>
          <Input
            name="desiredOutput"
            type="number"
            value={form.desiredOutput}
            onChange={handleChange}
            placeholder="e.g. 250"
          />
        </FormControl>

        <FormControl>
          <FormLabel>Water Source</FormLabel>
          <Select
            name="waterSource"
            value={form.waterSource}
            onChange={handleChange}
            placeholder="Select source"
          >
            <option value="borehole">Borehole</option>
            <option value="river">River</option>
            <option value="municipal">Municipal</option>
            <option value="other">Other</option>
          </Select>
        </FormControl>

        <Button colorScheme="blue" type="submit">
          Next
        </Button>
      </VStack>
    </form>
  );
}

function DataPreview() {
  const { form } = useProposal();
  return (
    <Box mt={6} p={4} bg="gray.50" borderRadius="md">
      <Text fontWeight="bold" mb={2}>
        Current Form Data:
      </Text>
      <pre>{JSON.stringify(form, null, 2)}</pre>
    </Box>
  );
}

function ProposalFormTabs() {
  const [tabIndex, setTabIndex] = useState(0);

  const handleNext = () => {
    setTabIndex((prev) => prev + 1);
  };

  return (
    <Tabs index={tabIndex} onChange={setTabIndex} variant="enclosed">
      <TabList>
        <Tab>Client Info</Tab>
        <Tab>Water Analysis</Tab>
        <Tab>System Design</Tab>
        <Tab>Pricing</Tab>
      </TabList>

      <TabPanels>
        <TabPanel>
          <ClientInfoForm onNext={handleNext} />
          <DataPreview />
        </TabPanel>

        <TabPanel>
          <Text>Water Analysis content coming soon...</Text>
          <DataPreview />
        </TabPanel>

        <TabPanel>
          <Text>System Design content coming soon...</Text>
          <DataPreview />
        </TabPanel>

        <TabPanel>
          <Text>Pricing content coming soon...</Text>
          <DataPreview />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}

export default function Proposal() {
  return (
    <ProposalProvider>
      <Container maxW="container.md" py={10}>
        <Heading mb={6}>Proposal Generator</Heading>
        <ProposalFormTabs />
      </Container>
    </ProposalProvider>
  );
}
