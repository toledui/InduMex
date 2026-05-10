'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('anuncios', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      titulo: {
        type: Sequelize.STRING(200),
        allowNull: false,
        comment: 'Titular del anuncio',
      },
      descripcion: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Cuerpo descriptivo del anuncio',
      },
      cta_texto: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: 'Ver más',
        comment: 'Texto del botón de llamada a la acción',
      },
      cta_url: {
        type: Sequelize.STRING(500),
        allowNull: false,
        comment: 'URL de destino al hacer clic',
      },
      imagen_url: {
        type: Sequelize.STRING(1000),
        allowNull: true,
        comment: 'URL de la imagen del anuncio',
      },
      zona: {
        type: Sequelize.ENUM('hero-slider', 'editorial-grid', 'post-in-content', 'post-sidebar'),
        allowNull: false,
        comment: 'Zona del sitio donde aparece el anuncio',
      },
      activo: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Si el anuncio está activo o no',
      },
      orden: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Orden de aparición dentro de la zona',
      },
      metrica: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Métrica destacada (ej: OEE +18%, Entrega 72h)',
      },
      sector: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Sector o etiqueta del anuncio (ej: Maquinaria CNC)',
      },
      acento: {
        type: Sequelize.STRING(7),
        allowNull: true,
        defaultValue: '#F58634',
        comment: 'Color de acento en hex para personalizar el anuncio',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('anuncios', ['zona']);
    await queryInterface.addIndex('anuncios', ['activo']);
    await queryInterface.addIndex('anuncios', ['zona', 'activo', 'orden']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('anuncios');
  },
};
