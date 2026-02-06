import nodemailer from 'nodemailer'
import { config } from '../../shared/config/index.js'

export class EmailService {
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
    })
  }

  async sendVerificationEmail(email: string, token: string, name: string) {
    const verificationUrl = `${config.frontendUrl}/verify-email?token=${token}`

    const mailOptions = {
      from: `"Ana's Supplements" <${config.emailFrom}>`,
      to: email,
      subject: 'Verifica tu cuenta - Ana\'s Supplements',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>¡Hola ${name}!</h2>
          <p>Gracias por registrarte en Ana's Supplements. Para completar tu registro y activar tu cuenta, por favor haz clic en el siguiente botón:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Verificar mi cuenta
            </a>
          </div>
          <p>O copia y pega este enlace en tu navegador:</p>
          <p>${verificationUrl}</p>
          <p>Este enlace expirará en 24 horas.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">Si no creaste esta cuenta, puedes ignorar este correo.</p>
        </div>
      `,
    }

    try {
      await this.transporter.sendMail(mailOptions)
      console.log(`[Email Service] Correo de verificación enviado a: ${email}`)
    } catch (error) {
      console.error('[Email Service] Error al enviar correo:', error)
      throw new Error('No se pudo enviar el correo de verificación')
    }
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`

    const mailOptions = {
      from: `"Ana's Supplements" <${config.emailFrom}>`,
      to: email,
      subject: 'Restablecer contraseña - Ana\'s Supplements',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Restablecer contraseña</h2>
          <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente botón para continuar:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Restablecer contraseña
            </a>
          </div>
          <p>O copia y pega este enlace en tu navegador:</p>
          <p>${resetUrl}</p>
          <p>Este enlace expirará en 1 hora.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">Si no solicitaste este cambio, puedes ignorar este correo.</p>
        </div>
      `,
    }

    try {
      await this.transporter.sendMail(mailOptions)
      console.log(`[Email Service] Correo de restablecimiento enviado a: ${email}`)
    } catch (error) {
      console.error('[Email Service] Error al enviar correo:', error)
      throw new Error('No se pudo enviar el correo de restablecimiento')
    }
  }

  async sendAbandonedCartEmail(email: string, name: string, items: any[]) {
    const cartUrl = `${config.frontendUrl}/cart`
    const itemsHtml = items.map(item => `
      <div style="display: flex; align-items: center; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
        <div style="flex: 1;">
          <p style="margin: 0; font-weight: bold;">${item.product.name}</p>
          <p style="margin: 0; color: #666; font-size: 14px;">Cantidad: ${item.quantity}</p>
        </div>
      </div>
    `).join('')

    const mailOptions = {
      from: `"Ana's Supplements" <${config.emailFrom}>`,
      to: email,
      subject: '¡Te extrañamos! Tu carrito te espera',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>¡Hola ${name}!</h2>
          <p>Notamos que dejaste algunos productos increíbles en tu carrito. ¡Aún están disponibles para ti!</p>
          <div style="margin: 20px 0; background: #f9f9f9; padding: 20px; border-radius: 8px;">
            <h3 style="margin-top: 0;">Tu Carrito:</h3>
            ${itemsHtml}
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${cartUrl}" 
               style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Volver a mi carrito
            </a>
          </div>
          <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">© ${new Date().getFullYear()} Ana's Supplements. Todos los derechos reservados.</p>
        </div>
      `,
    }

    try {
      await this.transporter.sendMail(mailOptions)
      console.log(`[Email Service] Correo de carrito abandonado enviado a: ${email}`)
    } catch (error) {
      console.error('[Email Service] Error al enviar correo de carrito abandonado:', error)
      // No lanzamos error para no detener el proceso de fondo
    }
  }
}
