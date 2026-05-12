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
    // Necesario para algunos SMTP reales con certificados auto-firmados o SNI
    tls: {
      rejectUnauthorized: true,
      minVersion: "TLSv1.2" as const,
    },
  });

  return { transporter, from: `"${fromName}" <${fromEmail}>`, config: { host, port, secure, user } };
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

    const info = await transporter.sendMail({
      from,
      to: toAddresses,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (info.rejected && info.rejected.length > 0) {
      console.error(`[Mailer] SMTP rechazó destinatarios: ${JSON.stringify(info.rejected)} | subject: ${options.subject}`);
    } else {
      console.log(`[Mailer] Correo enviado a ${toAddresses}: ${options.subject} | messageId: ${info.messageId}`);
    }
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

export interface SmtpTestResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
  host: string;
  port: number;
  secure: boolean;
  user: string;
}

/**
 * Verifica la conexión SMTP y envía un correo de prueba.
 * Lanza error con mensaje descriptivo si algo falla.
 */
export async function sendSmtpTestEmail(to: string): Promise<SmtpTestResult> {
  const result = await createTransporter();
  if (!result) {
    throw new Error("SMTP no está configurado. Completa host, usuario y contraseña.");
  }

  const { transporter, from, config } = result;

  // Verificar conexión real ANTES de intentar el envío
  try {
    await transporter.verify();
  } catch (verifyError) {
    const msg = verifyError instanceof Error ? verifyError.message : String(verifyError);
    throw new Error(`No se puede conectar al servidor SMTP (${config.host}:${config.port}): ${msg}`);
  }

  const info = await transporter.sendMail({
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

  if (info.rejected && info.rejected.length > 0) {
    throw new Error(`SMTP aceptó la conexión pero rechazó el destinatario: ${JSON.stringify(info.rejected)}`);
  }

  return {
    messageId: info.messageId,
    accepted: info.accepted as string[],
    rejected: info.rejected as string[],
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.user,
  };
}
