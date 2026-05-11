"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("payment_links", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      token: {
        type: Sequelize.STRING(64),
        allowNull: false,
        unique: true,
      },
      // Optional: linked to a media kit plan
      plan_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: "media_kit_planes", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      // Optional: linked to a registered user
      usuario_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: "usuarios", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      descripcion: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      // Amount and currency (can differ from plan if admin sets a custom amount)
      monto: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      moneda: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: "MXN",
      },
      // JSON items array forwarded to EcartPay
      items: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: "[]",
      },
      estado: {
        type: Sequelize.ENUM("pending", "paid", "expired", "cancelled"),
        allowNull: false,
        defaultValue: "pending",
      },
      // Pre-fill buyer info when creating the link
      comprador_email: {
        type: Sequelize.STRING(180),
        allowNull: true,
      },
      comprador_nombre: {
        type: Sequelize.STRING(120),
        allowNull: true,
      },
      // EcartPay order/transaction IDs received after payment
      ecartpay_order_id: {
        type: Sequelize.STRING(120),
        allowNull: true,
      },
      // Optional expiry date
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("payment_links");
  },
};
