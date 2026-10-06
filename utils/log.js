const fs = require('fs');
const path = require('path');
module.exports = function registrarErro(operacao, erro) {
    // Não registra corpo da requisição nem mensagens de drivers com credenciais.
    const mensagem = erro.status ? erro.message : 'Falha interna ou de conexão. Verifique a configuração e os bancos.';
    const linha = JSON.stringify({ data: new Date().toISOString(), operacao, mensagem }) + '\n';
    try {
        fs.mkdirSync(path.join(__dirname, '..', 'logs'), { recursive: true });
        fs.appendFileSync(path.join(__dirname, '..', 'logs', 'errors.log'), linha);
    } catch {
        console.error('Não foi possível gravar logs/errors.log.');
    }
};
