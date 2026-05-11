"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Remove duplicates by plan name, keeping the oldest row (lowest id).
    await queryInterface.sequelize.query(`
      DELETE t1
      FROM media_kit_planes t1
      INNER JOIN media_kit_planes t2
        ON t1.nombre = t2.nombre
       AND t1.id > t2.id
    `);

    // Add a unique index to prevent duplicate plan names in future inserts.
    await queryInterface.addIndex("media_kit_planes", ["nombre"], {
      name: "uq_media_kit_planes_nombre",
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("media_kit_planes", "uq_media_kit_planes_nombre");
  },
};
