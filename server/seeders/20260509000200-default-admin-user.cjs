'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
  async up(queryInterface) {
    const existing = await queryInterface.sequelize.query(
      "SELECT id FROM usuarios WHERE email = 'contacto@indumex.blog' LIMIT 1",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (existing.length > 0) {
      return;
    }

    const passwordHash = await bcrypt.hash('Chiapas2020', 10);

    await queryInterface.bulkInsert('usuarios', [
      {
        nombre: 'Administrador InduMex',
        email: 'contacto@indumex.blog',
        password_hash: passwordHash,
        rol: 'admin',
        activo: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('usuarios', {
      email: 'contacto@indumex.blog',
    });
  },
};
