// Testes HTTP com persistência simulada. Não substituem testes nos dois bancos reais.
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Op } = require('sequelize');
const { app } = require('../app');
const db = require('../config/db_sequelize');
const { Usuario, Livro, Emprestimo } = require('../models');
const Avaliacao = require('../models/Avaliacao');
const { data } = require('../utils/validacao');

const usuarios = new Map();
const livros = new Map();
const emprestimos = new Map();
const avaliacoes = new Map();
function combinar(registro, where = {}) {
    return Object.entries(where).every(([campo, valor]) => {
        if (valor && typeof valor === 'object') {
            if (valor[Op.like]) return registro[campo].includes(valor[Op.like].slice(1, -1));
            if (valor[Op.gte]) return registro[campo] >= valor[Op.gte];
        }
        return registro[campo] === valor;
    });
}
function simular(Model, registros, valores = {}) {
    let proximo = 1;
    Model.create = async dados => {
        const registro = { ...valores, ...dados, id: proximo++ };
        registro.save = async () => registro;
        registro.destroy = async () => registros.delete(registro.id);
        registros.set(registro.id, registro);
        return registro;
    };
    Model.findByPk = async id => registros.get(Number(id)) || null;
    Model.findAll = async (opcoes = {}) => {
        let lista = [...registros.values()].filter(r => combinar(r, opcoes.where));
        if (opcoes.order) lista.sort((a, b) => {
            for (const [campo, ordem] of opcoes.order) {
                const resultado = typeof a[campo] === 'number' ? a[campo] - b[campo] : String(a[campo]).localeCompare(String(b[campo]));
                if (resultado) return ordem === 'DESC' ? -resultado : resultado;
            }
            return 0;
        });
        if (opcoes.include) lista.forEach(e => { e.Usuario = usuarios.get(e.usuarioId); e.Livro = livros.get(e.livroId); });
        return lista.slice(opcoes.offset || 0, opcoes.limit ? (opcoes.offset || 0) + opcoes.limit : undefined);
    };
    Model.count = async (opcoes = {}) => [...registros.values()].filter(r => combinar(r, opcoes.where)).length;
}
simular(Usuario, usuarios);
simular(Livro, livros, { disponivel: true });
simular(Emprestimo, emprestimos, { dataDevolucao: null });
const buscarEmprestimo = Emprestimo.findByPk;
Emprestimo.findByPk = async id => {
    const e = await buscarEmprestimo(id);
    if (e) { e.Usuario = usuarios.get(e.usuarioId); e.Livro = livros.get(e.livroId); }
    return e;
};
db.transaction = async executar => executar({ LOCK: { UPDATE: 'UPDATE' } });
Avaliacao.prototype.save = async function () { await this.validate(); avaliacoes.set(this.id, this); return this; };
Avaliacao.find = () => ({ sort: async () => [...avaliacoes.values()] });
Avaliacao.findById = async id => avaliacoes.get(id) || null;
Avaliacao.exists = async ({ livroId }) => [...avaliacoes.values()].some(a => a.livroId === livroId);
Avaliacao.findOneAndUpdate = async ({ _id }, { $set }) => {
    const a = avaliacoes.get(_id);
    if (!a) return null;
    Object.assign(a, $set);
    await a.validate();
    return a;
};
Avaliacao.findOneAndDelete = async ({ _id }) => {
    const a = avaliacoes.get(_id);
    avaliacoes.delete(_id);
    return a;
};

const servidor = app.listen(0, '127.0.0.1');
after(() => new Promise(resolve => servidor.close(resolve)));
async function requisicao(url, dados, esperado = 200) {
    if (!servidor.listening) await new Promise(resolve => servidor.once('listening', resolve));
    const resposta = await fetch(`http://127.0.0.1:${servidor.address().port}${url}`, dados === undefined ? {} : {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(dados), redirect: 'manual'
    });
    const html = await resposta.text();
    assert.equal(resposta.status, esperado, `${url}: ${html}`);
    return html;
}

test('fluxo HTTP: CRUDs, consultas, disponibilidade, erros e formulários', async () => {
    const inicio = await requisicao('/');
    assert.match(inicio, /Sistema de Biblioteca/);
    await requisicao('/style.css');
    await requisicao('/usuarios', undefined, 503);
    app.locals.bancosProntos = true;
    await requisicao('/nao-existe', undefined, 404);

    await requisicao('/usuarios', { nome: ' ', email: 'invalido' }, 400);
    await requisicao('/usuarios', { nome: 'Leitor', email: 'invalido' }, 400);
    await requisicao('/usuarios', { nome: '<script>alert(1)</script>', email: 'leitor@example.com' }, 303);
    const usuarioHtml = await requisicao('/usuarios');
    assert.match(usuarioHtml, /&lt;script&gt;/);
    assert.doesNotMatch(usuarioHtml, /<script>alert/);
    await requisicao('/usuarios/1/editar', { nome: 'Leitor editado', email: 'leitor@example.com' }, 303);
    assert.equal(usuarios.get(1).nome, 'Leitor editado');
    await requisicao('/usuarios/999/editar', undefined, 404);

    await requisicao('/livros', { titulo: ' ', autor: 'Autor', ano: '2020' }, 400);
    await requisicao('/livros', { titulo: 'Livro', autor: 'Autor', ano: '2020.5' }, 400);
    for (let n = 1; n <= 7; n++) await requisicao('/livros', { titulo: `Livro ${n}`, autor: 'Autor', ano: String(2018 + n) }, 303);
    await requisicao('/livros/1/editar', { titulo: 'Livro 1 editado', autor: 'Autora', ano: '2024' }, 303);
    assert.equal(livros.get(1).autor, 'Autora');
    const primeira = await requisicao('/livros');
    assert.match(primeira, /Livro 5/);
    assert.doesNotMatch(primeira, /Livro 6/);
    const segunda = await requisicao('/livros/pesquisar?pagina=2');
    assert.match(segunda, /Livro 6/);
    assert.doesNotMatch(segunda, /Livro 1 editado/);
    const pesquisa = await requisicao('/livros/pesquisar?titulo=Livro%207&ano=2020&disponivel=true');
    assert.match(pesquisa, /Livro 7/);
    assert.doesNotMatch(pesquisa, /Livro 6/);
    const descendente = await requisicao('/livros?ordem=DESC');
    assert.ok(descendente.indexOf('Livro 7') < descendente.indexOf('Livro 6'));
    await requisicao('/livros?pagina=-1', undefined, 400);
    await requisicao('/livros?ordem=INVALIDA', undefined, 400);

    const emprestimo = { usuarioId: '1', livroId: '1', dataEmprestimo: '2026-09-01' };
    await requisicao('/emprestimos', { ...emprestimo, usuarioId: '999' }, 404);
    await requisicao('/emprestimos', { ...emprestimo, livroId: '999' }, 404);
    await requisicao('/emprestimos', { ...emprestimo, dataEmprestimo: '2026-02-30' }, 400);
    await requisicao('/emprestimos', emprestimo, 303);
    assert.equal(livros.get(1).disponivel, false);
    await requisicao('/emprestimos', emprestimo, 409);
    const indisponiveis = await requisicao('/livros?disponivel=false');
    assert.match(indisponiveis, /Livro 1 editado/);
    assert.doesNotMatch(indisponiveis, /Livro 2/);
    await requisicao('/usuarios/1/excluir', {}, 409);
    await requisicao('/livros/1/excluir', {}, 409);
    await requisicao('/emprestimos/1/editar', { dataEmprestimo: '2026-09-01', dataDevolucao: '2026-08-31' }, 400);
    await requisicao('/emprestimos/1/editar', { dataEmprestimo: '2026-09-01', dataDevolucao: '2026-09-02' }, 303);
    assert.equal(livros.get(1).disponivel, true);
    await requisicao('/emprestimos', emprestimo, 303);
    await requisicao('/emprestimos/1/editar', { dataEmprestimo: '2026-09-01', dataDevolucao: '' }, 400);
    await requisicao('/emprestimos/1/excluir', {}, 303);
    assert.equal(livros.get(1).disponivel, false, 'excluir empréstimo antigo não libera um livro emprestado novamente');

    const avaliacao = { livroId: '1', usuario: 'Leitor', nota: '5', comentario: 'Gostei do livro.' };
    await requisicao('/avaliacoes', { ...avaliacao, nota: '6' }, 400);
    await requisicao('/avaliacoes', { ...avaliacao, livroId: '999' }, 404);
    await requisicao('/avaliacoes', avaliacao, 303);
    const id = [...avaliacoes.keys()][0];
    await requisicao(`/avaliacoes/${id}/editar`, { ...avaliacao, nota: '4', comentario: 'Comentário editado' }, 303);
    assert.equal(avaliacoes.get(id).nota, 4);
    assert.match(await requisicao('/avaliacoes'), /Comentário editado/);
    await requisicao('/avaliacoes/errado/editar', undefined, 400);
    await requisicao('/avaliacoes/000000000000000000000000/editar', undefined, 404);

    // Visita links renderizados e verifica nomes/ações dos formulários.
    const paginas = ['/', '/usuarios', '/livros', '/emprestimos', '/avaliacoes', '/usuarios/novo', '/usuarios/1/editar', '/livros/novo', '/livros/1/editar', '/emprestimos/novo', '/emprestimos/2/editar', '/avaliacoes/nova', `/avaliacoes/${id}/editar`];
    const visitados = new Set();
    for (const url of paginas) {
        const html = await requisicao(url);
        for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
            const link = href.replaceAll('&amp;', '&');
            if (!visitados.has(link)) { visitados.add(link); await requisicao(link); }
        }
        for (const [, method, action] of html.matchAll(/<form method="(get|post)" action="([^"]+)"/g)) {
            assert.ok(action.startsWith('/'));
            assert.ok(['get', 'post'].includes(method));
        }
    }
    for (const [url, nomes] of [
        ['/usuarios/novo', ['nome', 'email']], ['/livros/novo', ['titulo', 'autor', 'ano']],
        ['/emprestimos/novo', ['usuarioId', 'livroId', 'dataEmprestimo']],
        ['/emprestimos/2/editar', ['dataEmprestimo', 'dataDevolucao']],
        ['/avaliacoes/nova', ['livroId', 'usuario', 'nota', 'comentario']]
    ]) {
        const html = await requisicao(url);
        for (const nome of nomes) assert.ok(html.includes(`name="${nome}"`), `${url}: campo ${nome}`);
    }
    await requisicao('/emprestimos/2/excluir', {}, 303);
    assert.equal(livros.get(1).disponivel, true);
    await requisicao('/livros/1/excluir', {}, 409); // Avaliação ainda vinculada.
    await requisicao(`/avaliacoes/${id}/excluir`, {}, 303);
    await requisicao(`/avaliacoes/${id}/excluir`, {}, 404);
    await requisicao('/livros/1/excluir', {}, 303);
    await requisicao('/usuarios/1/excluir', {}, 303);
    assert.equal(livros.has(1), false);
    assert.equal(usuarios.size, 0);
    assert.equal(emprestimos.size, 0);
    assert.equal(avaliacoes.size, 0);

    const original = Livro.findAll;
    Livro.findAll = async () => { throw new Error('SEGREDO_QUE_NAO_DEVE_VAZAR'); };
    const falha = await requisicao('/livros', undefined, 500);
    Livro.findAll = original;
    assert.doesNotMatch(falha, /SEGREDO_QUE_NAO_DEVE_VAZAR/);
    const log = fs.readFileSync(path.join(__dirname, '..', 'logs', 'errors.log'), 'utf8');
    assert.match(log, /Livro indisponível/);
    assert.doesNotMatch(log, /SEGREDO_QUE_NAO_DEVE_VAZAR/);
    assert.ok(JSON.parse(log.trim().split('\n').at(-1)).data);
    await requisicao('/'); // Servidor continua respondendo depois do erro.
});

test('validações dos models e calendário', async () => {
    assert.throws(() => data('2025-02-29', 'Data'));
    assert.equal(data('2024-02-29', 'Data'), '2024-02-29');
    await assert.rejects(Usuario.build({ nome: '', email: 'errado' }).validate());
    await assert.rejects(Livro.build({ titulo: '', autor: 'Autor', ano: 0 }).validate());
    await assert.rejects(new Avaliacao({ livroId: 1, usuario: 'Leitor', nota: 2.5, comentario: 'Teste' }).validate());
    await assert.rejects(new Avaliacao({ livroId: 1, usuario: ' ', nota: 5, comentario: ' ' }).validate());
});
