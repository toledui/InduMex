'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('proveedores');

    if (!Object.prototype.hasOwnProperty.call(table, 'usuario_id')) {
      await queryInterface.addColumn('proveedores', 'usuario_id', {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
      });
    }

    const indexes = await queryInterface.showIndex('proveedores');
    const hasUserIdx = indexes.some((idx) => idx.name === 'proveedores_usuario_id_unique');

    if (!hasUserIdx) {
      await queryInterface.addIndex('proveedores', ['usuario_id'], {
        name: 'proveedores_usuario_id_unique',
        unique: true,
      });
    }
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('proveedores', 'proveedores_usuario_id_unique').catch(() => undefined);
    await queryInterface.removeColumn('proveedores', 'usuario_id').catch(() => undefined);
  },
};
