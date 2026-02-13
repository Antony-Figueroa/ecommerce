
import Groq from 'groq-sdk';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const apiKey = process.env.GROQ_API_KEY || process.env.AI_API_KEY;
const model = process.env.AI_MODEL || 'llama-3.1-8b-instant';

console.log('Testing with groq-sdk...');
console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING');

const groq = new Groq({
  apiKey: apiKey
});

async function test() {
  try {
    const response = await groq.chat.completions.create({
      model: model,
      messages: [{ role: 'user', content: 'hi' }]
    });
    console.log('Success! Response:', response.choices[0].message.content);
  } catch (error) {
    console.error('Groq SDK Error:');
    console.error('Status:', error.status);
    console.error('Message:', error.message);
    console.error('Full error:', error);
  }
}

test();
