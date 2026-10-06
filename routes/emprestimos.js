const router = require('express').Router();
const db = require('../config/db_sequelize');
const { Usuario, Livro, Emprestimo } = require('../models');
const EmprestimoService = require('../services/EmprestimoService');
const servico = new EmprestimoService(db);
const { exigir, inteiro } = require('../utils/validacao');
const { escapar, pagina, campo, selecao, formulario, acoes, tabela, confirmar } = require('../utils/html');

async function buscar(id) {
    const emprestimo = await Emprestimo.findByPk(inteiro(id, 'ID'), { include: [Usuario, Livro] });
    exigir(emprestimo, 'Empréstimo não encontrado.', 404);
    return emprestimo;
}
router.get('/', async (req, res, next) => {
    try {
        const lista = await Emprestimo.findAll({ include: [Usuario, Livro], order: [['id', 'DESC']] });
        res.send(pagina('Empréstimos', '<p><a class="botao" href="/emprestimos/novo">Registrar empréstimo</a></p><p>Para devolver um livro, clique em Editar e preencha a data da devolução.</p>' + tabela(['ID', 'Usuário', 'Livro', 'Empréstimo', 'Devolução', 'Ações'], lista.map(e => [e.id, escapar(e.Usuario.nome), escapar(e.Livro.titulo), escapar(e.dataEmprestimo), escapar(e.dataDevolucao || 'Em aberto'), acoes('/emprestimos', e.id)]))));
    } catch (erro) { next(erro); }
});
router.get('/novo', async (req, res, next) => {
    try {
        const usuarios = await Usuario.findAll({ order: [['nome', 'ASC']] });
        const livros = await Livro.findAll({ where: { disponivel: true }, order: [['titulo', 'ASC']] });
        const campos = selecao('usuarioId', 'Usuário', usuarios.map(u => ({ id: u.id, nome: `${u.nome} (#${u.id})` }))) +
            selecao('livroId', 'Livro disponível', livros.map(l => ({ id: l.id, nome: `${l.titulo} (#${l.id})` }))) +
            campo('dataEmprestimo', 'Data do empréstimo', '', 'date', 'required');
        const conteudo = usuarios.length && livros.length ? formulario('/emprestimos', campos, '/emprestimos') : '<p>Cadastre <a href="/usuarios/novo">um usuário</a> e <a href="/livros/novo">um livro</a> disponível antes de registrar um empréstimo.</p>';
        res.send(pagina('Registrar empréstimo', conteudo));
    } catch (erro) { next(erro); }
});
router.post('/', async (req, res, next) => {
    try {
        await servico.criar(req.body);
        res.redirect(303, '/emprestimos');
    } catch (erro) { next(erro); }
});
router.get('/:id/editar', async (req, res, next) => {
    try {
        const e = await buscar(req.params.id);
        const campos = `<p>${escapar(e.Usuario.nome)} — ${escapar(e.Livro.titulo)}</p><p>Usuário e livro não são alterados. Para corrigir esses dados, cancele e registre outro empréstimo.</p>` +
            campo('dataEmprestimo', 'Data do empréstimo', e.dataEmprestimo, 'date', 'required') +
            campo('dataDevolucao', 'Data da devolução (vazia = em aberto)', e.dataDevolucao, 'date', e.dataDevolucao ? 'required' : '');
        res.send(pagina('Editar / devolver empréstimo', formulario(`/emprestimos/${e.id}/editar`, campos, '/emprestimos')));
    } catch (erro) { next(erro); }
});
router.post('/:id/editar', async (req, res, next) => {
    try {
        await servico.atualizar(inteiro(req.params.id, 'ID'), req.body);
        res.redirect(303, '/emprestimos');
    } catch (erro) { next(erro); }
});
router.get('/:id/excluir', async (req, res, next) => {
    try {
        const e = await buscar(req.params.id);
        res.send(confirmar('/emprestimos', e.id, `Excluir o empréstimo de ${e.Livro.titulo}? Se estiver em aberto, o livro ficará disponível.`));
    } catch (erro) { next(erro); }
});
router.post('/:id/excluir', async (req, res, next) => {
    try {
        await servico.excluir(inteiro(req.params.id, 'ID'));
        res.redirect(303, '/emprestimos');
    } catch (erro) { next(erro); }
});
module.exports = router;
