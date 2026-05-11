'use strict';

module.exports = {
  up: async (queryInterface) => {
    // Anuncios: conservar el ID más bajo por zona + titulo
    await queryInterface.sequelize.query(`
      DELETE a1
      FROM anuncios a1
      INNER JOIN anuncios a2
        ON a1.id > a2.id
       AND a1.zona = a2.zona
       AND a1.titulo = a2.titulo
    `);

    // Redes sociales: conservar el ID más bajo por nombre
    await queryInterface.sequelize.query(`
      DELETE r1
      FROM redes_sociales r1
      INNER JOIN redes_sociales r2
        ON r1.id > r2.id
       AND r1.nombre = r2.nombre
    `);

    // Empresas lectoras: conservar el ID más bajo por nombre
    await queryInterface.sequelize.query(`
      DELETE e1
      FROM empresas_lectoras e1
      INNER JOIN empresas_lectoras e2
        ON e1.id > e2.id
       AND e1.nombre = e2.nombre
    `);
  },

  down: async () => {
    // Sin rollback: eliminación de duplicados es irreversible por diseño.
  },
};
