'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('proveedores')) {
      return;
    }

    await queryInterface.createTable('proveedores', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(180),
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING(180),
        allowNull: false,
        unique: true,
      },
      logo: {
        type: Sequelize.STRING(500),
        allowNull: false,
        defaultValue: '',
      },
      tier: {
        type: Sequelize.ENUM('premium', 'verified', 'basic'),
        allowNull: false,
        defaultValue: 'basic',
      },
      shortDescription: {
        type: Sequelize.STRING(280),
        allowNull: false,
        defaultValue: '',
      },
      about: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      sectors: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      certifications: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      city: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      state: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      country: {
        type: Sequelize.STRING(120),
        allowNull: false,
        defaultValue: 'México',
      },
      website: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(180),
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING(40),
        allowNull: false,
      },
      whatsapp: {
        type: Sequelize.STRING(40),
        allowNull: false,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('proveedores', ['slug']);
    await queryInterface.addIndex('proveedores', ['tier']);
    await queryInterface.addIndex('proveedores', ['isActive']);
    await queryInterface.addIndex('proveedores', ['tier', 'isActive']);
  },

  down: async (queryInterface) => {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('proveedores')) {
      await queryInterface.dropTable('proveedores');
    }
  },
};
