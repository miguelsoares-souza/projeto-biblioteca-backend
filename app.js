const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const db = require('./config/db_sequelize');
const conectarMongo = require('./config/db_mongoose');
const settings = require('./config/settings');
const registrarErro = require('./utils/log');
const { pagina, escapar } = require('./utils/html');
require('./models');

const app = express();
app.use(express.urlencoded({ extended: true, limit: '20kb' }));
app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// Sem os bancos, a página inicial continua acessível e as operações avisam o problema.
app.locals.bancosProntos = false;
app.locals.bancosPendentes = [];
app.use(['/usuarios', '/livros', '/emprestimos', '/avaliacoes'], (req, res, next) => {
    if (!app.locals.bancosProntos) {
        const detalhe = app.locals.bancosPendentes.length ? ` Pendências: ${app.locals.bancosPendentes.join(' ')}` : '';
        const erro = new Error(`Bancos indisponíveis. Preencha config/local.js, verifique o PostgreSQL e o MongoDB Atlas e reinicie a aplicação.${detalhe}`);
        erro.status = 503;
        return next(erro);
    }
    next();
});
app.use('/usuarios', require('./routes/usuarios'));
app.use('/livros', require('./routes/livros'));
app.use('/emprestimos', require('./routes/emprestimos'));
app.use('/avaliacoes', require('./routes/avaliacoes'));
app.use((req, res) => res.status(404).send(pagina('Página não encontrada', '<p>Confira o endereço ou use o menu.</p>')));
app.use((erro, req, res, next) => {
    let status = erro.status || 500;
    let mensagem = erro.status ? erro.message : 'Não foi possível concluir a operação. Verifique os bancos e tente novamente.';
    if (erro.name === 'SequelizeValidationError' || erro.name === 'ValidationError' || erro.name === 'CastError') {
        status = 400;
        mensagem = 'Dados inválidos. Confira os campos obrigatórios, o e-mail, as datas e os limites informados.';
    }
    if (erro.name === 'SequelizeForeignKeyConstraintError') {
        status = 409;
        mensagem = 'O registro possui vínculos ou um usuário/livro informado não existe mais. Atualize a página e confira os empréstimos.';
    }
    if (erro.type === 'entity.parse.failed') mensagem = 'O JSON enviado é inválido.';
    if (erro.type === 'entity.too.large') mensagem = 'Os dados enviados excedem o tamanho permitido.';
    const seguro = new Error(mensagem);
    seguro.status = status;
    registrarErro(`${req.method} ${req.path}`, seguro);
    res.status(status).send(pagina('Não foi possível concluir', `<p role="alert">${escapar(mensagem)}</p><p>Use o menu para retornar à listagem e tentar novamente.</p>`));
});

async function iniciar() {
    app.locals.bancosProntos = false;
    app.locals.bancosPendentes = [];
    try {
        if (Object.values(settings.postgres).some(v => v == null || String(v).includes('PREENCHA'))) {
            const erro = new Error('PostgreSQL pendente: preencha postgres em config/local.js.');
            erro.status = 503;
            throw erro;
        }
        await db.authenticate();
        await db.sync(); // Cria tabelas ausentes, sem apagar os dados existentes.
        console.log('PostgreSQL conectado; tabelas verificadas.');
    } catch (erro) {
        registrarErro('Inicialização PostgreSQL', erro);
        const mensagem = erro.status === 503 ? erro.message : 'PostgreSQL indisponível: confira a configuração, a senha e o serviço local.';
        app.locals.bancosPendentes.push(mensagem);
        console.error(mensagem);
    }
    try {
        await conectarMongo();
        console.log('MongoDB conectado.');
    } catch (erro) {
        registrarErro('Inicialização MongoDB', erro);
        const mensagem = erro.status === 503 ? erro.message : 'MongoDB indisponível: confira a URI, o usuário de banco e o IP autorizado no Atlas.';
        app.locals.bancosPendentes.push(mensagem);
        console.error(mensagem);
    }
    app.locals.bancosProntos = app.locals.bancosPendentes.length === 0;
    const servidor = app.listen(settings.port, '127.0.0.1', () => {
        console.log(`Sistema de Biblioteca: http://localhost:${settings.port}`);
    });
    servidor.on('error', erro => {
        registrarErro('Iniciar servidor HTTP', erro);
        console.error('Não foi possível abrir a porta HTTP configurada.');
        Promise.allSettled([db.close(), mongoose.disconnect()]).then(() => { process.exitCode = 1; });
    });
    async function encerrar() {
        servidor.close();
        await Promise.allSettled([db.close(), mongoose.disconnect()]);
    }
    process.once('SIGINT', encerrar);
    process.once('SIGTERM', encerrar);
    return servidor;
}
if (require.main === module) iniciar();
module.exports = { app, iniciar };
