import { Request, Response } from "express";
import suscriptorService from "../services/suscriptorService";
import { sendMail, getContactNotificationEmails } from "../utils/mailer";
import { success, failure } from "../utils/response";

interface ContactBody {
  nombre?: string;
  email?: string;
  telefono?: string;
  asunto?: string;
  mensaje?: string;
}

class ContactController {
  /**
   * POST /api/v1/contact
   * Procesa el formulario de contacto:
   * 1. Valida los campos requeridos
   * 2. Guarda al remitente como suscriptor (origen: 'contacto')
   * 3. Envía notificación por correo a los emails configurados
   */
  async submit(req: Request, res: Response): Promise<void> {
    try {
      const { nombre, email, telefono, asunto, mensaje } = req.body as ContactBody;

      if (!email || !email.trim()) {
        failure(res, "El correo electrónico es obligatorio.", 422);
        return;
      }

      if (!nombre || !nombre.trim()) {
        failure(res, "El nombre es obligatorio.", 422);
        return;
      }

      if (!asunto || !asunto.trim()) {
        failure(res, "El asunto es obligatorio.", 422);
        return;
      }

      if (!mensaje || !mensaje.trim()) {
        failure(res, "El mensaje es obligatorio.", 422);
        return;
      }

      // Guardar como suscriptor
      await suscriptorService.subscribe({
        email: email.trim(),
        nombre: nombre.trim(),
        telefono: telefono?.trim() || undefined,
        origen: "contacto",
        metadata: {
          asunto: asunto.trim(),
          mensaje: mensaje.trim(),
          fecha: new Date().toISOString(),
        },
      });

      // Enviar notificación en background (no bloqueante)
      void (async () => {
        try {
          const notificationEmails = await getContactNotificationEmails();
          if (notificationEmails.length === 0) return;

          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 24px;">
              <div style="background: #004AAD; padding: 24px; border-radius: 12px 12px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 20px;">Nuevo mensaje de contacto — InduMex</h1>
              </div>
              <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e0e0e0; border-top: none;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #004AAD; width: 30%;">Nombre</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #333;">${nombre.trim()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #004AAD;">Correo</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;"><a href="mailto:${email.trim()}" style="color: #F58634;">${email.trim()}</a></td>
                  </tr>
                  ${telefono?.trim() ? `<tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #004AAD;">Teléfono</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #333;">${telefono.trim()}</td>
                  </tr>` : ""}
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #004AAD;">Asunto</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #333;">${asunto.trim()}</td>
                  </tr>
                </table>
                <div style="margin-top: 24px;">
                  <p style="font-weight: bold; color: #004AAD; margin-bottom: 8px;">Mensaje:</p>
                  <div style="background: #f8f9fa; border-left: 4px solid #F58634; padding: 16px; border-radius: 4px; color: #333; white-space: pre-wrap;">${mensaje.trim()}</div>
                </div>
                <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #f0f0f0; text-align: center; color: #999; font-size: 12px;">
                  InduMex 2.0 — Panel de Administración
                </div>
              </div>
            </div>
          `;

          await sendMail({
            to: notificationEmails,
            subject: `[InduMex Contacto] ${asunto.trim()} — ${nombre.trim()}`,
            html,
            text: `Nuevo mensaje de ${nombre.trim()} (${email.trim()})\n\nAsunto: ${asunto.trim()}\n\nMensaje:\n${mensaje.trim()}`,
          });
        } catch (err) {
          console.error("[Contact] Error enviando notificación:", err);
        }
      })();

      success(res, { message: "Mensaje enviado correctamente. En breve te contactaremos." }, 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al procesar el mensaje.";
      failure(res, message, 500);
    }
  }
}

export default new ContactController();
