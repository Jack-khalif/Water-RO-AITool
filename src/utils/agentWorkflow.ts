import { OpenAI } from 'openai';
import { ProcessedDocument } from './pdfProcessor';

export interface WorkflowState {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  currentStep: string;
  progress: number;
  results: any;
  error?: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  requiredInputs: string[];
  execute: (inputs: any) => Promise<any>;
  validate: (result: any) => boolean;
}

export class WaterTreatmentAgent {
  private openai: OpenAI;
  private state: WorkflowState;
  private steps: WorkflowStep[];

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
    this.state = {
      status: 'pending',
      currentStep: '',
      progress: 0,
      results: {}
    };
    
    this.steps = [
      {
        id: 'lab_analysis',
        name: 'Laboratory Report Analysis',
        description: 'Analyze water quality parameters from lab report',
        requiredInputs: ['processedDocument'],
        execute: this.analyzeLaboratoryReport.bind(this),
        validate: (result) => {
          return result.parameters && Object.keys(result.parameters).length > 0;
        }
      },
      {
        id: 'system_design',
        name: 'RO System Design',
        description: 'Design optimal RO system based on water parameters',
        requiredInputs: ['waterParameters'],
        execute: this.designROSystem.bind(this),
        validate: (result) => {
          return result.design && result.specifications;
        }
      },
      {
        id: 'proposal_generation',
        name: 'Proposal Generation',
        description: 'Generate detailed proposal with cost analysis',
        requiredInputs: ['systemDesign', 'waterParameters'],
        execute: this.generateProposal.bind(this),
        validate: (result) => {
          return result.proposal && result.costAnalysis;
        }
      }
    ];
  }

  private async analyzeLaboratoryReport(inputs: { processedDocument: ProcessedDocument }): Promise<any> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a water treatment expert specializing in RO system design. Analyze the laboratory report and extract key water quality parameters.
            Focus on these critical parameters:
            1. pH
            2. Total Dissolved Solids (TDS)
            3. Iron (Fe)
            4. Manganese (Mn)
            5. Hardness (as CaCO3)
            6. Turbidity
            7. Silica
            8. Chlorides
            9. Conductivity
            10. Temperature
            
            Also determine:
            - If the report is older than 6 months (mark as budgetary)
            - Any concerning levels that require special attention
            - Recommended pretreatment based on parameters
            Output as JSON with these sections: parameters, age_status, concerns, pretreatment_recommendations`
          },
          {
            role: "user",
            content: inputs.processedDocument.text
          }
        ]
      });

      const analysis = JSON.parse(completion.choices[0].message.content);
      return analysis;
    } catch (error) {
      throw new Error('Failed to analyze laboratory report: ' + error.message);
    }
  }

  private async designROSystem(inputs: { waterParameters: any }): Promise<any> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an RO system design expert at Davis & Shirtliff. Design an optimal system based on the water parameters.
            Follow these design rules:
            1. Pretreatment:
               - Recommend DMI filters or oxidation for high Fe/Mn
               - pH adjustment when pH < 8 with chlorine oxidation
               - Filter sizing based on flow rate
               - Media selection (glass grade 2/3, activated carbon)
            
            2. RO Configuration:
               - Calculate permeate vs feed flow (2:1 rule)
               - Select membrane type
               - Choose antiscalant (Genesys BS or SI for high silica)
               - Size chemical dosing tanks
            
            3. Post Treatment:
               - Post-chlorination for domestic use
               - UV option for bottling
            
            Output as JSON with sections: pretreatment_design, ro_configuration, post_treatment, system_specifications`
          },
          {
            role: "user",
            content: JSON.stringify(inputs.waterParameters)
          }
        ]
      });

      const design = JSON.parse(completion.choices[0].message.content);
      return design;
    } catch (error) {
      throw new Error('Failed to design RO system: ' + error.message);
    }
  }

  private async generateProposal(inputs: { systemDesign: any; waterParameters: any }): Promise<any> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a water treatment consultant at Davis & Shirtliff. Generate a detailed proposal following the company format.
            Include:
            1. Executive Summary
               - Client details
               - Project scope
               - Key recommendations
            
            2. Water Analysis
               - Current water quality
               - Treatment objectives
               - Compliance requirements
            
            3. Proposed Solution
               - Treatment process flow
               - Equipment specifications
               - System performance expectations
            
            4. Bill of Quantities
               - Equipment list with Dayliff products
               - Chemical dosing (Grundfos/Seko pumps)
               - Installation materials
            
            5. Commercial Terms
               - Pricing breakdown
               - Warranty
               - Installation timeline
               - Payment terms
            
            Output as JSON with these sections plus a formatted_proposal field containing the complete proposal text.`
          },
          {
            role: "user",
            content: JSON.stringify({
              design: inputs.systemDesign,
              parameters: inputs.waterParameters
            })
          }
        ]
      });

      const proposal = JSON.parse(completion.choices[0].message.content);
      return proposal;
    } catch (error) {
      throw new Error('Failed to generate proposal: ' + error.message);
    }
  }

  public async executeWorkflow(initialInput: { processedDocument: ProcessedDocument }): Promise<WorkflowState> {
    this.state.status = 'processing';
    this.state.results = {};

    try {
      for (const step of this.steps) {
        this.state.currentStep = step.id;
        
        // Prepare inputs for the current step
        const stepInputs = {};
        for (const input of step.requiredInputs) {
          if (input === 'processedDocument') {
            stepInputs[input] = initialInput.processedDocument;
          } else {
            stepInputs[input] = this.state.results[input];
          }
        }

        // Execute step
        const result = await step.execute(stepInputs);
        
        // Validate result
        if (!step.validate(result)) {
          throw new Error(`Validation failed for step ${step.id}`);
        }

        // Store results
        this.state.results[step.id] = result;
        this.state.progress = ((this.steps.indexOf(step) + 1) / this.steps.length) * 100;
      }

      this.state.status = 'completed';
      return this.state;
    } catch (error) {
      this.state.status = 'failed';
      this.state.error = error.message;
      throw error;
    }
  }

  public getState(): WorkflowState {
    return { ...this.state };
  }
}
