import { authService } from '../src/shared/container.js'

async function main() {
  const suffix = Date.now()
  const data = {
    name: 'Maria Gomez',
    email: `maria.gomez+${suffix}@example.com`,
    password: 'Aa123456',
  }

  const user = await authService.register(data)
  console.log(JSON.stringify(user))
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
