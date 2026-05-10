'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('suscriptores', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      nombre: {
        type: Sequelize.STRING(140),
        allowNull: true,
      },
      telefono: {
        type: Sequelize.STRING(40),
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING(180),
        allowNull: false,
        unique: true,
      },
      empresa: {
        type: Sequelize.STRING(160),
        allowNull: true,
      },
      cargo: {
        type: Sequelize.STRING(120),
        allowNull: true,
      },
      origen: {
        type: Sequelize.STRING(120),
        allowNull: false,
        defaultValue: 'newsletter_footer',
      },
      estatus: {
        type: Sequelize.ENUM('activo', 'baja', 'rebotado'),
        allowNull: false,
        defaultValue: 'activo',
      },
      proveedor_preferido: {
        type: Sequelize.ENUM('local', 'mailrelay', 'mailchimp'),
        allowNull: false,
        defaultValue: 'local',
      },
      sync_mailrelay: {
        type: Sequelize.ENUM('pendiente', 'sincronizado', 'error', 'omitido'),
        allowNull: false,
        defaultValue: 'pendiente',
      },
      sync_mailchimp: {
        type: Sequelize.ENUM('pendiente', 'sincronizado', 'error', 'omitido'),
        allowNull: false,
        defaultValue: 'pendiente',
      },
      notas: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('suscriptores');
  },
};
