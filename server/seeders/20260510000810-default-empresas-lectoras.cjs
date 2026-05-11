'use strict';

module.exports = {
  up: async (queryInterface) => {
    const seedRows = [
      { nombre: 'Volkswagen', abreviatura: 'VW', orden: 1, activa: true, created_at: new Date(), updated_at: new Date() },
      { nombre: 'Cemex', abreviatura: 'CEMEX', orden: 2, activa: true, created_at: new Date(), updated_at: new Date() },
      { nombre: 'Vitro', abreviatura: 'VITRO', orden: 3, activa: true, created_at: new Date(), updated_at: new Date() },
      { nombre: 'AHMSA', abreviatura: 'AHMSA', orden: 4, activa: true, created_at: new Date(), updated_at: new Date() },
      { nombre: 'Grupo Herdez', abreviatura: 'HERDEZ', orden: 5, activa: true, created_at: new Date(), updated_at: new Date() },
      { nombre: 'Mabe', abreviatura: 'MABE', orden: 6, activa: true, created_at: new Date(), updated_at: new Date() },
      { nombre: 'GRUMA', abreviatura: 'GRUMA', orden: 7, activa: true, created_at: new Date(), updated_at: new Date() },
      { nombre: 'Nemak', abreviatura: 'NEMAK', orden: 8, activa: true, created_at: new Date(), updated_at: new Date() },
    ];

    const existing = await queryInterface.sequelize.query(
      'SELECT nombre FROM empresas_lectoras',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const existingNames = new Set(existing.map((row) => row.nombre));
    const rowsToInsert = seedRows.filter((row) => !existingNames.has(row.nombre));

    if (rowsToInsert.length > 0) {
      await queryInterface.bulkInsert('empresas_lectoras', rowsToInsert);
    }
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('empresas_lectoras', null, {});
  },
};
