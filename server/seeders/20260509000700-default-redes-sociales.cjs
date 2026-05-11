'use strict';

module.exports = {
  up: async (queryInterface) => {
    const seedRows = [
      {
        nombre: 'Twitter',
        url: 'https://twitter.com/indumexblog',
        icono: 'Twitter',
        orden: 1,
        activa: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        nombre: 'LinkedIn',
        url: 'https://linkedin.com/company/indumex',
        icono: 'Linkedin',
        orden: 2,
        activa: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    const existing = await queryInterface.sequelize.query(
      'SELECT nombre FROM redes_sociales',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const existingNames = new Set(existing.map((row) => row.nombre));
    const rowsToInsert = seedRows.filter((row) => !existingNames.has(row.nombre));

    if (rowsToInsert.length > 0) {
      await queryInterface.bulkInsert('redes_sociales', rowsToInsert);
    }
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('redes_sociales', null, {});
  },
};
