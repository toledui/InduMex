'use strict';

async function addColumnIfMissing(queryInterface, tableName, columnName, definition) {
  const table = await queryInterface.describeTable(tableName);
  if (!Object.prototype.hasOwnProperty.call(table, columnName)) {
    await queryInterface.addColumn(tableName, columnName, definition);
  }
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableExists = await queryInterface
      .showAllTables()
      .then((tables) => tables.includes('proveedores'));

    if (!tableExists) {
      throw new Error('La tabla proveedores no existe. Ejecuta primero la migración de creación.');
    }

    await addColumnIfMissing(queryInterface, 'proveedores', 'name', {
      type: Sequelize.STRING(180),
      allowNull: true,
    });
    await addColumnIfMissing(queryInterface, 'proveedores', 'slug', {
      type: Sequelize.STRING(180),
      allowNull: true,
    });
    await addColumnIfMissing(queryInterface, 'proveedores', 'logo', {
      type: Sequelize.STRING(500),
      allowNull: true,
      defaultValue: '',
    });
    await addColumnIfMissing(queryInterface, 'proveedores', 'tier', {
      type: Sequelize.ENUM('premium', 'verified', 'basic'),
      allowNull: true,
      defaultValue: 'basic',
    });
    await addColumnIfMissing(queryInterface, 'proveedores', 'shortDescription', {
      type: Sequelize.STRING(280),
      allowNull: true,
      defaultValue: '',
    });
    await addColumnIfMissing(queryInterface, 'proveedores', 'about', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await addColumnIfMissing(queryInterface, 'proveedores', 'sectors', {
      type: Sequelize.JSON,
      allowNull: true,
    });
    await addColumnIfMissing(queryInterface, 'proveedores', 'certifications', {
      type: Sequelize.JSON,
      allowNull: true,
    });
    await addColumnIfMissing(queryInterface, 'proveedores', 'city', {
      type: Sequelize.STRING(120),
      allowNull: true,
    });
    await addColumnIfMissing(queryInterface, 'proveedores', 'state', {
      type: Sequelize.STRING(120),
      allowNull: true,
    });
    await addColumnIfMissing(queryInterface, 'proveedores', 'country', {
      type: Sequelize.STRING(120),
      allowNull: true,
      defaultValue: 'México',
    });
    await addColumnIfMissing(queryInterface, 'proveedores', 'website', {
      type: Sequelize.STRING(500),
      allowNull: true,
    });
    await addColumnIfMissing(queryInterface, 'proveedores', 'phone', {
      type: Sequelize.STRING(40),
      allowNull: true,
    });
    await addColumnIfMissing(queryInterface, 'proveedores', 'whatsapp', {
      type: Sequelize.STRING(40),
      allowNull: true,
    });
    await addColumnIfMissing(queryInterface, 'proveedores', 'isActive', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    });

    const providerTable = await queryInterface.describeTable('proveedores');
    const hasNombre = Object.prototype.hasOwnProperty.call(providerTable, 'nombre');
    const hasEmpresa = Object.prototype.hasOwnProperty.call(providerTable, 'empresa');
    const hasSector = Object.prototype.hasOwnProperty.call(providerTable, 'sector');

    const nombreExpr = hasNombre ? "NULLIF(nombre, '')" : 'NULL';
    const empresaExpr = hasEmpresa ? "NULLIF(empresa, '')" : 'NULL';
    const sectorExpr = hasSector ? "NULLIF(sector, '')" : 'NULL';

    await queryInterface.sequelize.query(`
      UPDATE proveedores
      SET
        name = COALESCE(NULLIF(name, ''), ${nombreExpr}, ${empresaExpr}, CONCAT('Proveedor ', id)),
        slug = COALESCE(NULLIF(slug, ''), CONCAT(LOWER(REPLACE(COALESCE(${nombreExpr}, ${empresaExpr}, CONCAT('proveedor-', id)), ' ', '-')), '-', id)),
        logo = COALESCE(NULLIF(logo, ''), UPPER(LEFT(COALESCE(${nombreExpr}, ${empresaExpr}, 'PR'), 2))),
        tier = COALESCE(NULLIF(tier, ''), 'basic'),
        shortDescription = COALESCE(NULLIF(shortDescription, ''), CONCAT('Proveedor industrial especializado en ', COALESCE(${sectorExpr}, 'soluciones B2B'))),
        about = COALESCE(NULLIF(about, ''), CONCAT('Proveedor industrial especializado en ', COALESCE(${sectorExpr}, 'soluciones B2B'), '.')),
        sectors = COALESCE(sectors, JSON_ARRAY(COALESCE(${sectorExpr}, 'Industrial'))),
        certifications = COALESCE(certifications, JSON_ARRAY()),
        city = COALESCE(NULLIF(city, ''), 'México'),
        state = COALESCE(NULLIF(state, ''), 'México'),
        country = COALESCE(NULLIF(country, ''), 'México'),
        website = COALESCE(NULLIF(website, ''), 'https://indumex.blog'),
        phone = COALESCE(NULLIF(phone, ''), '+52 000 000 0000'),
        whatsapp = COALESCE(NULLIF(whatsapp, ''), '+52 000 000 0000'),
        isActive = COALESCE(isActive, 1)
    `);

    const existingIndexes = await queryInterface.showIndex('proveedores');
    const hasSlugIndex = existingIndexes.some((index) => index.name === 'proveedores_slug' || index.columnName === 'slug');
    if (!hasSlugIndex) {
      await queryInterface.addIndex('proveedores', ['slug'], { unique: true, name: 'proveedores_slug' });
    }

    const hasTierIndex = existingIndexes.some((index) => index.name === 'proveedores_tier');
    if (!hasTierIndex) {
      await queryInterface.addIndex('proveedores', ['tier'], { name: 'proveedores_tier' });
    }

    const hasActiveIndex = existingIndexes.some((index) => index.name === 'proveedores_isActive');
    if (!hasActiveIndex) {
      await queryInterface.addIndex('proveedores', ['isActive'], { name: 'proveedores_isActive' });
    }
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('proveedores', 'proveedores_isActive').catch(() => {});
    await queryInterface.removeIndex('proveedores', 'proveedores_tier').catch(() => {});
    await queryInterface.removeIndex('proveedores', 'proveedores_slug').catch(() => {});
  },
};
