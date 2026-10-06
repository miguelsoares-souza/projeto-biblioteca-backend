const router = require('express').Router();
const { Usuario, Emprestimo } = require('../models');
const { exigir, texto, inteiro } = require('../utils/validacao');
const { escapar, pagina, campo, formulario, acoes, tabela, confirmar } = require('../utils/html');

function campos(usuario = {}) {
    return campo('nome', 'Nome', usuario.nome, 'text', 'required maxlength="255"') +
        campo('email', 'E-mail', usuario.email, 'email', 'required maxlength="255"');
}
function dados(body) {
    const nome = texto(body.nome, 'Nome');
    const email = texto(body.email, 'E-mail');
    exigir(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), 'Informe um e-mail válido.');
    return { nome, email };
}
async function buscar(id) {
    const usuario = await Usuario.findByPk(inteiro(id, 'ID'));
    exigir(usuario, 'Usuário não encontrado.', 404);
    return usuario;
}
router.get('/', async (req, res, next) => {
    try {
        const usuarios = await Usuario.findAll({ order: [['nome', 'ASC']] });
        res.send(pagina('Usuários', '<p><a class="botao" href="/usuarios/novo">Cadastrar usuário</a></p>' + tabela(['ID', 'Nome', 'E-mail', 'Ações'], usuarios.map(u => [u.id, escapar(u.nome), escapar(u.email), acoes('/usuarios', u.id)]))));
    } catch (erro) { next(erro); }
});
router.get('/novo', (req, res) => res.send(pagina('Cadastrar usuário', formulario('/usuarios', campos(), '/usuarios'))));
router.post('/', async (req, res, next) => {
    try {
        await Usuario.create(dados(req.body));
        res.redirect(303, '/usuarios');
    } catch (erro) { next(erro); }
});
router.get('/:id/editar', async (req, res, next) => {
    try {
        const usuario = await buscar(req.params.id);
        res.send(pagina('Editar usuário', formulario(`/usuarios/${usuario.id}/editar`, campos(usuario), '/usuarios')));
    } catch (erro) { next(erro); }
});
router.post('/:id/editar', async (req, res, next) => {
    try {
        const usuario = await buscar(req.params.id);
        Object.assign(usuario, dados(req.body));
        await usuario.save();
        res.redirect(303, '/usuarios');
    } catch (erro) { next(erro); }
});
router.get('/:id/excluir', async (req, res, next) => {
    try {
        const usuario = await buscar(req.params.id);
        res.send(confirmar('/usuarios', usuario.id, `Excluir ${usuario.nome}? Remova os empréstimos vinculados antes.`));
    } catch (erro) { next(erro); }
});
router.post('/:id/excluir', async (req, res, next) => {
    try {
        const usuario = await buscar(req.params.id);
        exigir(!await Emprestimo.count({ where: { usuarioId: usuario.id } }), 'O usuário possui empréstimos. Exclua os empréstimos antes.', 409);
        await usuario.destroy();
        res.redirect(303, '/usuarios');
    } catch (erro) { next(erro); }
});
module.exports = router;
