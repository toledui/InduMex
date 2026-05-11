'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('usuarios');

    if (!Object.prototype.hasOwnProperty.call(table, 'telefono')) {
      await queryInterface.addColumn('usuarios', 'telefono', {
        type: Sequelize.STRING(40),
        allowNull: true,
      });
    }

    await queryInterface.sequelize.query(
      "ALTER TABLE usuarios MODIFY rol ENUM('admin','editor','cliente') NOT NULL DEFAULT 'editor'"
    );
  },

  down: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('usuarios');

    if (Object.prototype.hasOwnProperty.call(table, 'telefono')) {
      await queryInterface.removeColumn('usuarios', 'telefono');
    }

    await queryInterface.sequelize.query(
      "ALTER TABLE usuarios MODIFY rol ENUM('admin','editor') NOT NULL DEFAULT 'editor'"
    );
  },
};
