const mongoose = require('mongoose');
const { mongoUri } = require('./settings');
mongoose.set('bufferCommands', false);
module.exports = async function conectarMongo() {
    if (typeof mongoUri !== 'string' || !/^mongodb(?:\+srv)?:\/\//.test(mongoUri) || /PREENCHA|<[^>]+>/.test(mongoUri)) {
        const erro = new Error('MongoDB pendente: preencha mongoUri em config/local.js com a URI completa do Atlas, incluindo usuário, senha e banco.');
        erro.status = 503;
        throw erro;
    }
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
};
