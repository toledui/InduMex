'use strict';

module.exports = {
  async up(queryInterface) {
    const planes = [
      {
        nombre: 'Verificado Mensual',
        descripcion: 'Suscripción mensual para proveedores verificados',
        precio: 299.00,
        moneda: 'MXN',
        periodicidad: 'mensual',
        beneficios: JSON.stringify([
          'Badge de "Verificado"',
          'Mayor visibilidad en búsquedas',
          'Renovación automática mensual',
          'Soporte prioritario',
        ]),
        status: 'verificado',
        activo: true,
      },
      {
        nombre: 'Patrocinado Mensual',
        descripcion: 'Suscripción mensual para proveedores patrocinados con máxima visibilidad',
        precio: 899.00,
        moneda: 'MXN',
        periodicidad: 'mensual',
        beneficios: JSON.stringify([
          'Badge de "Patrocinado"',
          'Máxima visibilidad en búsquedas',
          'Featured en página de inicio',
          'Renovación automática mensual',
          'Soporte VIP',
          'Reportes analíticos mensuales',
        ]),
        status: 'patrocinado',
        activo: true,
      },
    ];

    for (const plan of planes) {
      const exists = await queryInterface.sequelize.query(
        'SELECT id FROM `proveedor_suscripcion_plans` WHERE nombre = ?',
        {
          replacements: [plan.nombre],
          type: queryInterface.sequelize.QueryTypes.SELECT,
        }
      );

      if (exists.length === 0) {
        await queryInterface.sequelize.query(
          `INSERT INTO \`proveedor_suscripcion_plans\` (nombre, descripcion, precio, moneda, periodicidad, beneficios, status, activo, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          {
            replacements: [
              plan.nombre,
              plan.descripcion,
              plan.precio,
              plan.moneda,
              plan.periodicidad,
              plan.beneficios,
              plan.status,
              plan.activo,
            ],
          }
        );
      }
    }
  },

  async down(queryInterface) {
    // No eliminar los planes por defecto al hacer rollback
    // Por si hay suscripciones activas asociadas
    console.log('Seed rollback: manteneremos los planes por defecto intactos');
  },
};
