var express = require('express');
var router = express.Router();
const pool = require('../config/db'); // Importa a conexão com o banco de dados
const bcrypt = require('bcryptjs'); // Importa a biblioteca para criptografia

// Página inicial (que já é a de cadastro/login)
router.get('/', function(req, res, next) {
  res.render('cadastro', { error: null }); // Renderiza a página principal
});

// Rota para processar o formulário de cadastro com senha criptografada
router.post('/cadastro', async function(req, res) {
  const { nome, cliente_ou_utilizador, email, senha, cpf, telefone } = req.body;

  try {
    // Gera um "sal" e cria o hash da senha
    const salt = await bcrypt.genSalt(10);
    const hashSenha = await bcrypt.hash(senha, salt);

    const sql = "INSERT INTO usuarios (nome, cliente_ou_utilizador, email, senha, cpf, telefone, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())";

    // Salva o hash da senha no banco de dados, e não a senha original
    await pool.query(sql, [nome, cliente_ou_utilizador, email, hashSenha, cpf, telefone]);

    // Redireciona para a página principal para que o usuário possa fazer login
    res.redirect('/');
  } catch (error) {
    console.error("Erro no cadastro:", error);
    res.render('error', { message: 'Erro ao realizar o cadastro', error });
  }
});

// Rota para processar o formulário de login com verificação de senha criptografada
router.post('/login', async function(req, res) {
  const { email, senha } = req.body;

  try {
    const sql = "SELECT * FROM usuarios WHERE email = ?";
    const [rows] = await pool.query(sql, [email]);

    if (rows.length > 0) {
      const usuario = rows[0];

      // Compara a senha fornecida com o hash salvo no banco de dados
      const match = await bcrypt.compare(senha, usuario.senha);

      if (match) {
        // A senha corresponde! Redireciona para o dashboard.
        // Aqui você pode implementar a lógica de sessão, ex: com express-session
        // req.session.usuario = usuario;
        res.redirect('/dashboard');
      } else {
        // A senha está incorreta
        res.render('cadastro', { error: 'Email ou senha inválidos' });
      }
    } else {
      // O usuário não foi encontrado
      res.render('cadastro', { error: 'Email ou senha inválidos' });
    }
  } catch (error) {
    console.error("Erro no login:", error);
    res.render('error', { message: 'Erro ao realizar o login', error });
  }
});

// Rota do Dashboard
router.get('/dashboard', async function(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM anoes'); // Executa a consulta SQL
    res.render('dashboard', { title: 'Dashboard', anoes: rows }); // Passa os resultados para a view
  } catch (error) {
    console.error("Erro ao buscar anões:", error);
    res.render('error', { message: 'Erro ao carregar os dados do dashboard', error: error });
  }
});

router.get('/perfil', (req, res, next) =>{
  res.render('perfil')
})

router.post('/perfil', (req, res, next) =>{

})

module.exports = router;