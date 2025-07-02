var express = require('express');
var router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// Rota para a página inicial (cadastro/login)
router.get('/', function(req, res, next) {
  res.render('cadastro', { error: null });
});

// Rota para processar o cadastro de usuários
router.post('/cadastro', async function(req, res) {
  const { nome, cliente_ou_utilizador, email, senha, cpf, telefone } = req.body;

  try {
    const salt = await bcrypt.genSalt(10);
    const hashSenha = await bcrypt.hash(senha, salt);

    const sql = "INSERT INTO usuarios (nome, cliente_ou_utilizador, email, senha, cpf, telefone, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())";
    const [result] = await pool.query(sql, [nome, cliente_ou_utilizador, email, hashSenha, cpf, telefone]);

    // Se o usuário for um "utilizador", cria também um registro na tabela 'anoes'
    if (cliente_ou_utilizador === 'utilizador') {
      const anaoSql = "INSERT INTO anoes (id, nome, tipo, status, created_at, updated_at) VALUES (?, ?, 'não definido', 'inativo', NOW(), NOW())";
      await pool.query(anaoSql, [result.insertId, nome]);
    }

    res.redirect('/');
  } catch (error) {
    console.error("Erro no cadastro:", error);
    res.render('error', { message: 'Erro ao realizar o cadastro', error });
  }
});

// Rota para processar o login
router.post('/login', async function(req, res) {
  const { email, senha } = req.body;

  try {
    const sql = "SELECT * FROM usuarios WHERE email = ?";
    const [rows] = await pool.query(sql, [email]);

    if (rows.length > 0) {
      const usuario = rows[0];
      const match = await bcrypt.compare(senha, usuario.senha);

      if (match) {
        req.session.usuario = usuario; // Salva o usuário na sessão
        if (usuario.cliente_ou_utilizador === 'utilizador') {
          res.redirect('/dashboard-utilizador');
        } else {
          res.redirect('/dashboard-comprador');
        }
      } else {
        res.render('cadastro', { error: 'Email ou senha inválidos' });
      }
    } else {
      res.render('cadastro', { error: 'Email ou senha inválidos' });
    }
  } catch (error) {
    console.error("Erro no login:", error);
    res.render('error', { message: 'Erro ao realizar o login', error });
  }
});

// Rota do Dashboard para Compradores
router.get('/dashboard-comprador', async function(req, res) {
    if (!req.session.usuario || req.session.usuario.cliente_ou_utilizador !== 'comprador') {
        return res.redirect('/');
    }
    try {
        const [rows] = await pool.query("SELECT * FROM anoes WHERE status = 'ativo'");
        res.render('dashboard_comprador', {
            title: 'Dashboard do Comprador',
            anoes: rows,
            usuario: req.session.usuario
        });
    } catch (error) {
        console.error("Erro ao buscar anões:", error);
        res.render('error', { message: 'Erro ao carregar o dashboard', error });
    }
});

// Rota do Dashboard para Utilizadores (Anões)
router.get('/dashboard-utilizador', function(req, res) {
    if (!req.session.usuario || req.session.usuario.cliente_ou_utilizador !== 'utilizador') {
        return res.redirect('/');
    }
    res.render('dashboard_utilizador', {
        title: 'Dashboard do Utilizador',
        usuario: req.session.usuario
    });
});


// Rota para EXIBIR o perfil do anão para edição
router.get('/perfil', async (req, res) => {
    if (!req.session.usuario || req.session.usuario.cliente_ou_utilizador !== 'utilizador') {
        return res.redirect('/');
    }

    try {
        const [rows] = await pool.query('SELECT * FROM anoes WHERE id = ?', [req.session.usuario.id]);
        if (rows.length > 0) {
            res.render('perfil', { anao: rows[0], usuario: req.session.usuario });
        } else {
            res.render('error', { message: 'Perfil não encontrado.' });
        }
    } catch (error) {
        res.render('error', { message: 'Erro ao buscar perfil', error });
    }
});

// Rota para ATUALIZAR o perfil do anão
router.post('/perfil', async (req, res) => {
    if (!req.session.usuario || req.session.usuario.cliente_ou_utilizador !== 'utilizador') {
        return res.redirect('/');
    }

    const { nome, descricao, idade, altura, peso, url_foto, status } = req.body;
    const id_usuario = req.session.usuario.id;

    try {
        const sql = `
            UPDATE anoes 
            SET nome = ?, descricao = ?, idade = ?, altura = ?, peso = ?, \`url-foto\` = ?, status = ?, updated_at = NOW()
            WHERE id = ?
        `;
        await pool.query(sql, [nome, descricao, idade, altura, peso, url_foto, status, id_usuario]);
        res.redirect('/perfil');
    } catch (error) {
        res.render('error', { message: 'Erro ao atualizar o perfil', error });
    }
});

// Rota de Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});


module.exports = router;