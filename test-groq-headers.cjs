require('dotenv').config();

const apiKey = process.env.GROQ_API_KEY;
const baseURL = 'https://api.groq.com/openai/v1';
const model = 'llama-3.1-8b-instant';

async function test() {
  console.log('--- NATIVE FETCH TEST (WITH EXTRA HEADERS) START ---');
  
  try {
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Origin': 'https://groq.com',
        'Referer': 'https://groq.com/'
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: 'hi' }]
      })
    });

    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Body:', text);

  } catch (error) {
    console.error('Fetch error:', error);
  }
  console.log('--- TEST END ---');
}

test();
