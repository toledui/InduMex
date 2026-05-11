"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("payment_links", "ecartpay_checkout_id", {
      type: Sequelize.STRING(120),
      allowNull: true,
      after: "ecartpay_order_id",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("payment_links", "ecartpay_checkout_id");
  },
};
