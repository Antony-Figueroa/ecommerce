require('dotenv').config();

const apiKey = process.env.GROQ_API_KEY;
const baseURL = 'https://api.groq.com/openai/v1';
const model = 'llama-3.1-8b-instant';

async function test() {
  console.log('--- NATIVE FETCH TEST START ---');
  console.log('Target URL:', `${baseURL}/chat/completions`);
  console.log('API Key starts with:', apiKey ? apiKey.substring(0, 7) : 'NONE');

  try {
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: 'hi' }]
      })
    });

    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const headers = {};
    response.headers.forEach((value, name) => {
      headers[name] = value;
    });
    console.log('Response Headers:', JSON.stringify(headers, null, 2));

    const text = await response.text();
    console.log('Raw Body:', text);

    try {
      const json = JSON.parse(text);
      console.log('Parsed JSON:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Body is not JSON');
    }

  } catch (error) {
    console.error('Fetch error:', error);
  }
  console.log('--- NATIVE FETCH TEST END ---');
}

test();
