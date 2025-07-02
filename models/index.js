// Importa as dependências necessárias
const Sequelize = require('sequelize');
const dbConfig = require('../config/config.json'); // Caminho para seu arquivo de configuração do DB

// Importa todos os seus modelos
const Usuario = require('./usuario');
const Anao = require('./anao');
const Endereco = require('./endereco');
const CadastroCartao = require('./cadastro_cartao');
const Pedidos = require('./pedidos');

// Define qual ambiente de configuração será usado (desenvolvimento, teste ou produção)
const env = process.env.NODE_ENV || 'development';
const config = dbConfig[env];

// Cria a instância de conexão com o banco de dados
const connection = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  // Outras configurações opcionais do Sequelize podem ir aqui
  // Ex: logging: false, define: { timestamps: true }
});

// Inicializa cada modelo, passando a conexão do banco de dados
Usuario.init(connection);
Anao.init(connection);
Endereco.init(connection);
CadastroCartao.init(connection);
Pedidos.init(connection);

// Executa o método 'associate' de cada modelo, se ele existir
// Isso é crucial para criar os relacionamentos (chaves estrangeiras)
Object.values(connection.models)
  .filter(model => typeof model.associate === 'function')
  .forEach(model => model.associate(connection.models));

console.log('Modelos inicializados e associados com sucesso!');

// Exporta a conexão para ser utilizada em outras partes da sua aplicação
module.exports = connection;