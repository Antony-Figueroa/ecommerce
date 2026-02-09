export interface User {
  verificationTokenExpires(verificationTokenExpires: any): unknown
  id: string
  email: string
  username: string | null
  name: string | null
  passwordHash: string | null
  role: string
  googleId: string | null
  avatarUrl: string | null
  emailVerified: boolean
  verificationToken: string | null
  resetPasswordToken: string | null
  resetPasswordExpires: Date | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  phone: string | null
}

export interface UserRepository {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  findByUsername(username: string): Promise<User | null>
  findByGoogleId(googleId: string): Promise<User | null>
  findByVerificationToken(token: string): Promise<User | null>
  findByResetToken(token: string): Promise<User | null>
  findFirst(where: any): Promise<User | null>
  create(data: any): Promise<User>
  update(id: string, data: any): Promise<User>
  delete(id: string): Promise<void>
  count(where: any): Promise<number>
  findAll(options: any): Promise<User[]>
}
