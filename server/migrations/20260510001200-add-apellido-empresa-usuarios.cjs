'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('usuarios');

    if (!Object.prototype.hasOwnProperty.call(table, 'apellido')) {
      await queryInterface.addColumn('usuarios', 'apellido', {
        type: Sequelize.STRING(120),
        allowNull: true,
      });
    }

    if (!Object.prototype.hasOwnProperty.call(table, 'empresa')) {
      await queryInterface.addColumn('usuarios', 'empresa', {
        type: Sequelize.STRING(160),
        allowNull: true,
      });
    }
  },

  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('usuarios');

    if (Object.prototype.hasOwnProperty.call(table, 'empresa')) {
      await queryInterface.removeColumn('usuarios', 'empresa');
    }

    if (Object.prototype.hasOwnProperty.call(table, 'apellido')) {
      await queryInterface.removeColumn('usuarios', 'apellido');
    }
  },
};
