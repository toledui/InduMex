"use strict";

const CLIP_CONFIGS = [
  {
    clave: "clip_api_key",
    valor: process.env.CLIP_API_KEY || "",
    descripcion: "Clip API Key (para autenticación Basic)",
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    clave: "clip_secret_key",
    valor: process.env.CLIP_SECRET_KEY || "",
    descripcion: "Clip Secret Key (solo backend)",
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    clave: "clip_sandbox",
    valor: "true",
    descripcion: "Modo sandbox de Clip: true = testing, false = producción",
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    clave: "clip_webhook_secret",
    valor: "",
    descripcion: "Secret opcional para validar webhooks de Clip",
    created_at: new Date(),
    updated_at: new Date(),
  },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    for (const config of CLIP_CONFIGS) {
      const isSensitiveCredential =
        config.clave === "clip_api_key" || config.clave === "clip_secret_key";

      // Never auto-create empty sensitive credentials.
      if (isSensitiveCredential && !String(config.valor || "").trim()) {
        continue;
      }

      const [existing] = await queryInterface.sequelize.query(
        "SELECT clave FROM configuraciones WHERE clave = :clave",
        { replacements: { clave: config.clave } }
      );
      if (!existing.length) {
        await queryInterface.bulkInsert("configuraciones", [config]);
      }
    }
  },

  async down() {
    // Protect runtime credentials and operational settings from accidental deletion.
    // This seeder is intentionally non-destructive on rollback.
    return;
  },
};
