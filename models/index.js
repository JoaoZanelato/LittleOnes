var express = require('express');
var router = express.Router();
const { Anao } = require('../models'); // Importe o seu modelo Anao

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

// Página de erro (opcional, normalmente usada para tratamento de erros)
router.get('/erro', function(req, res) {
  res.render('error', { message: 'Erro personalizado', error: {} });
});

// Rota do Dashboard atualizada
router.get('/dashboard', async function(req, res) {
  try {
    const anoes = await Anao.findAll(); // Vai buscar todos os anões da base de dados
    res.render('dashboard', { title: 'Dashboard', anoes: anoes }); // Passa os anões para a vista
  } catch (error) {
    console.error("Erro ao buscar anões:", error);
    res.render('error', { message: 'Erro ao carregar os dados do dashboard', error: error });
  }
});

router.get('/perfil', (req, res, next) =>{
  res.rener('perfil')
})

router.post('/perfil', (req, res, next) =>{

})

module.exports = router;