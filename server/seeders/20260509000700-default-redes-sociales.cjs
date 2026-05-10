'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('redes_sociales', [
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
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('redes_sociales', null, {});
  },
};
