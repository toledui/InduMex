'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('proveedores');

    if (!Object.prototype.hasOwnProperty.call(table, 'social_networks')) {
      await queryInterface.addColumn('proveedores', 'social_networks', {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
      });
    }

    await queryInterface.sequelize.query(`
      UPDATE proveedores
      SET social_networks = JSON_ARRAY()
      WHERE social_networks IS NULL
    `).catch(() => undefined);
  },

  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('proveedores');

    if (Object.prototype.hasOwnProperty.call(table, 'social_networks')) {
      await queryInterface.removeColumn('proveedores', 'social_networks');
    }
  },
};
