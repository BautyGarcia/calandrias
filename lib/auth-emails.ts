import 'server-only'

// Mail de restablecimiento de contraseña del panel (lo dispara better-auth
// desde `sendResetPassword`). Mismo diseño que el template que usaba Supabase
// Auth (docs/supabase/email-templates/recovery.html). Resend se importa de
// forma diferida para que cargar lib/better-auth.ts (p. ej. desde la CLI
// `auth generate`) no exija RESEND_API_KEY.
export async function sendPasswordResetEmail(to: string, url: string): Promise<void> {
    const { resend, DEFAULT_FROM_EMAIL } = await import('@/lib/resend')
    const result = await resend.emails.send({
        from: process.env.AUTH_FROM_EMAIL || DEFAULT_FROM_EMAIL,
        to,
        subject: 'Restablecer contraseña — Panel Las Calandrias',
        html: passwordResetHtml(url),
    })
    if (result.error) throw new Error(`No se pudo enviar el mail de recuperación: ${result.error.message}`)
}

function passwordResetHtml(url: string): string {
    const href = url.replace(/"/g, '&quot;')
    return `<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#E6D8B8;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
  <tr>
    <td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border:1px solid #d9cdb0;border-radius:8px;overflow:hidden;">
        <tr>
          <td style="background-color:#F5E8D3;padding:24px;text-align:center;border-bottom:1px solid #d9cdb0;">
            <span style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:bold;color:#8D4925;">Las Calandrias</span>
            <div style="font-size:13px;color:#44525F;margin-top:4px;">Panel de Administración</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 24px;color:#44525F;font-size:15px;line-height:1.6;">
            <p style="margin:0 0 16px;color:#5A3825;font-size:18px;font-weight:bold;">Restablecer contraseña</p>
            <p style="margin:0 0 24px;">Recibimos un pedido para restablecer la contraseña de tu cuenta. Si fuiste vos, elegí una nueva con el siguiente botón:</p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
              <tr>
                <td style="background-color:#8D4925;border-radius:6px;">
                  <a href="${href}" style="display:inline-block;padding:12px 28px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;">Elegir nueva contraseña</a>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:13px;color:#44525F;">El enlace vence en 1 hora. Si no pediste este cambio, ignorá este mail: tu contraseña sigue siendo la misma.</p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#F5E8D3;padding:16px 24px;text-align:center;border-top:1px solid #d9cdb0;font-size:12px;color:#44525F;">
            Las Calandrias · Cabañas en Tandil
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`
}
