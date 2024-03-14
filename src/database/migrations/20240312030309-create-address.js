'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('address', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      user_id: {
        allowNull: true,
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      provinsi: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      kota: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      kecamatan: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      kode_pos: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      alamat: {
        allowNull: false,
        type: Sequelize.TEXT,
      },
      coordinate: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('address');
  },
};
