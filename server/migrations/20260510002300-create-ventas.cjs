"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("ventas", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      payment_link_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: "payment_links", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      plan_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: "media_kit_planes", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      usuario_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: "usuarios", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      // Snapshot of buyer info at time of purchase
      comprador_email: {
        type: Sequelize.STRING(180),
        allowNull: false,
      },
      comprador_nombre: {
        type: Sequelize.STRING(120),
        allowNull: true,
      },
      comprador_telefono: {
        type: Sequelize.STRING(30),
        allowNull: true,
      },
      monto: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      moneda: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: "MXN",
      },
      // Full EcartPay result payload stored for auditing
      ecartpay_order_id: {
        type: Sequelize.STRING(120),
        allowNull: true,
      },
      ecartpay_payload: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      // 'completed' | 'refunded'
      estado: {
        type: Sequelize.ENUM("completed", "refunded"),
        allowNull: false,
        defaultValue: "completed",
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
    await queryInterface.dropTable("ventas");
  },
};
