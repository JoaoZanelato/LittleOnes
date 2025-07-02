var express = require('express');
var router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// --- FUNÇÃO PARA ATUALIZAR STATUS DOS ANÕES ---
async function verificarEAtualizarPedidos() {
  console.log('Verificando status dos pedidos...');
  try {
    const agora = new Date();
    const sql = `
      UPDATE anoes a
      JOIN pedidos p ON a.id = p.id_anao
      SET a.status = 'ativo', a.updated_at = NOW()
      WHERE p.data_fim < ? AND a.status = 'alugado'
    `;
    const [result] = await pool.query(sql, [agora]);
    if (result.affectedRows > 0) {
      console.log(`${result.affectedRows} anões foram reativados.`);
    }
  } catch (error) {
    console.error("Erro ao verificar e atualizar status dos anões:", error);
  }
}

setInterval(verificarEAtualizarPedidos, 3600000); // Roda a cada 1 hora

// --- MIDDLEWARE DE AUTENTICAÇÃO ---
function isComprador(req, res, next) {
    if (req.session.usuario && req.session.usuario.cliente_ou_utilizador === 'comprador') {
        return next();
    }
    res.redirect('/');
}

function isUtilizador(req, res, next) {
    if (req.session.usuario && req.session.usuario.cliente_ou_utilizador === 'utilizador') {
        return next();
    }
    res.redirect('/');
}

// --- ROTAS PRINCIPAIS ---

router.get('/', function(req, res, next) {
  res.render('cadastro', { error: null });
});

router.post('/cadastro', async function(req, res) {
  const { nome, cliente_ou_utilizador, email, senha, cpf, telefone } = req.body;
  try {
    const salt = await bcrypt.genSalt(10);
    const hashSenha = await bcrypt.hash(senha, salt);
    const sql = "INSERT INTO usuarios (nome, cliente_ou_utilizador, email, senha, cpf, telefone, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())";
    const [result] = await pool.query(sql, [nome, cliente_ou_utilizador, email, hashSenha, cpf, telefone]);
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

router.post('/login', async function(req, res) {
  const { email, senha } = req.body;
  try {
    const sql = "SELECT * FROM usuarios WHERE email = ?";
    const [rows] = await pool.query(sql, [email]);
    if (rows.length > 0) {
      const usuario = rows[0];
      const match = await bcrypt.compare(senha, usuario.senha);
      if (match) {
        req.session.usuario = usuario;
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

// --- ROTAS DO COMPRADOR ---

router.get('/dashboard-comprador', isComprador, async function(req, res) {
    await verificarEAtualizarPedidos();
    try {
        const [rows] = await pool.query("SELECT * FROM anoes WHERE status = 'ativo'");
        res.render('dashboard_comprador', {
            title: 'Dashboard do Comprador',
            anoes: rows,
            usuario: req.session.usuario,
            success: req.query.success
        });
    } catch (error) {
        console.error("Erro ao buscar anões:", error);
        res.render('error', { message: 'Erro ao carregar o dashboard', error });
    }
});

// --- ROTAS DO UTILIZADOR (ANÃO) ---

// MODIFICADO: Agora busca os anões ativos para exibir no dashboard do utilizador
router.get('/dashboard-utilizador', isUtilizador, async function(req, res) {
    await verificarEAtualizarPedidos(); // Garante que a lista de status está atualizada
    try {
        const [rows] = await pool.query("SELECT * FROM anoes WHERE status = 'ativo'");
        res.render('dashboard_utilizador', {
            title: 'Dashboard do Utilizador',
            anoes: rows, // Envia a lista de anões para a view
            usuario: req.session.usuario
        });
    } catch (error) {
        console.error("Erro ao buscar anões para o dashboard do utilizador:", error);
        res.render('error', { message: 'Erro ao carregar o dashboard', error });
    }
});

// Rota para EXIBIR o perfil do anão para edição
router.get('/perfil', isUtilizador, async (req, res) => {
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
router.post('/perfil', isUtilizador, async (req, res) => {
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


// --- ROTAS DO CARRINHO ---

router.post('/carrinho/adicionar/:id', isComprador, async (req, res) => {
    const idAnao = req.params.id;
    const idUsuario = req.session.usuario.id;
    try {
        const [anaoStatus] = await pool.query("SELECT status FROM anoes WHERE id = ?", [idAnao]);
        if (anaoStatus[0].status !== 'ativo') {
            return res.redirect('/dashboard-comprador?error=Este anão não está disponível');
        }
        await pool.query("UPDATE anoes SET status = 'reservado' WHERE id = ?", [idAnao]);
        const sql = "INSERT INTO pedidos (id_anao, id_user, status, created_at, updated_at) VALUES (?, ?, 'pendente', NOW(), NOW())";
        await pool.query(sql, [idAnao, idUsuario]);
        res.redirect('/carrinho');
    } catch (error) {
        console.error("Erro ao adicionar ao carrinho:", error);
        res.render('error', { message: 'Erro ao adicionar item ao carrinho.', error });
    }
});

router.get('/carrinho', isComprador, async (req, res) => {
    try {
        const idUsuario = req.session.usuario.id;
        const sql = `
            SELECT p.id as pedido_id, a.* FROM pedidos p
            JOIN anoes a ON p.id_anao = a.id
            WHERE p.id_user = ? AND p.status = 'pendente'
        `;
        const [items] = await pool.query(sql, [idUsuario]);
        res.render('carrinho', { title: 'Meu Carrinho', carrinho: items, usuario: req.session.usuario });
    } catch (error) {
        console.error("Erro ao buscar carrinho:", error);
        res.render('error', { message: 'Erro ao carregar o carrinho.', error });
    }
});

router.post('/carrinho/remover/:id_pedido', isComprador, async (req, res) => {
    const idPedido = req.params.id_pedido;
    const idUsuario = req.session.usuario.id;
    try {
        const [pedido] = await pool.query("SELECT id_anao FROM pedidos WHERE id = ? AND id_user = ?", [idPedido, idUsuario]);
        if (pedido.length > 0) {
            const idAnao = pedido[0].id_anao;
            await pool.query("DELETE FROM pedidos WHERE id = ?", [idPedido]);
            await pool.query("UPDATE anoes SET status = 'ativo' WHERE id = ?", [idAnao]);
        }
        res.redirect('/carrinho');
    } catch (error) {
        console.error("Erro ao remover do carrinho:", error);
        res.render('error', { message: 'Erro ao remover item do carrinho.', error });
    }
});

// --- ROTAS DE PAGAMENTO E PEDIDOS ---

router.get('/pagamento', isComprador, async (req, res) => {
    try {
        const [cartoes] = await pool.query("SELECT * FROM cadastro_cartoes WHERE id_user = ?", [req.session.usuario.id]);
        const [itensCarrinho] = await pool.query("SELECT COUNT(*) as total FROM pedidos WHERE id_user = ? AND status = 'pendente'", [req.session.usuario.id]);
        if(itensCarrinho[0].total === 0) {
             return res.redirect('/carrinho');
        }
        res.render('pagamento', { title: 'Pagamento', usuario: req.session.usuario, cartoes: cartoes, error: null });
    } catch (error) {
        res.render('error', { message: 'Erro ao carregar página de pagamento.', error });
    }
});

router.post('/pagamento/cadastrar-cartao', isComprador, async (req, res) => {
    const { num_card, cvv, validade } = req.body;
    const idUsuario = req.session.usuario.id;
    try {
        const sql = "INSERT INTO cadastro_cartoes (id_user, num_card, cvv, validade, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())";
        await pool.query(sql, [idUsuario, num_card, cvv, validade]);
        res.redirect('/pagamento');
    } catch (error) {
        res.render('error', { message: 'Erro ao cadastrar cartão.', error });
    }
});

router.post('/pagamento/finalizar', isComprador, async (req, res) => {
    const { id_cartao, tempo_aluguel } = req.body;
    const idUsuario = req.session.usuario.id;
    if (!id_cartao) {
        const [cartoes] = await pool.query("SELECT * FROM cadastro_cartoes WHERE id_user = ?", [req.session.usuario.id]);
        return res.render('pagamento', { title: 'Pagamento', usuario: req.session.usuario, cartoes, error: "Você precisa selecionar um cartão." });
    }
    try {
        const dataInicio = new Date();
        const dataFim = new Date();
        dataFim.setDate(dataInicio.getDate() + parseInt(tempo_aluguel, 10));
        const sql = `
            UPDATE pedidos
            SET id_cartao = ?, data_inicio = ?, data_fim = ?, status = 'confirmado', updated_at = NOW()
            WHERE id_user = ? AND status = 'pendente'
        `;
        await pool.query(sql, [id_cartao, dataInicio, dataFim, idUsuario]);
        const updateAnoesSql = `
            UPDATE anoes a
            JOIN pedidos p ON a.id = p.id_anao
            SET a.status = 'alugado'
            WHERE p.id_user = ? AND p.status = 'confirmado' AND a.status = 'reservado'
        `;
        await pool.query(updateAnoesSql, [idUsuario]);
        res.redirect('/meus-pedidos?success=true');
    } catch (error) {
        res.render('error', { message: 'Erro ao finalizar o pedido.', error });
    }
});

router.get('/meus-pedidos', isComprador, async (req, res) => {
    try {
        const idUsuario = req.session.usuario.id;
        const sql = `
            SELECT p.id as pedido_id, a.nome, a.url_foto, p.data_inicio, p.data_fim, p.status
            FROM pedidos p
            JOIN anoes a ON p.id_anao = a.id
            WHERE p.id_user = ? AND p.status = 'confirmado'
            ORDER BY p.data_fim DESC
        `;
        const [pedidos] = await pool.query(sql, [idUsuario]);
        res.render('meus_pedidos', { title: 'Meus Pedidos', pedidos, usuario: req.session.usuario, success: req.query.success });
    } catch (error) {
        res.render('error', { message: 'Erro ao buscar seus pedidos.', error });
    }
});

// --- LOGOUT ---
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

module.exports = router;