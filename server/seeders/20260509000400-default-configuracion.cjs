"use strict";

const DEFAULT_CONFIGS = [
  {
    clave: "wordpress_api_url",
    valor: "",
    descripcion: "URL del endpoint GraphQL de WordPress (headless CMS)",
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    clave: "wordpress_revalidate",
    valor: "60",
    descripcion: "Segundos de caché para peticiones a WordPress (ISR)",
    created_at: new Date(),
    updated_at: new Date(),
  },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    for (const config of DEFAULT_CONFIGS) {
      const [existing] = await queryInterface.sequelize.query(
        "SELECT clave FROM configuraciones WHERE clave = :clave",
        { replacements: { clave: config.clave } }
      );
      if (!existing.length) {
        await queryInterface.bulkInsert("configuraciones", [config]);
      }
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("configuraciones", {
      clave: DEFAULT_CONFIGS.map((c) => c.clave),
    });
  },
};
