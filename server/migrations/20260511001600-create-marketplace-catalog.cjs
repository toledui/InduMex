'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('marketplace_categorias', {
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
      nombre: {
        type: Sequelize.STRING(140),
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING(180),
        allowNull: false,
      },
      descripcion: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      activa: {
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

    await queryInterface.createTable('marketplace_productos', {
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
      categoria_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'marketplace_categorias',
          key: 'id',
        },
        onDelete: 'RESTRICT',
      },
      sku: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      nombre: {
        type: Sequelize.STRING(180),
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING(220),
        allowNull: false,
      },
      descripcion: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      precio: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      moneda: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'MXN',
      },
      stock: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      destacado: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      estado: {
        type: Sequelize.ENUM('borrador', 'publicado', 'archivado'),
        allowNull: false,
        defaultValue: 'borrador',
      },
      imagenes: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {},
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

    await queryInterface.createTable('marketplace_producto_campos_personalizados', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER.UNSIGNED,
      },
      producto_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'marketplace_productos',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      clave: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      valor: {
        type: Sequelize.TEXT,
        allowNull: false,
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

    await queryInterface.addIndex('marketplace_categorias', ['usuario_id']);
    await queryInterface.addIndex('marketplace_categorias', ['usuario_id', 'slug'], { unique: true });

    await queryInterface.addIndex('marketplace_productos', ['usuario_id']);
    await queryInterface.addIndex('marketplace_productos', ['categoria_id']);
    await queryInterface.addIndex('marketplace_productos', ['estado']);
    await queryInterface.addIndex('marketplace_productos', ['usuario_id', 'sku'], { unique: true });
    await queryInterface.addIndex('marketplace_productos', ['usuario_id', 'slug'], { unique: true });

    await queryInterface.addIndex('marketplace_producto_campos_personalizados', ['producto_id']);
    await queryInterface.addIndex('marketplace_producto_campos_personalizados', ['producto_id', 'clave']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('marketplace_producto_campos_personalizados');
    await queryInterface.dropTable('marketplace_productos');
    await queryInterface.dropTable('marketplace_categorias');
  },
};
