async function main() {
  const url = 'http://localhost:3001/api/auth/register'
  const suffix = Date.now()
  const payload = {
    name: 'Juan Perez',
    email: `juan.test+${suffix}@example.com`,
    password: 'Aa123456'
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const text = await res.text()
    console.log('Status:', res.status)
    console.log('Body:', text)
  } catch (err) {
    console.error('Request error:', err)
    process.exit(1)
  }
}

main()
