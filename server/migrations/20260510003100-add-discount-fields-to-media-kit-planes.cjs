'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('media_kit_planes', 'precio_descuento', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      after: 'precio'
    });

    await queryInterface.addColumn('media_kit_planes', 'porcentaje_descuento', {
      type: Sequelize.INTEGER,
      allowNull: true,
      after: 'precio_descuento'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('media_kit_planes', 'precio_descuento');
    await queryInterface.removeColumn('media_kit_planes', 'porcentaje_descuento');
  }
};
