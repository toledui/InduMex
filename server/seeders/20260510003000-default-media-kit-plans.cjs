'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const plans = [
      {
        nombre: 'Plan Básico',
        descripcion: 'Perfecto para startups y pequeños negocios que desean aumentar su visibilidad en la industria.',
        precio: 6500,
        moneda: 'MXN',
        items: JSON.stringify([
          { name: 'Plan Básico - InduMex Media Kit', price: 6500, quantity: 1 }
        ]),
        features: JSON.stringify([
          'Logo en página de Media Kit',
          '1 mención en newsletter mensual',
          'Enlace a tu sitio web',
          'Alcance: ~5,000 profesionales mensuales',
          'Validez: 3 meses'
        ]),
        activo: true,
        precio_descuento: 5850,
        porcentaje_descuento: 10,
        created_at: now,
        updated_at: now
      },
      {
        nombre: 'Plan Profesional',
        descripcion: 'La opción más popular. Incluye publicidad destacada y mayor exposición en nuestras plataformas.',
        precio: 13000,
        moneda: 'MXN',
        items: JSON.stringify([
          { name: 'Plan Profesional - InduMex Media Kit', price: 13000, quantity: 1 }
        ]),
        features: JSON.stringify([
          'Todo lo del Plan Básico +',
          'Logo destacado (tamaño grande)',
          'Banner 300x600px en la homepage',
          '2 menciones en newsletter mensual',
          'Post patrocinado en blog (1x al mes)',
          'Alcance: ~15,000 profesionales mensuales',
          'Validez: 6 meses',
          'Acceso a estadísticas de impresiones'
        ]),
        activo: true,
        precio_descuento: 11050,
        porcentaje_descuento: 15,
        created_at: now,
        updated_at: now
      },
      {
        nombre: 'Plan Premium',
        descripcion: 'Máxima exposición y visibilidad. Diseñado para empresas líderes que buscan dominar el espacio.',
        precio: 20000,
        moneda: 'MXN',
        items: JSON.stringify([
          { name: 'Plan Premium - InduMex Media Kit', price: 20000, quantity: 1 }
        ]),
        features: JSON.stringify([
          'Todo lo del Plan Profesional +',
          'Banner 728x90px en homepage + 300x600px',
          '4 menciones en newsletter (incluidas)',
          'Post patrocinado en blog (2x al mes)',
          'Webinar/Evento exclusivo (hosting)',
          'Acceso a base de datos de contactos (hasta 100)',
          'Alcance: ~30,000+ profesionales mensuales',
          'Validez: 12 meses',
          'Soporte dedicado',
          'Reportes mensuales detallados',
          'Logo en página de Directorio B2B'
        ]),
        activo: true,
        precio_descuento: 16000,
        porcentaje_descuento: 20,
        created_at: now,
        updated_at: now
      }
    ];

    for (const plan of plans) {
      const existing = await queryInterface.sequelize.query(
        'SELECT id FROM media_kit_planes WHERE nombre = :nombre LIMIT 1',
        {
          replacements: { nombre: plan.nombre },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (Array.isArray(existing) && existing.length > 0) {
        await queryInterface.bulkUpdate(
          'media_kit_planes',
          {
            descripcion: plan.descripcion,
            precio: plan.precio,
            moneda: plan.moneda,
            items: plan.items,
            features: plan.features,
            activo: plan.activo,
            precio_descuento: plan.precio_descuento,
            porcentaje_descuento: plan.porcentaje_descuento,
            updated_at: now,
          },
          { nombre: plan.nombre }
        );
      } else {
        await queryInterface.bulkInsert('media_kit_planes', [plan], {});
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      'media_kit_planes',
      {
        nombre: ['Plan Básico', 'Plan Profesional', 'Plan Premium'],
      },
      {}
    );
  }
};
