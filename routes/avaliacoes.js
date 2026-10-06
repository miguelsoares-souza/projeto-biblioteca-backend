const router = require('express').Router();
const { Livro } = require('../models');
const Avaliacao = require('../models/Avaliacao');
const { exigir, inteiro, texto } = require('../utils/validacao');
const { escapar, pagina, campo, selecao, formulario, acoes, tabela, confirmar } = require('../utils/html');

function validarId(id) {
    exigir(/^[a-f\d]{24}$/i.test(id), 'ID da avaliação inválido.');
    return id;
}
async function buscar(id) {
    const avaliacao = await Avaliacao.findById(validarId(id));
    exigir(avaliacao, 'Avaliação não encontrada.', 404);
    return avaliacao;
}
async function dados(body) {
    const livroId = inteiro(body.livroId, 'Livro');
    const usuario = texto(body.usuario, 'Usuário');
    const nota = inteiro(body.nota, 'Nota', 1, 5);
    const comentario = texto(body.comentario, 'Comentário', 2000);
    exigir(await Livro.findByPk(livroId), 'Livro não encontrado.', 404);
    return { livroId, usuario, nota, comentario };
}
async function campos(a = {}) {
    const livros = await Livro.findAll({ order: [['titulo', 'ASC']] });
    return selecao('livroId', 'Livro', livros.map(l => ({ id: l.id, nome: `${l.titulo} (#${l.id})` })), a.livroId) +
        campo('usuario', 'Nome de quem avalia', a.usuario, 'text', 'required maxlength="255"') +
        campo('nota', 'Nota de 1 a 5', a.nota, 'number', 'required min="1" max="5" step="1"') +
        `<label>Comentário<textarea name="comentario" required maxlength="2000" rows="4">${escapar(a.comentario)}</textarea></label>`;
}
router.get('/', async (req, res, next) => {
    try {
        const avaliacoes = await Avaliacao.find().sort({ data: -1 });
        const livros = await Livro.findAll();
        const titulos = new Map(livros.map(l => [l.id, l.titulo]));
        res.send(pagina('Avaliações', '<p><a class="botao" href="/avaliacoes/nova">Cadastrar avaliação</a></p>' + tabela(['Livro', 'Usuário', 'Nota', 'Comentário', 'Data', 'Ações'], avaliacoes.map(a => [escapar(titulos.get(a.livroId) || `Livro #${a.livroId}`), escapar(a.usuario), a.nota, escapar(a.comentario), escapar(a.data.toLocaleDateString('pt-BR')), acoes('/avaliacoes', a.id)]))));
    } catch (erro) { next(erro); }
});
router.get('/nova', async (req, res, next) => {
    try {
        res.send(pagina('Cadastrar avaliação', '<p>Cadastre um <a href="/livros/novo">livro</a> antes de avaliá-lo.</p>' + formulario('/avaliacoes', await campos(), '/avaliacoes')));
    } catch (erro) { next(erro); }
});
router.post('/', async (req, res, next) => {
    try {
        const avaliacao = new Avaliacao(await dados(req.body));
        await avaliacao.save();
        res.redirect(303, '/avaliacoes');
    } catch (erro) { next(erro); }
});
router.get('/:id/editar', async (req, res, next) => {
    try {
        const a = await buscar(req.params.id);
        res.send(pagina('Editar avaliação', formulario(`/avaliacoes/${a.id}/editar`, await campos(a), '/avaliacoes')));
    } catch (erro) { next(erro); }
});
router.post('/:id/editar', async (req, res, next) => {
    try {
        const id = validarId(req.params.id);
        const a = await Avaliacao.findOneAndUpdate({ _id: id }, { $set: await dados(req.body) }, { new: true, runValidators: true });
        exigir(a, 'Avaliação não encontrada.', 404);
        res.redirect(303, '/avaliacoes');
    } catch (erro) { next(erro); }
});
router.get('/:id/excluir', async (req, res, next) => {
    try {
        const a = await buscar(req.params.id);
        res.send(confirmar('/avaliacoes', a.id, `Excluir a avaliação de ${a.usuario}?`));
    } catch (erro) { next(erro); }
});
router.post('/:id/excluir', async (req, res, next) => {
    try {
        const a = await Avaliacao.findOneAndDelete({ _id: validarId(req.params.id) });
        exigir(a, 'Avaliação não encontrada.', 404);
        res.redirect(303, '/avaliacoes');
    } catch (erro) { next(erro); }
});
module.exports = router;
