const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

class CadastroCartao extends Model {
  static init(sequelize) {
    super.init({
      num_card: DataTypes.STRING,
      cvv: DataTypes.STRING,
      validade: DataTypes.STRING,
    }, {
      sequelize,
      hooks: {
        beforeSave: async (cartao) => {
          if (cartao.num_card) {
            cartao.num_card = await bcrypt.hash(cartao.num_card, 8);
          }
          if (cartao.cvv) {
            cartao.cvv = await bcrypt.hash(cartao.cvv, 8);
          }
          if (cartao.validade) {
            cartao.validade = await bcrypt.hash(cartao.validade, 8);
          }
        }
      }
    })
  }

  static associate(models) {
    this.belongsTo(models.Usuario, { foreignKey: 'id_user', as: 'usuario' });
    this.hasMany(models.Pedidos, { foreignKey: 'id_cartao', as: 'pedidos' });
  }
}

module.exports = CadastroCartao;