var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session'); //  Adicione esta linha

var indexRouter = require('./routes/index');
// var usersRouter = require('./routes/users'); // Você pode remover se não usar

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// --- CONFIGURAÇÃO DO MIDDLEWARE ---
// A ordem aqui é importante!

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

//  Configure o express-session AQUI
app.use(session({
  secret: 'sua-chave-secreta-super-dificil', // TROQUE ISTO POR UMA CHAVE REAL E SEGURA
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Para desenvolvimento. Em produção (com HTTPS), use 'true'.
}));

// Servir arquivos estáticos (CSS, imagens)
app.use(express.static(path.join(__dirname, 'public')));

//  Configure as rotas DEPOIS da sessão
app.use('/', indexRouter);
// app.use('/users', usersRouter); // Você pode remover se não usar

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;