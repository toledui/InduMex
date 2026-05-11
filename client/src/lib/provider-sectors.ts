export const PROVIDER_SECTORS = [
  'Logistica 3PL',
  'Automatizacion',
  'CNC',
  'Robotica',
  'Sensorica',
  'Mantenimiento',
  'Maquinados',
  'Seguridad Industrial',
  'Energia',
] as const;

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function isImageLogo(value: string): boolean {
  return /^(https?:\/\/|\/uploads\/|data:image\/)/i.test(value);
}

export function sanitizeRichText(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/\son\w+=("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)=("|')\s*javascript:[^"']*("|')/gi, '$1="#"');
}
