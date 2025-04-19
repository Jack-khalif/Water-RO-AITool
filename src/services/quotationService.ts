import { askEngineerQuestion } from './ragService';

interface QuotationRequest {
  waterAnalysis: {
    tds: number;
    ph: number;
    hardness: number;
    alkalinity: number;
    flowRate?: number;
  };
  systemRequirements: {
    capacity: number;  // in LPH
    pressure: number;  // in bar
    recoveryRate: number;  // in %
  };
  clientInfo: {
    name: string;
    location: string;
    industry: string;
    contact: string;
  };
}

interface QuotationResponse {
  systemDesign: {
    model: string;
    capacity: number;
    pressure: number;
    recoveryRate: number;
    stages: number;
    membranes: string;
    preTreatment: string[];
  };
  priceBreakdown: {
    equipment: number;
    installation: number;
    commissioning: number;
    total: number;
  };
  deliveryTime: number;  // in weeks
  warranty: string;
  maintenanceSchedule: string[];
}

export async function generateQuotation(request: QuotationRequest): Promise<QuotationResponse> {
  try {
    // First get the system design recommendation
    const systemDesignQuery = `Based on water analysis (TDS: ${request.waterAnalysis.tds} mg/L, 
      pH: ${request.waterAnalysis.ph}, Hardness: ${request.waterAnalysis.hardness} mg/L), 
      and system requirements (Capacity: ${request.systemRequirements.capacity} LPH, 
      Pressure: ${request.systemRequirements.pressure} bar), 
      recommend a suitable RO system design.`;

    const designResult = await askEngineerQuestion(systemDesignQuery, {
      useCase: 'Quotation',
      waterParams: request.waterAnalysis
    });

    // Then get the pricing information
    const pricingQuery = `For a ${request.systemRequirements.capacity} LPH RO system with 
      ${request.systemRequirements.pressure} bar pressure, provide a detailed price breakdown 
      including equipment, installation, and commissioning costs.`;

    const pricingResult = await askEngineerQuestion(pricingQuery, {
      useCase: 'Quotation',
      waterParams: request.waterAnalysis
    });

    // Parse the results and format them into our response structure
    return {
      systemDesign: {
        model: extractSystemModel(designResult.answer),
        capacity: request.systemRequirements.capacity,
        pressure: request.systemRequirements.pressure,
        recoveryRate: extractRecoveryRate(designResult.answer),
        stages: extractStages(designResult.answer),
        membranes: extractMembranes(designResult.answer),
        preTreatment: extractPreTreatment(designResult.answer)
      },
      priceBreakdown: {
        equipment: extractEquipmentCost(pricingResult.answer),
        installation: extractInstallationCost(pricingResult.answer),
        commissioning: extractCommissioningCost(pricingResult.answer),
        total: extractTotalCost(pricingResult.answer)
      },
      deliveryTime: extractDeliveryTime(pricingResult.answer),
      warranty: extractWarranty(designResult.answer),
      maintenanceSchedule: extractMaintenanceSchedule(designResult.answer)
    };
  } catch (error) {
    console.error('Quotation Generation Error:', error);
    throw error;
  }
}

// Helper functions to extract specific information from the RAG responses
function extractSystemModel(text: string): string {
  const match = text.match(/System Model:\s*(.*?)(\n|$)/);
  return match ? match[1].trim() : 'RO-Standard';
}

function extractRecoveryRate(text: string): number {
  const match = text.match(/Recovery Rate:\s*(\d+(?:\.\d+)?)%/);
  return match ? parseFloat(match[1]) : 75;
}

function extractStages(text: string): number {
  const match = text.match(/Number of Stages:\s*(\d+)/);
  return match ? parseInt(match[1]) : 2;
}

function extractMembranes(text: string): string {
  const match = text.match(/Membranes:\s*(.*?)(\n|$)/);
  return match ? match[1].trim() : 'Standard RO Membranes';
}

function extractPreTreatment(text: string): string[] {
  const match = text.match(/Pre-treatment:\s*(.*?)\n/);
  return match ? match[1].split(',').map(s => s.trim()) : ['Sediment Filter', 'Carbon Filter'];
}

function extractEquipmentCost(text: string): number {
  const match = text.match(/Equipment Cost:\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
  return match ? parseFloat(match[1].replace(/,/g, '')) : 0;
}

function extractInstallationCost(text: string): number {
  const match = text.match(/Installation Cost:\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
  return match ? parseFloat(match[1].replace(/,/g, '')) : 0;
}

function extractCommissioningCost(text: string): number {
  const match = text.match(/Commissioning Cost:\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
  return match ? parseFloat(match[1].replace(/,/g, '')) : 0;
}

function extractTotalCost(text: string): number {
  const match = text.match(/Total Cost:\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
  return match ? parseFloat(match[1].replace(/,/g, '')) : 0;
}

function extractDeliveryTime(text: string): number {
  const match = text.match(/Delivery Time:\s*(\d+)\s*weeks?/);
  return match ? parseInt(match[1]) : 4;
}

function extractWarranty(text: string): string {
  const match = text.match(/Warranty:\s*(.*?)(\n|$)/);
  return match ? match[1].trim() : '1 year parts & labor';
}

function extractMaintenanceSchedule(text: string): string[] {
  const match = text.match(/Maintenance Schedule:\s*(.*?)\n/);
  return match ? match[1].split(',').map(s => s.trim()) : ['Monthly inspection', 'Quarterly servicing'];
}
