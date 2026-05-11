'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('proveedor_suscripciones', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER.UNSIGNED,
      },
      usuario_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'usuarios',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      plan_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'proveedor_suscripcion_plans',
          key: 'id',
        },
        onDelete: 'RESTRICT',
      },
      estado: {
        type: Sequelize.ENUM('activa', 'pausada', 'cancelada', 'vencida'),
        defaultValue: 'activa',
      },
      fecha_inicio: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      fecha_vencimiento: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      proximo_link_pago_generado_en: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      ultimo_link_pago_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'payment_links',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      periodo_gracia_vencimiento_en: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      notificaciones_pendientes: {
        type: Sequelize.JSON,
        defaultValue: [],
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    // Índices para queries frecuentes
    await queryInterface.addIndex('proveedor_suscripciones', ['usuario_id']);
    await queryInterface.addIndex('proveedor_suscripciones', ['plan_id']);
    await queryInterface.addIndex('proveedor_suscripciones', ['estado']);
    await queryInterface.addIndex('proveedor_suscripciones', ['fecha_vencimiento']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('proveedor_suscripciones');
  },
};
