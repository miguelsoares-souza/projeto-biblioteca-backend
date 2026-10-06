function escapar(valor = '') {
    return String(valor ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function pagina(titulo, conteudo) {
    return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapar(titulo)} | Biblioteca</title><link rel="stylesheet" href="/style.css"></head><body><header><a href="/">Sistema de Biblioteca</a><nav aria-label="Principal"><a href="/usuarios">Usuários</a><a href="/livros">Livros</a><a href="/emprestimos">Empréstimos</a><a href="/avaliacoes">Avaliações</a></nav></header><main><h1>${escapar(titulo)}</h1>${conteudo}<p><a href="/">Voltar ao início</a></p></main></body></html>`;
}
function campo(nome, rotulo, valor = '', tipo = 'text', extra = '') {
    return `<label>${escapar(rotulo)}<input name="${nome}" type="${tipo}" value="${escapar(valor)}" ${extra}></label>`;
}
function selecao(nome, rotulo, itens, atual = '') {
    return `<label>${escapar(rotulo)}<select name="${nome}" required><option value="">Selecione</option>${itens.map(i => `<option value="${escapar(i.id)}" ${String(i.id) === String(atual) ? 'selected' : ''}>${escapar(i.nome)}</option>`).join('')}</select></label>`;
}
function formulario(acao, campos, voltar) {
    return `<form method="post" action="${acao}">${campos}<button type="submit">Salvar</button> <a href="${voltar}">Cancelar</a></form>`;
}
function acoes(base, id) {
    return `<a href="${base}/${id}/editar">Editar</a> <a href="${base}/${id}/excluir">Excluir</a>`;
}
function tabela(colunas, linhas) {
    if (!linhas.length) return '<p>Nenhum registro encontrado.</p>';
    return `<div class="tabela"><table><thead><tr>${colunas.map(c => `<th scope="col">${escapar(c)}</th>`).join('')}</tr></thead><tbody>${linhas.map(l => `<tr>${l.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function confirmar(base, id, descricao) {
    return pagina('Confirmar exclusão', `<p>${escapar(descricao)}</p><p>Esta operação exclui o registro.</p><form method="post" action="${base}/${id}/excluir"><button type="submit">Confirmar exclusão</button> <a href="${base}">Cancelar</a></form>`);
}
module.exports = { escapar, pagina, campo, selecao, formulario, acoes, tabela, confirmar };
