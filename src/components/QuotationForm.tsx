import { useState } from 'react';
import { Button, FormControl, FormLabel, Input, Select, Stack, Textarea } from '@chakra-ui/react';

type WaterAnalysis = {
  tds: number;
  ph: number;
  hardness: number;
  alkalinity: number;
  flowRate?: number;
};

type SystemRequirements = {
  capacity: number;
  pressure: number;
  recoveryRate: number;
};

type ClientInfo = {
  name: string;
  location: string;
  industry: string;
  contact: string;
};

export default function QuotationForm() {
  const [waterAnalysis, setWaterAnalysis] = useState<WaterAnalysis>({
    tds: 0,
    ph: 7,
    hardness: 0,
    alkalinity: 0,
  });
  
  const [systemRequirements, setSystemRequirements] = useState<SystemRequirements>({
    capacity: 1000,
    pressure: 10,
    recoveryRate: 75,
  });
  
  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    name: '',
    location: '',
    industry: 'General',
    contact: '',
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [quotation, setQuotation] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/generate-quotation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          waterAnalysis,
          systemRequirements,
          clientInfo,
        }),
      });
      
      const data = await response.json();
      setQuotation(data);
    } catch (error) {
      console.error('Error generating quotation:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="quotation-form">
      <form onSubmit={handleSubmit}>
        <Stack spacing={4}>
          <FormControl>
            <FormLabel>Client Name</FormLabel>
            <Input 
              value={clientInfo.name}
              onChange={(e) => setClientInfo({...clientInfo, name: e.target.value})}
              required
            />
          </FormControl>
          
          <FormControl>
            <FormLabel>Location</FormLabel>
            <Input 
              value={clientInfo.location}
              onChange={(e) => setClientInfo({...clientInfo, location: e.target.value})}
              required
            />
          </FormControl>
          
          <FormControl>
            <FormLabel>Industry</FormLabel>
            <Select 
              value={clientInfo.industry}
              onChange={(e) => setClientInfo({...clientInfo, industry: e.target.value})}
            >
              <option value="General">General</option>
              <option value="Food & Beverage">Food & Beverage</option>
              <option value="Pharmaceutical">Pharmaceutical</option>
              <option value="Industrial">Industrial</option>
              <option value="Hospitality">Hospitality</option>
            </Select>
          </FormControl>
          
          <FormControl>
            <FormLabel>Contact Email</FormLabel>
            <Input 
              type="email"
              value={clientInfo.contact}
              onChange={(e) => setClientInfo({...clientInfo, contact: e.target.value})}
              required
            />
          </FormControl>
          
          <FormControl>
            <FormLabel>Water Analysis - TDS (mg/L)</FormLabel>
            <Input 
              type="number"
              value={waterAnalysis.tds}
              onChange={(e) => setWaterAnalysis({...waterAnalysis, tds: Number(e.target.value)})}
              required
            />
          </FormControl>
          
          <FormControl>
            <FormLabel>Water Analysis - pH</FormLabel>
            <Input 
              type="number"
              min="0"
              max="14"
              step="0.1"
              value={waterAnalysis.ph}
              onChange={(e) => setWaterAnalysis({...waterAnalysis, ph: Number(e.target.value)})}
              required
            />
          </FormControl>
          
          <FormControl>
            <FormLabel>System Capacity (LPH)</FormLabel>
            <Input 
              type="number"
              value={systemRequirements.capacity}
              onChange={(e) => setSystemRequirements({...systemRequirements, capacity: Number(e.target.value)})}
              required
            />
          </FormControl>
          
          <Button 
            type="submit" 
            colorScheme="blue" 
            isLoading={isGenerating}
            loadingText="Generating Quotation..."
          >
            Generate Quotation
          </Button>
        </Stack>
      </form>
      
      {quotation && (
        <div className="quotation-result">
          <h2>Generated Quotation</h2>
          <pre>{JSON.stringify(quotation, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
