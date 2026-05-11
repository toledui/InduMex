"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // EcartPay credentials are stored as rows in configuraciones (key-value pattern)
    // No schema change needed — just document what keys will be used.
    // This migration is a no-op placeholder so the seeder can reference it.
  },

  async down(_queryInterface) {
    // Nothing to revert
  },
};
