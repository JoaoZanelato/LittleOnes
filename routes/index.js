var express = require('express');
var router = express.Router();
const pool = require('../config/db'); // Importa a conexão com o banco de dados

// Página inicial
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Página Inicial' });
});

// Página de cadastro
router.get('/cadastro', function(req, res) {
  res.render('cadastro', { title: 'Cadastro' });
});

// Página de login
router.get('/login', function(req, res) {
  res.render('login', { title: 'Login' });
});

// Página principal após login
router.get('/pagina', function(req, res) {
  res.render('pagina', { title: 'Página Principal' });
});

// Rota do Dashboard com SQL puro
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