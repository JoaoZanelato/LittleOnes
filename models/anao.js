const { Model, DataTypes } = require('sequelize');

class Anao extends Model {
  static init(sequelize) {
    super.init({
      tipo: DataTypes.STRING,
      altura: DataTypes.FLOAT,
      idade: DataTypes.INTEGER,
      peso: DataTypes.FLOAT,
      nome: DataTypes.STRING,
      'url-foto': DataTypes.STRING,
      status: DataTypes.STRING,
      // --- LINHA ADICIONADA ---
      descricao: DataTypes.TEXT, // Usando TEXT para descrições mais longas
    }, {
      sequelize,
      tableName: 'anoes'
    })
  }

  static associate(models) {
    this.hasMany(models.Pedidos, { foreignKey: 'id_anao', as: 'pedidos' });
  }
}

module.exports = Anao;