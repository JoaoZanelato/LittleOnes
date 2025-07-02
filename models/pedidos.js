const { Model, DataTypes } = require('sequelize');

class Pedidos extends Model {
  static init(sequelize) {
    super.init({
      data_inicio: DataTypes.DATE,
      data_fim: DataTypes.DATE,
    }, {
      sequelize,
      tableName: 'pedidos' // É uma boa prática definir o nome da tabela
    });
  }

  static associate(models) {
    // Associação com Anão permanece
    this.belongsTo(models.Anao, { foreignKey: 'id_anao', as: 'anao' });
    
    // Associação com CadastroCartao permanece
    this.belongsTo(models.CadastroCartao, { foreignKey: 'id_cartao', as: 'cartao' });
    
    // REMOVIDA: A associação direta com Usuario foi removida para cumprir a 3FN.
    // this.belongsTo(models.Usuario, { foreignKey: 'id_user', as: 'usuario' }); 
  }
}

module.exports = Pedidos;