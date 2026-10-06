function exigir(condicao, mensagem, status = 400) {
    if (!condicao) {
        const erro = new Error(mensagem);
        erro.status = status;
        throw erro;
    }
}
function texto(valor, nome, max = 255) {
    exigir(typeof valor === 'string' && valor.trim().length > 0, `${nome} é obrigatório.`);
    exigir(valor.trim().length <= max, `${nome} deve ter até ${max} caracteres.`);
    return valor.trim();
}
function inteiro(valor, nome, min = 1, max = 2147483647) {
    exigir(typeof valor === 'string' && /^\d+$/.test(valor), `${nome} deve ser um número inteiro.`);
    const numero = Number(valor);
    exigir(Number.isSafeInteger(numero) && numero >= min && numero <= max, `${nome} deve estar entre ${min} e ${max}.`);
    return numero;
}
function data(valor, nome) {
    exigir(typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor), `${nome} inválida.`);
    const d = new Date(`${valor}T00:00:00Z`);
    exigir(!Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === valor && valor >= '0001-01-01', `${nome} inválida.`);
    return valor;
}
module.exports = { exigir, texto, inteiro, data };
