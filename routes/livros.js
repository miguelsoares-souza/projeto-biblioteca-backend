const router = require('express').Router();
const { Op } = require('sequelize');
const { Livro, Emprestimo } = require('../models');
const Avaliacao = require('../models/Avaliacao');
const { exigir, texto, inteiro } = require('../utils/validacao');
const { escapar, pagina, campo, formulario, acoes, tabela, confirmar } = require('../utils/html');

function campos(livro = {}) {
    return campo('titulo', 'Título', livro.titulo, 'text', 'required maxlength="255"') +
        campo('autor', 'Autor', livro.autor, 'text', 'required maxlength="255"') +
        campo('ano', 'Ano (opcional)', livro.ano, 'number', 'min="1" max="9999"') +
        '<p>A disponibilidade é controlada pelos empréstimos e devoluções.</p>';
}
function dados(body) {
    return { titulo: texto(body.titulo, 'Título'), autor: texto(body.autor, 'Autor'), ano: body.ano ? inteiro(body.ano, 'Ano', 1, 9999) : null };
}
async function buscar(id) {
    const livro = await Livro.findByPk(inteiro(id, 'ID'));
    exigir(livro, 'Livro não encontrado.', 404);
    return livro;
}
async function listar(req, res, next) {
    try {
        const titulo = req.query.titulo === undefined || req.query.titulo === '' ? '' : texto(req.query.titulo, 'Título');
        const ano = req.query.ano ? inteiro(req.query.ano, 'Ano mínimo', 1, 9999) : '';
        const disponivel = req.query.disponivel || '';
        exigir(['', 'true', 'false'].includes(disponivel), 'Disponibilidade inválida.');
        const ordem = req.query.ordem || 'ASC';
        exigir(['ASC', 'DESC'].includes(ordem), 'Ordenação inválida.');
        const numero = inteiro(req.query.pagina || '1', 'Página', 1, 1000000);
        const where = {};
        if (titulo) where.titulo = { [Op.like]: `%${titulo}%` };
        if (ano) where.ano = { [Op.gte]: ano };
        if (disponivel) where.disponivel = disponivel === 'true';
        const limit = 5;
        const livros = await Livro.findAll({ where, order: [['titulo', ordem], ['id', 'ASC']], limit, offset: (numero - 1) * limit });
        const total = await Livro.count({ where });
        const filtros = `<form method="get" action="/livros/pesquisar">${campo('titulo', 'Título contém (diferencia maiúsculas)', titulo)}${campo('ano', 'Ano mínimo', ano, 'number', 'min="1" max="9999"')}<label>Disponibilidade<select name="disponivel"><option value="">Todas</option><option value="true" ${disponivel === 'true' ? 'selected' : ''}>Disponíveis</option><option value="false" ${disponivel === 'false' ? 'selected' : ''}>Emprestados</option></select></label><label>Ordem por título<select name="ordem"><option value="ASC" ${ordem === 'ASC' ? 'selected' : ''}>A–Z</option><option value="DESC" ${ordem === 'DESC' ? 'selected' : ''}>Z–A</option></select></label><button>Pesquisar</button> <a href="/livros">Limpar filtros</a></form>`;
        function link(p, rotulo) {
            return `<a href="/livros/pesquisar?${escapar(new URLSearchParams({ titulo, ano: String(ano), disponivel, ordem, pagina: String(p) }))}">${rotulo}</a>`;
        }
        const navegacao = `<p>Página ${numero} de ${Math.max(1, Math.ceil(total / limit))} — ${total} livro(s), até ${limit} por página.</p><p>${numero > 1 ? link(numero - 1, 'Anterior') : ''} ${numero * limit < total ? link(numero + 1, 'Próxima') : ''}</p>`;
        res.send(pagina('Livros', '<p><a class="botao" href="/livros/novo">Cadastrar livro</a></p>' + filtros + tabela(['ID', 'Título', 'Autor', 'Ano', 'Disponível', 'Ações'], livros.map(l => [l.id, escapar(l.titulo), escapar(l.autor), l.ano || '—', l.disponivel ? 'Sim' : 'Não', acoes('/livros', l.id)])) + navegacao));
    } catch (erro) { next(erro); }
}
router.get('/', listar);
router.get('/pesquisar', listar);
router.get('/novo', (req, res) => res.send(pagina('Cadastrar livro', formulario('/livros', campos(), '/livros'))));
router.post('/', async (req, res, next) => {
    try {
        await Livro.create(dados(req.body));
        res.redirect(303, '/livros');
    } catch (erro) { next(erro); }
});
router.get('/:id/editar', async (req, res, next) => {
    try {
        const livro = await buscar(req.params.id);
        res.send(pagina('Editar livro', formulario(`/livros/${livro.id}/editar`, campos(livro), '/livros')));
    } catch (erro) { next(erro); }
});
router.post('/:id/editar', async (req, res, next) => {
    try {
        const livro = await buscar(req.params.id);
        Object.assign(livro, dados(req.body));
        await livro.save();
        res.redirect(303, '/livros');
    } catch (erro) { next(erro); }
});
router.get('/:id/excluir', async (req, res, next) => {
    try {
        const livro = await buscar(req.params.id);
        res.send(confirmar('/livros', livro.id, `Excluir ${livro.titulo}? Remova os empréstimos e as avaliações vinculadas antes.`));
    } catch (erro) { next(erro); }
});
router.post('/:id/excluir', async (req, res, next) => {
    try {
        const livro = await buscar(req.params.id);
        exigir(!await Emprestimo.count({ where: { livroId: livro.id } }), 'O livro possui empréstimos. Exclua os empréstimos antes.', 409);
        exigir(!await Avaliacao.exists({ livroId: livro.id }), 'O livro possui avaliações. Exclua as avaliações antes.', 409);
        await livro.destroy();
        res.redirect(303, '/livros');
    } catch (erro) { next(erro); }
});
module.exports = router;
