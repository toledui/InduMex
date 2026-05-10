'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const entries = [
      {
        clave: 'contact_notification_emails',
        valor: 'contacto@indumex.blog',
        descripcion: 'Correos separados por coma que reciben notificaciones del formulario de contacto',
        created_at: new Date(),
        updated_at: new Date(),
      }
    ];

    for (const entry of entries) {
      const [existing] = await queryInterface.sequelize.query(
        `SELECT clave FROM configuraciones WHERE clave = '${entry.clave}'`
      );
      if (existing.length === 0) {
        await queryInterface.bulkInsert('configuraciones', [entry], {});
      }
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('configuraciones', {
      clave: ['contact_notification_emails'],
    });
  },
};
