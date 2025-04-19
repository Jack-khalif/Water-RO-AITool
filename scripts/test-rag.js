require('dotenv').config({ path: '.env.local' });
const OpenAI = require('openai');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Sample data for testing
const testCases = [
  {
    name: "Industrial Food Processing Plant",
    data: {
      waterQuality: {
        tds: 1500,
        ph: 7.2,
        hardness: 300,
        alkalinity: 250,
        chlorides: 400
      },
      requirements: {
        location: "Coastal",
        industry: "Food & Beverage",
        dailyDemand: 50,
        operatingHours: 16
      }
    }
  },
  {
    name: "Commercial Building",
    data: {
      waterQuality: {
        tds: 800,
        ph: 6.8,
        hardness: 150,
        alkalinity: 120,
        chlorides: 200
      },
      requirements: {
        location: "Urban",
        industry: "Commercial",
        dailyDemand: 10,
        operatingHours: 12
      }
    }
  }
];

// Knowledge base for recommendations
const knowledgeBase = {
  pretreatment: {
    highTDS: ["Multimedia filter", "Water softener", "Antiscalant dosing"],
    highHardness: ["Water softener", "Antiscalant dosing"],
    highChlorine: ["Carbon filter", "Chemical reduction"]
  },
  locationFactors: {
    Coastal: {
      challenges: ["High TDS", "Corrosion risk"],
      recommendations: ["Corrosion-resistant materials", "Enhanced pretreatment"]
    },
    Urban: {
      challenges: ["Space constraints", "Noise regulations"],
      recommendations: ["Compact system design", "Sound insulation"]
    }
  },
  industryRequirements: {
    "Food & Beverage": {
      standards: ["FDA compliance", "HACCP requirements"],
      recommendations: ["CIP system", "UV sterilizer"]
    },
    "Commercial": {
      standards: ["Basic filtration", "Cost-effective"],
      recommendations: ["Standard RO", "Basic monitoring"]
    }
  }
};

async function analyzeWaterRequirements(testCase) {
  const { waterQuality, requirements } = testCase.data;
  
  // Create a context-rich prompt
  const prompt = `As a water treatment expert, analyze this water treatment scenario:

Water Quality Parameters:
- TDS: ${waterQuality.tds} mg/L
- pH: ${waterQuality.ph}
- Hardness: ${waterQuality.hardness} mg/L
- Alkalinity: ${waterQuality.alkalinity} mg/L
- Chlorides: ${waterQuality.chlorides} mg/L

Project Requirements:
- Location: ${requirements.location}
- Industry: ${requirements.industry}
- Daily Demand: ${requirements.dailyDemand} m³/day
- Operating Hours: ${requirements.operatingHours} hours/day

Based on these parameters, provide:
1. Pre-treatment recommendations
2. RO system specifications
3. Post-treatment requirements
4. Maintenance schedule
5. Rough cost estimate (in KES)

Consider:
- Location-specific challenges
- Industry-specific requirements
- Energy efficiency
- Maintenance accessibility
- Local regulations`;

  try {
    console.log(`\nAnalyzing case: ${testCase.name}`);
    console.log("Sending request to OpenAI...");
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a water treatment expert specializing in RO systems. 
          Use the following knowledge base for context:
          ${JSON.stringify(knowledgeBase, null, 2)}
          
          Provide practical, detailed recommendations with specific products and numbers.
          Include Davis & Shirtliff product references where applicable.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
    });

    console.log("\nAnalysis Results:");
    console.log("=================");
    console.log(completion.choices[0].message.content);
    
    // Add local recommendations based on knowledge base
    console.log("\nLocal Knowledge Base Recommendations:");
    console.log("===================================");
    
    // Get location-specific recommendations
    const locationInfo = knowledgeBase.locationFactors[requirements.location];
    if (locationInfo) {
      console.log("\nLocation-Specific Considerations:");
      console.log("Challenges:", locationInfo.challenges.join(", "));
      console.log("Recommendations:", locationInfo.recommendations.join(", "));
    }

    // Get industry-specific recommendations
    const industryInfo = knowledgeBase.industryRequirements[requirements.industry];
    if (industryInfo) {
      console.log("\nIndustry-Specific Requirements:");
      console.log("Standards:", industryInfo.standards.join(", "));
      console.log("Recommendations:", industryInfo.recommendations.join(", "));
    }

    // Determine pretreatment needs
    console.log("\nPretreatment Recommendations:");
    if (waterQuality.tds > 1000) {
      console.log("High TDS:", knowledgeBase.pretreatment.highTDS.join(", "));
    }
    if (waterQuality.hardness > 200) {
      console.log("High Hardness:", knowledgeBase.pretreatment.highHardness.join(", "));
    }

  } catch (error) {
    console.error("Error during analysis:", error.response?.data || error.message);
  }
}

// Run tests
async function runTests() {
  console.log("Starting RAG System Tests");
  console.log("========================");
  
  for (const testCase of testCases) {
    await analyzeWaterRequirements(testCase);
    console.log("\n" + "=".repeat(50) + "\n");
  }
}

runTests();
