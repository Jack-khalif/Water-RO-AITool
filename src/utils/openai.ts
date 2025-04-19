import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export async function getAIResponse(prompt: string) {
  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a helpful RO (Reverse Osmosis) system design expert. 
          You help engineers with water treatment system design, calculations, and troubleshooting.
          You have expertise in:
          - Water quality analysis
          - RO system sizing and design
          - Pre-treatment requirements
          - Post-treatment options
          - System maintenance
          - Cost estimation
          - Davis and Shirtliff product specifications
          Keep responses concise and technical.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return completion.data.choices[0].message?.content || "I couldn't generate a response.";
  } catch (error) {
    console.error('OpenAI API error:', error);
    return "Sorry, I'm having trouble connecting to my knowledge base. Please try again later.";
  }
}
