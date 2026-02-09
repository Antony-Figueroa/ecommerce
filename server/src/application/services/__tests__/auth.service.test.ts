import { authService, userRepo } from '../../../shared/container.js'

describe('AuthService register', () => {
  it('registra usuario con email verificado y sin token de verificación', async () => {
    const suffix = Date.now()
    const email = `test.auth.${suffix}@example.com`

    const user = await authService.register({
      name: 'Test User',
      email,
      password: 'Aa123456'
    })

    expect(user.email).toBe(email)

    const stored = await userRepo.findByEmail(email)
    expect(stored).not.toBeNull()
    expect(stored!.emailVerified).toBe(true)
    expect(stored!.verificationToken).toBeNull()
    expect(stored!.verificationTokenExpires).toBeNull()
  })
})
