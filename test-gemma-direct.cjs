
const OpenAI = require('openai');
const dotenv = require('dotenv');
dotenv.config();

const config = {
  aiApiKey: process.env.AI_API_KEY || process.env.GOOGLE_AI_KEY,
  aiBaseUrl: 'https://generativelanguage.googleapis.com/v1/openai',
  aiModel: process.env.AI_MODEL || 'gemma-3-27b-it'
};

const openai = new OpenAI({
  apiKey: config.aiApiKey,
  baseURL: config.aiBaseUrl
});

async function test() {
  try {
    console.log('Testing with config:', { ...config, aiApiKey: '***' });
    const response = await openai.chat.completions.create({
      model: config.aiModel,
      messages: [
        { role: 'system', content: 'Eres un asistente útil.' },
        { role: 'user', content: 'Hola' }
      ]
    });
    console.log('Success:', response.choices[0].message.content);
  } catch (error) {
    console.error('Error:', error.status, error.message);
    if (error.response) {
      console.error('Response details:', error.response.data);
    }
  }
}

test();
