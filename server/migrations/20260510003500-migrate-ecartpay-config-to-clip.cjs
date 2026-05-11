"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      INSERT INTO configuraciones (clave, valor, descripcion, created_at, updated_at)
      SELECT 'clip_api_key', COALESCE((SELECT valor FROM configuraciones WHERE clave = 'ecartpay_public_id' LIMIT 1), ''),
             'Clip API Key (para autenticación Basic)', NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM configuraciones WHERE clave = 'clip_api_key');
    `);

    await queryInterface.sequelize.query(`
      INSERT INTO configuraciones (clave, valor, descripcion, created_at, updated_at)
      SELECT 'clip_secret_key', COALESCE((SELECT valor FROM configuraciones WHERE clave = 'ecartpay_secret_key' LIMIT 1), ''),
             'Clip Secret Key (solo backend)', NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM configuraciones WHERE clave = 'clip_secret_key');
    `);

    await queryInterface.sequelize.query(`
      INSERT INTO configuraciones (clave, valor, descripcion, created_at, updated_at)
      SELECT 'clip_sandbox', COALESCE((SELECT valor FROM configuraciones WHERE clave = 'ecartpay_sandbox' LIMIT 1), 'true'),
             'Modo sandbox de Clip: true = testing, false = producción', NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM configuraciones WHERE clave = 'clip_sandbox');
    `);

    await queryInterface.sequelize.query(`
      INSERT INTO configuraciones (clave, valor, descripcion, created_at, updated_at)
      SELECT 'clip_webhook_secret', COALESCE((SELECT valor FROM configuraciones WHERE clave = 'ecartpay_webhook_secret' LIMIT 1), ''),
             'Secret opcional para validar webhooks de Clip', NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM configuraciones WHERE clave = 'clip_webhook_secret');
    `);
  },

  async down() {
    // Non-destructive rollback: keep Clip configuration values to avoid credential loss.
    return;
  },
};
