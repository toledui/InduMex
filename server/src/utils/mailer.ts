import nodemailer from "nodemailer";
import * as configuracionRepo from "../repositories/configuracionRepository";

interface MailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

/**
 * Crea un transporter leyendo la config SMTP desde DB.
 * Claves esperadas: smtp_host, smtp_port, smtp_user, smtp_password, smtp_secure, smtp_from_name, smtp_from_email
 */
async function createTransporter() {
  const rows = await configuracionRepo.findAll();
  const cfg = Object.fromEntries(rows.map((r) => [r.clave, r.valor ?? ""]));

  const host = cfg.smtp_host || process.env.SMTP_HOST;
  const port = Number(cfg.smtp_port || process.env.SMTP_PORT || 587);
  const user = cfg.smtp_user || process.env.SMTP_USER;
  const pass = cfg.smtp_password || process.env.SMTP_PASSWORD;
  const secure = (cfg.smtp_secure || process.env.SMTP_SECURE || "false") === "true";
  const fromName = cfg.smtp_from_name || process.env.SMTP_FROM_NAME || "InduMex";
  const fromEmail = cfg.smtp_from_email || process.env.SMTP_FROM_EMAIL || "no-reply@indumex.blog";

  if (!host || !user || !pass) {
    return null; // SMTP no configurado — el envío será silenciado
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  return { transporter, from: `"${fromName}" <${fromEmail}>` };
}

/**
 * Envía un correo electrónico.
 * Si SMTP no está configurado, registra en consola y continúa sin error.
 */
export async function sendMail(options: MailOptions): Promise<void> {
  try {
    const result = await createTransporter();
    if (!result) {
      console.warn("[Mailer] SMTP no configurado. Correo omitido:", options.subject);
      return;
    }

    const { transporter, from } = result;
    const toAddresses = Array.isArray(options.to) ? options.to.join(", ") : options.to;

    await transporter.sendMail({
      from,
      to: toAddresses,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log(`[Mailer] Correo enviado a ${toAddresses}: ${options.subject}`);
  } catch (error) {
    // No propagamos el error para no romper el flujo del usuario
    console.error("[Mailer] Error al enviar correo:", error);
  }
}

/**
 * Obtiene la lista de correos de notificación de contacto desde DB.
 */
export async function getContactNotificationEmails(): Promise<string[]> {
  const rows = await configuracionRepo.findAll();
  const cfg = Object.fromEntries(rows.map((r) => [r.clave, r.valor ?? ""]));
  const raw = cfg.contact_notification_emails || process.env.CONTACT_NOTIFICATION_EMAILS || "";
  return raw
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

/**
 * Obtiene la lista de correos de notificación cuando se confirma un pago.
 */
export async function getPaymentNotificationEmails(): Promise<string[]> {
  const rows = await configuracionRepo.findAll();
  const cfg = Object.fromEntries(rows.map((r) => [r.clave, r.valor ?? ""]));
  const raw = cfg.payment_notification_emails || process.env.PAYMENT_NOTIFICATION_EMAILS || "";
  return raw
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

/**
 * Envía un correo de prueba SMTP y lanza error si no hay configuración válida.
 */
export async function sendSmtpTestEmail(to: string): Promise<void> {
  const result = await createTransporter();
  if (!result) {
    throw new Error("SMTP no está configurado. Completa host, usuario y contraseña.");
  }

  const { transporter, from } = result;
  await transporter.sendMail({
    from,
    to,
    subject: "Prueba SMTP InduMex",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background:#f8f9fa;">
        <div style="background:#004AAD; color:#fff; border-radius:12px 12px 0 0; padding:18px 22px;">
          <h1 style="margin:0; font-size:18px;">Prueba SMTP exitosa</h1>
        </div>
        <div style="background:#fff; border:1px solid #e5e7eb; border-top:none; border-radius:0 0 12px 12px; padding:22px; color:#111827;">
          <p style="margin:0 0 10px 0;">Tu configuración de correo en InduMex está funcionando correctamente.</p>
          <p style="margin:0; color:#6b7280; font-size:13px;">Fecha: ${new Date().toLocaleString("es-MX")}</p>
        </div>
      </div>
    `,
    text: `Prueba SMTP exitosa. Fecha: ${new Date().toLocaleString("es-MX")}`,
  });
}
