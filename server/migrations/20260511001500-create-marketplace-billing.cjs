'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('marketplace_planes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER.UNSIGNED,
      },
      nombre: {
        type: Sequelize.STRING(120),
        allowNull: false,
        unique: true,
      },
      descripcion: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      precio: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      moneda: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'MXN',
      },
      periodicidad: {
        type: Sequelize.ENUM('mensual', 'bimestral', 'trimestral', 'semestral', 'anual'),
        allowNull: false,
        defaultValue: 'mensual',
      },
      caracteristicas: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
      },
      max_productos: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 20,
      },
      max_productos_destacados: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      nivel_visibilidad: {
        type: Sequelize.ENUM('base', 'media', 'alta'),
        allowNull: false,
        defaultValue: 'base',
      },
      activo: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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

    await queryInterface.createTable('marketplace_suscripciones', {
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
          model: 'marketplace_planes',
          key: 'id',
        },
        onDelete: 'RESTRICT',
      },
      estado: {
        type: Sequelize.ENUM('activa', 'pausada', 'cancelada', 'vencida'),
        allowNull: false,
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
        allowNull: false,
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

    await queryInterface.createTable('marketplace_perfiles', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER.UNSIGNED,
      },
      usuario_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        unique: true,
        references: {
          model: 'usuarios',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      habilitado: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      max_productos_override: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
      },
      vigencia_hasta: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      notas_admin: {
        type: Sequelize.TEXT,
        allowNull: true,
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

    await queryInterface.addIndex('marketplace_suscripciones', ['usuario_id']);
    await queryInterface.addIndex('marketplace_suscripciones', ['plan_id']);
    await queryInterface.addIndex('marketplace_suscripciones', ['estado']);
    await queryInterface.addIndex('marketplace_suscripciones', ['fecha_vencimiento']);
    await queryInterface.addIndex('marketplace_perfiles', ['usuario_id']);
    await queryInterface.addIndex('marketplace_perfiles', ['habilitado']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('marketplace_perfiles');
    await queryInterface.dropTable('marketplace_suscripciones');
    await queryInterface.dropTable('marketplace_planes');
  },
};
