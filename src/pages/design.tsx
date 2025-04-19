import { Container, Heading, VStack, FormControl, FormLabel, Input, Select, Button, Box, Text } from '@chakra-ui/react';
import { useState } from 'react';
import Layout from '../components/Layout';

export default function Design() {
  const [form, setForm] = useState({
    flowRate: '',
    usageType: '',
    membraneType: '',
    silicaLevel: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <Layout>
      <Container maxW="container.sm" py={10}>
        <Heading mb={6}>RO System Design</Heading>
        <form onSubmit={handleSubmit}>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>Feed Flow Rate (L/hr)</FormLabel>
              <Input name="flowRate" type="number" value={form.flowRate} onChange={handleChange} placeholder="e.g. 500" />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Usage Type</FormLabel>
              <Select name="usageType" value={form.usageType} onChange={handleChange} placeholder="Select usage type">
                <option value="domestic">Domestic</option>
                <option value="bottling">Bottling</option>
                <option value="industrial">Industrial</option>
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>Membrane Type</FormLabel>
              <Select name="membraneType" value={form.membraneType} onChange={handleChange} placeholder="Select membrane type">
                <option value="BW30-400">BW30-400</option>
                <option value="XLE-4040">XLE-4040</option>
                <option value="Other">Other</option>
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>Silica Level (mg/L)</FormLabel>
              <Input name="silicaLevel" type="number" value={form.silicaLevel} onChange={handleChange} placeholder="e.g. 20" />
            </FormControl>
            <Button colorScheme="blue" type="submit">Submit</Button>
          </VStack>
        </form>
        {submitted && (
          <Box mt={8} p={4} bg="gray.50" borderRadius="md">
            <Text fontWeight="bold">Saved Data:</Text>
            <pre>{JSON.stringify(form, null, 2)}</pre>
          </Box>
        )}
      </Container>
    </Layout>
  );
}
