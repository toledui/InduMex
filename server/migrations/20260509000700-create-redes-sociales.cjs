'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('redes_sociales', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      nombre: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Nombre de la red social (Twitter, LinkedIn, Facebook, etc.)',
      },
      url: {
        type: Sequelize.STRING(500),
        allowNull: false,
        comment: 'URL del perfil o página de la red social',
      },
      icono: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Nombre del icono (lucide-react icon name)',
      },
      orden: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Orden de visualización en el footer',
      },
      activa: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Si la red social está activa o no',
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

    // Crear índice en nombre para búsquedas rápidas
    await queryInterface.addIndex('redes_sociales', ['nombre']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('redes_sociales');
  },
};
