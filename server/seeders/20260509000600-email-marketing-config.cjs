"use strict";

const CONFIG_KEYS = [
  // WordPress GraphQL Configuration
  {
    clave: "wordpress_api_url",
    valor: "http://localhost/graphql",
    descripcion: "URL del endpoint GraphQL de WordPress",
  },
  {
    clave: "wordpress_revalidate",
    valor: "60",
    descripcion: "Segundos de caché ISR para posts de WordPress",
  },
  // WordPress REST API Configuration (for CRUD operations)
  {
    clave: "wordpress_rest_api_url",
    valor: "http://localhost/wp-json",
    descripcion: "URL base del REST API de WordPress",
  },
  {
    clave: "wordpress_api_user",
    valor: "admin",
    descripcion: "Usuario con permisos de edición en WordPress",
  },
  {
    clave: "wordpress_api_password",
    valor: "admin",
    descripcion: "Contraseña del usuario de WordPress",
  },
  // Email Marketing Providers
  {
    clave: "email_provider_default",
    valor: "local",
    descripcion: "Proveedor por defecto para marketing: local, mailrelay o mailchimp",
  },
  {
    clave: "mailrelay_enabled",
    valor: "false",
    descripcion: "Activa la integración con Mailrelay",
  },
  {
    clave: "mailrelay_api_url",
    valor: "",
    descripcion: "Endpoint base del API de Mailrelay",
  },
  {
    clave: "mailrelay_api_key",
    valor: "",
    descripcion: "API key de Mailrelay",
  },
  {
    clave: "mailrelay_group_id",
    valor: "",
    descripcion: "Grupo o lista destino en Mailrelay",
  },
  {
    clave: "mailchimp_enabled",
    valor: "false",
    descripcion: "Activa la integración con Mailchimp",
  },
  {
    clave: "mailchimp_api_key",
    valor: "",
    descripcion: "API key de Mailchimp",
  },
  {
    clave: "mailchimp_server_prefix",
    valor: "",
    descripcion: "Prefijo del servidor de Mailchimp, por ejemplo us21",
  },
  {
    clave: "mailchimp_audience_id",
    valor: "",
    descripcion: "Audience ID de Mailchimp",
  },
  {
    clave: "mailchimp_tags_default",
    valor: "",
    descripcion: "Etiquetas por defecto separadas por coma",
  },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    for (const item of CONFIG_KEYS) {
      const [existing] = await queryInterface.sequelize.query(
        "SELECT clave FROM configuraciones WHERE clave = :clave",
        { replacements: { clave: item.clave } }
      );

      if (!existing.length) {
        await queryInterface.bulkInsert("configuraciones", [
          {
            ...item,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ]);
      }
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("configuraciones", {
      clave: CONFIG_KEYS.map((item) => item.clave),
    });
  },
};
