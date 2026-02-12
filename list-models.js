import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY || '');
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_AI_KEY}`);
    const data = await response.json();
    if (data.models) {
      const names = data.models.map(m => m.name);
      console.log('Model names:', names);
      console.log('Search for 1.5 flash:', names.filter(n => n.includes('1.5-flash')));
      console.log('Search for 2.0 flash:', names.filter(n => n.includes('2.0-flash')));
    } else {
      console.log('No models found in response:', data);
    }
  } catch (error) {
    console.error('Error listing models:', error);
  }
}

listModels();
