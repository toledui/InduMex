'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('proveedor_suscripcion_plans');

    if (!Object.prototype.hasOwnProperty.call(table, 'periodicidad')) {
      await queryInterface.addColumn('proveedor_suscripcion_plans', 'periodicidad', {
        type: Sequelize.ENUM('mensual', 'bimestral', 'trimestral', 'semestral', 'anual'),
        allowNull: false,
        defaultValue: 'mensual',
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('proveedor_suscripcion_plans');

    if (Object.prototype.hasOwnProperty.call(table, 'periodicidad')) {
      await queryInterface.removeColumn('proveedor_suscripcion_plans', 'periodicidad');
    }
  },
};
