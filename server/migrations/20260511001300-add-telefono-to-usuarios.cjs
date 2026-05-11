'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('usuarios');

    if (!Object.prototype.hasOwnProperty.call(table, 'telefono')) {
      await queryInterface.addColumn('usuarios', 'telefono', {
        type: Sequelize.STRING(40),
        allowNull: true,
        after: 'apellido',
      });
    }
  },

  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('usuarios');

    if (Object.prototype.hasOwnProperty.call(table, 'telefono')) {
      await queryInterface.removeColumn('usuarios', 'telefono');
    }
  },
};
