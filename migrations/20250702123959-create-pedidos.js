'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('pedidos', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      id_anao: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'anoes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // <-- ALTERADO DE 'SET NULL' PARA 'CASCADE'
      },
      id_cartao: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'cadastro_cartoes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // <-- ALTERADO DE 'SET NULL' PARA 'CASCADE'
      },
      data_inicio: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      data_fim: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('pedidos');
  }
};