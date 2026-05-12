import type { PublicProvider } from '@/lib/api';

/**
 * Proveedores de demostración. Se muestran en el directorio y en las páginas
 * de detalle cuando el backend no devuelve datos (e.g. BD vacía en entornos
 * nuevos o cuando la API no está disponible).
 * NO se guardan en la base de datos.
 */
export const MOCK_PROVIDERS: PublicProvider[] = [
  {
    id: -1,
    name: 'Apex Logistics MX',
    slug: 'apex-logistics-mx',
    logo: 'AL',
    tier: 'premium',
    shortDescription: 'Operación 3PL para manufactura y distribución con trazabilidad total.',
    about:
      'Especialistas en logística industrial, almacenamiento, cross-docking y entregas técnicas para plantas de producción en el Bajío y norte del país.',
    sectors: ['Logística 3PL', 'Energía'],
    certifications: ['ISO 9001', 'AAA Logistics'],
    socialNetworks: [],
    city: 'Querétaro',
    state: 'Querétaro',
    country: 'México',
    website: 'https://apexlogistics.mx',
    email: 'ventas@apexlogistics.mx',
    phone: '+52 442 555 0182',
    whatsapp: '+52 442 555 0182',
    isActive: true,
  },
  {
    id: -2,
    name: 'Motion Control Studio',
    slug: 'motion-control-studio',
    logo: 'MC',
    tier: 'verified',
    shortDescription: 'Integración de celdas robotizadas y sistemas de automatización.',
    about:
      'Diseño, integración y puesta en marcha de soluciones de automatización para líneas de ensamble, visión artificial y control industrial.',
    sectors: ['Automatización', 'Robótica', 'Sensórica'],
    certifications: ['SIEMENS Solution Partner', 'ISO 14001'],
    socialNetworks: [],
    city: 'Monterrey',
    state: 'Nuevo León',
    country: 'México',
    website: 'https://motioncontrolstudio.mx',
    email: 'hola@motioncontrolstudio.mx',
    phone: '+52 81 5550 4411',
    whatsapp: '+52 81 5550 4411',
    isActive: true,
  },
  {
    id: -3,
    name: 'Precision CNC Bajío',
    slug: 'precision-cnc-bajio',
    logo: 'PC',
    tier: 'basic',
    shortDescription: 'Maquinados de alta precisión para piezas industriales y prototipos.',
    about:
      'Taller de maquinados con foco en fresado, torneado y fabricación de componentes personalizados para mantenimiento industrial.',
    sectors: ['CNC', 'Maquinados', 'Mantenimiento'],
    certifications: ['AS9100'],
    socialNetworks: [],
    city: 'Celaya',
    state: 'Guanajuato',
    country: 'México',
    website: 'https://precisioncncbajio.mx',
    email: 'contacto@precisioncncbajio.mx',
    phone: '+52 461 555 3321',
    whatsapp: '+52 461 555 3321',
    isActive: true,
  },
  {
    id: -4,
    name: 'Shield Industrial Supply',
    slug: 'shield-industrial-supply',
    logo: 'SI',
    tier: 'premium',
    shortDescription: 'Seguridad industrial y EPP para plantas con operación crítica.',
    about:
      'Suministro integral de EPP, señalización, auditorías de seguridad y estandarización para entornos de manufactura y logística.',
    sectors: ['Seguridad Industrial', 'Logística 3PL'],
    certifications: ['ANSI', 'ISO 45001'],
    socialNetworks: [],
    city: 'Guadalajara',
    state: 'Jalisco',
    country: 'México',
    website: 'https://shieldindustrial.mx',
    email: 'ventas@shieldindustrial.mx',
    phone: '+52 33 5558 9000',
    whatsapp: '+52 33 5558 9000',
    isActive: true,
  },
];
