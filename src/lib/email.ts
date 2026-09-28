import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
})

export async function sendMagicLink(email: string, link: string) {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Birthday Dashboard'

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Tu enlace de acceso a ${appName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #EC407A 0%, #C2185B 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎂 ${appName}</h1>
          </div>
          <div style="background: #fff; padding: 30px; border: 1px solid #f0f0f0; border-top: none; border-radius: 0 0 16px 16px;">
            <p style="font-size: 16px; margin-bottom: 24px;">Hola,</p>
            <p style="font-size: 16px; margin-bottom: 24px;">Has solicitado acceso a tu panel de cumpleaños. Haz clic en el botón below para entrar:</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${link}" style="background: linear-gradient(135deg, #EC407A 0%, #C2185B 100%); color: white; padding: 16px 32px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(236, 64, 122, 0.3);">
                Acceder al Dashboard
              </a>
            </div>
            <p style="font-size: 14px; color: #888; margin-top: 24px;">Este enlace expira en 15 minutos. Si no solicitaste este acceso, ignora este correo.</p>
            <hr style="border: none; border-top: 1px solid #f0f0f0; margin: 24px 0;">
            <p style="font-size: 12px; color: #aaa; text-align: center;">${appName} - Panel de Cumpleaños</p>
          </div>
        </body>
      </html>
    `,
  })
}

export async function sendSignInLink(email: string, link: string) {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Birthday Dashboard'

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Tu enlace de acceso a ${appName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #EC407A 0%, #C2185B 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎂 ${appName}</h1>
          </div>
          <div style="background: #fff; padding: 30px; border: 1px solid #f0f0f0; border-top: none; border-radius: 0 0 16px 16px;">
            <p style="font-size: 16px; margin-bottom: 24px;">Hola,</p>
            <p style="font-size: 16px; margin-bottom: 24px;">Has solicitado acceso a tu panel de cumpleaños. Haz clic en el botón below para entrar:</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${link}" style="background: linear-gradient(135deg, #EC407A 0%, #C2185B 100%); color: white; padding: 16px 32px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(236, 64, 122, 0.3);">
                Acceder al Dashboard
              </a>
            </div>
            <p style="font-size: 14px; color: #888; margin-top: 24px;">Este enlace expira en 15 minutos. Si no solicitaste este acceso, ignora este correo.</p>
            <hr style="border: none; border-top: 1px solid #f0f0f0; margin: 24px 0;">
            <p style="font-size: 12px; color: #aaa; text-align: center;">${appName} - Panel de Cumpleaños</p>
          </div>
        </body>
      </html>
    `,
  })
}

export async function sendWelcomeEmail(email: string, nombre: string) {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Birthday Dashboard'

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Bienvenido a ${appName} 🎉`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #EC407A 0%, #C2185B 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎂 ¡Bienvenid${nombre.endsWith('a') ? 'a' : 'o'}, ${nombre}!</h1>
          </div>
          <div style="background: #fff; padding: 30px; border: 1px solid #f0f0f0; border-top: none; border-radius: 0 0 16px 16px;">
            <p style="font-size: 16px; margin-bottom: 24px;">Tu cuenta ha sido creada exitosamente.</p>
            <p style="font-size: 16px; margin-bottom: 24px;">Ya puedes empezar a gestionar los cumpleaños de tu equipo.</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${process.env.NEXTAUTH_URL}" style="background: linear-gradient(135deg, #EC407A 0%, #C2185B 100%); color: white; padding: 16px 32px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
                Ir al Dashboard
              </a>
            </div>
          </div>
        </body>
      </html>
    `,
  })
}