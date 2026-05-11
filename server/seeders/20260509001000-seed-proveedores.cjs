'use strict';

const PROVIDERS = [
  {
    nombre: 'Default', empresa: 'Default', name: 'Apex Logistics MX',
    slug: 'apex-logistics-mx',
    logo: 'AL',
    tier: 'premium',
    shortDescription: 'Operación 3PL para manufactura y distribución con trazabilidad total.',
    about:
      'Especialistas en logística industrial, almacenamiento, cross-docking y entregas técnicas para plantas de producción en el Bajío y norte del país.',
    sectors: JSON.stringify(['Logística 3PL', 'Energía']),
    certifications: JSON.stringify(['ISO 9001', 'AAA Logistics']),
    city: 'Querétaro',
    state: 'Querétaro',
    country: 'México',
    website: 'https://apexlogistics.mx',
    email: 'ventas@apexlogistics.mx',
    phone: '+52 442 555 0182',
    whatsapp: '+52 442 555 0182',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    nombre: 'Default', empresa: 'Default', name: 'Motion Control Studio',
    slug: 'motion-control-studio',
    logo: 'MC',
    tier: 'verified',
    shortDescription: 'Integración de celdas robotizadas y sistemas de automatización.',
    about:
      'Diseño, integración y puesta en marcha de soluciones de automatización para líneas de ensamble, visión artificial y control industrial.',
    sectors: JSON.stringify(['Automatización', 'Robótica', 'Sensórica']),
    certifications: JSON.stringify(['SIEMENS Solution Partner', 'ISO 14001']),
    city: 'Monterrey',
    state: 'Nuevo León',
    country: 'México',
    website: 'https://motioncontrolstudio.mx',
    email: 'hola@motioncontrolstudio.mx',
    phone: '+52 81 5550 4411',
    whatsapp: '+52 81 5550 4411',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    nombre: 'Default', empresa: 'Default', name: 'Precision CNC Bajío',
    slug: 'precision-cnc-bajio',
    logo: 'PC',
    tier: 'basic',
    shortDescription: 'Maquinados de alta precisión para piezas industriales y prototipos.',
    about:
      'Taller de maquinados con foco en fresado, torneado y fabricación de componentes personalizados para mantenimiento industrial.',
    sectors: JSON.stringify(['CNC', 'Maquinados', 'Mantenimiento']),
    certifications: JSON.stringify(['AS9100']),
    city: 'Celaya',
    state: 'Guanajuato',
    country: 'México',
    website: 'https://precisioncncbajio.mx',
    email: 'contacto@precisioncncbajio.mx',
    phone: '+52 461 555 3321',
    whatsapp: '+52 461 555 3321',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    nombre: 'Default', empresa: 'Default', name: 'Shield Industrial Supply',
    slug: 'shield-industrial-supply',
    logo: 'SI',
    tier: 'premium',
    shortDescription: 'Seguridad industrial y EPP para plantas con operación crítica.',
    about:
      'Suministro integral de EPP, señalización, auditorías de seguridad y estandarización para entornos de manufactura y logística.',
    sectors: JSON.stringify(['Seguridad Industrial', 'Logística 3PL']),
    certifications: JSON.stringify(['ANSI', 'ISO 45001']),
    city: 'Guadalajara',
    state: 'Jalisco',
    country: 'México',
    website: 'https://shieldindustrial.mx',
    email: 'ventas@shieldindustrial.mx',
    phone: '+52 33 5558 9000',
    whatsapp: '+52 33 5558 9000',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

module.exports = {
  up: async (queryInterface) => {
    const providerTable = await queryInterface.describeTable('proveedores');
    const hasNombre = Object.prototype.hasOwnProperty.call(providerTable, 'nombre');
    const hasEmpresa = Object.prototype.hasOwnProperty.call(providerTable, 'empresa');
    const hasSector = Object.prototype.hasOwnProperty.call(providerTable, 'sector');

    const [existing] = await queryInterface.sequelize.query('SELECT slug FROM proveedores');
    const existingSlugs = new Set(existing.map((row) => row.slug));
    const rows = PROVIDERS.filter((provider) => !existingSlugs.has(provider.slug));

    if (rows.length > 0) {
      await queryInterface.bulkInsert(
        'proveedores',
        rows.map((r) => {
          const { nombre, empresa, ...row } = r;

          if (hasNombre) row.nombre = r.name;
          if (hasEmpresa) row.empresa = r.name;
          if (hasSector) row.sector = JSON.parse(r.sectors)[0] || 'General';

          return row;
        })
      );
    }
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('proveedores', {
      slug: PROVIDERS.map((provider) => provider.slug),
    });
  },
};
