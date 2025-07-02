const { Model, DataTypes } = require('sequelize');

class Usuario extends Model {
  static init(sequelize) {
    super.init({
      nome: DataTypes.STRING,
      cliente_ou_utilizador: DataTypes.STRING,
      email: DataTypes.STRING,
      senha: DataTypes.STRING,
      cpf: DataTypes.CHAR(11),
      telefone: DataTypes.STRING,
    }, {
      sequelize,
      tableName: 'usuarios'
    });
  }

  static associate(models) {
    // Associações que permanecem
    this.hasOne(models.Endereco, { foreignKey: 'id_user', as: 'endereco' });
    this.hasMany(models.CadastroCartao, { foreignKey: 'id_user', as: 'cartoes' });

    // REMOVIDA: A associação direta com Pedidos foi removida.
    // A consulta de pedidos de um usuário será feita através dos cartões.
    // this.hasMany(models.Pedidos, { foreignKey: 'id_user', as: 'pedidos' });
  }
}

module.exports = Usuario;