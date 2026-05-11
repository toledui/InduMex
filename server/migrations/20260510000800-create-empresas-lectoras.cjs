'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('empresas_lectoras', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      nombre: {
        type: Sequelize.STRING(120),
        allowNull: false,
        unique: true,
        comment: 'Nombre de la empresa',
      },
      abreviatura: {
        type: Sequelize.STRING(40),
        allowNull: false,
        comment: 'Texto corto mostrado en el carrusel',
      },
      orden: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Orden de aparición',
      },
      activa: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Control de visibilidad en frontend',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('empresas_lectoras', ['activa']);
    await queryInterface.addIndex('empresas_lectoras', ['orden']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('empresas_lectoras');
  },
};
