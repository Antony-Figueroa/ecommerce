
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const apiKey = process.env.GROQ_API_KEY || process.env.AI_API_KEY;
const baseURL = process.env.AI_BASE_URL || 'https://api.groq.com/openai/v1';
const model = process.env.AI_MODEL || 'llama-3.1-8b-instant';

console.log('Testing Groq connection...');
console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING');
console.log('Base URL:', baseURL);
console.log('Model:', model);

const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: baseURL,
  defaultHeaders: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
  }
});

async function test() {
  try {
    console.log('Testing GET /models...');
    const res = await fetch(`${baseURL}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Body:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

test();
