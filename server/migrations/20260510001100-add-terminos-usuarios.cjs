'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('usuarios');

    if (!Object.prototype.hasOwnProperty.call(table, 'acepta_terminos')) {
      await queryInterface.addColumn('usuarios', 'acepta_terminos', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }

    if (!Object.prototype.hasOwnProperty.call(table, 'acepta_terminos_at')) {
      await queryInterface.addColumn('usuarios', 'acepta_terminos_at', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('usuarios');

    if (Object.prototype.hasOwnProperty.call(table, 'acepta_terminos_at')) {
      await queryInterface.removeColumn('usuarios', 'acepta_terminos_at');
    }

    if (Object.prototype.hasOwnProperty.call(table, 'acepta_terminos')) {
      await queryInterface.removeColumn('usuarios', 'acepta_terminos');
    }
  },
};
