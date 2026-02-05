import { validationRules } from "./validation"

describe("Validation Rules", () => {
  describe("Name Validation", () => {
    it("should accept valid names", () => {
      expect(validationRules.name.safeParse("Juan Pérez").success).toBe(true)
      expect(validationRules.name.safeParse("Ana Maria").success).toBe(true)
    })

    it("should reject names with numbers or special characters", () => {
      expect(validationRules.name.safeParse("Juan123").success).toBe(false)
      expect(validationRules.name.safeParse("Juan@Perez").success).toBe(false)
    })

    it("should reject names shorter than 2 characters", () => {
      expect(validationRules.name.safeParse("A").success).toBe(false)
    })

    it("should reject names longer than 50 characters", () => {
      expect(validationRules.name.safeParse("a".repeat(51)).success).toBe(false)
    })
  })

  describe("Email Validation", () => {
    it("should accept valid emails", () => {
      expect(validationRules.email.safeParse("usuario@dominio.com").success).toBe(true)
      expect(validationRules.email.safeParse("test.email+regex@sub.domain.org").success).toBe(true)
    })

    it("should reject invalid email formats", () => {
      expect(validationRules.email.safeParse("usuario@dominio").success).toBe(false)
      expect(validationRules.email.safeParse("@dominio.com").success).toBe(false)
      expect(validationRules.email.safeParse("usuario.com").success).toBe(false)
    })
  })

  describe("Phone Validation", () => {
    it("should accept valid 10-15 digit phone numbers", () => {
      expect(validationRules.phone.safeParse("1234567890").success).toBe(true)
      expect(validationRules.phone.safeParse("123456789012345").success).toBe(true)
    })

    it("should reject phone numbers with letters", () => {
      expect(validationRules.phone.safeParse("123456789a").success).toBe(false)
    })

    it("should reject phone numbers shorter than 10 digits", () => {
      expect(validationRules.phone.safeParse("123456789").success).toBe(false)
    })

    it("should reject phone numbers longer than 15 digits", () => {
      expect(validationRules.phone.safeParse("1234567890123456").success).toBe(false)
    })
  })

  describe("Age Validation", () => {
    it("should accept ages between 1 and 120", () => {
      expect(validationRules.age.safeParse(1).success).toBe(true)
      expect(validationRules.age.safeParse(120).success).toBe(true)
      expect(validationRules.age.safeParse(25).success).toBe(true)
    })

    it("should reject ages out of range", () => {
      expect(validationRules.age.safeParse(0).success).toBe(false)
      expect(validationRules.age.safeParse(121).success).toBe(false)
    })

    it("should reject non-integer ages", () => {
      expect(validationRules.age.safeParse(25.5).success).toBe(false)
    })
  })

  describe("Username Validation", () => {
    it("should accept valid usernames", () => {
      expect(validationRules.username.safeParse("user_123").success).toBe(true)
      expect(validationRules.username.safeParse("john_doe").success).toBe(true)
    })

    it("should reject usernames shorter than 3 characters", () => {
      expect(validationRules.username.safeParse("ab").success).toBe(false)
    })

    it("should reject usernames longer than 20 characters", () => {
      expect(validationRules.username.safeParse("a".repeat(21)).success).toBe(false)
    })

    it("should reject usernames with special characters other than underscore", () => {
      expect(validationRules.username.safeParse("user-name").success).toBe(false)
      expect(validationRules.username.safeParse("user.name").success).toBe(false)
      expect(validationRules.username.safeParse("user name").success).toBe(false)
    })
  })
})
