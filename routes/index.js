var express = require('express');
var router = express.Router();

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

router.get('/dashboard', function(req, res) {
  res.render('dashboard', { title: 'Dashboard' });
});

router.get('/perfil', (req, res, next) =>{
  res.render('perfil')
})

router.post('/perfil', (req, res, next) =>{

})

module.exports = router;
