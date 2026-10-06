const { Usuario, Livro, Emprestimo } = require('../models');
const { exigir, inteiro, data } = require('../utils/validacao');

// A classe concentra a regra de disponibilidade; a transação salva tudo junto.
class EmprestimoService {
    constructor(db) {
        this.db = db;
    }

    async criar(dados) {
        const usuarioId = inteiro(dados.usuarioId, 'Usuário');
        const livroId = inteiro(dados.livroId, 'Livro');
        const dataEmprestimo = data(dados.dataEmprestimo, 'Data do empréstimo');
        return this.db.transaction(async (transaction) => {
            const usuario = await Usuario.findByPk(usuarioId, { transaction });
            exigir(usuario, 'Usuário não encontrado.', 404);
            // O bloqueio impede dois empréstimos simultâneos do mesmo exemplar.
            const livro = await Livro.findByPk(livroId, { transaction, lock: transaction.LOCK.UPDATE });
            exigir(livro, 'Livro não encontrado.', 404);
            exigir(livro.disponivel, 'Livro indisponível.', 409);
            const emprestimo = await Emprestimo.create({ usuarioId, livroId, dataEmprestimo }, { transaction });
            livro.disponivel = false;
            await livro.save({ transaction });
            return emprestimo;
        });
    }

    async atualizar(id, dados) {
        const inicio = data(dados.dataEmprestimo, 'Data do empréstimo');
        const fim = dados.dataDevolucao ? data(dados.dataDevolucao, 'Data da devolução') : null;
        exigir(!fim || fim >= inicio, 'A devolução não pode ser anterior ao empréstimo.');
        return this.db.transaction(async (transaction) => {
            const emprestimo = await Emprestimo.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
            exigir(emprestimo, 'Empréstimo não encontrado.', 404);
            exigir(!emprestimo.dataDevolucao || fim, 'Não é permitido reabrir um empréstimo devolvido.');
            if (!emprestimo.dataDevolucao && fim) {
                const livro = await Livro.findByPk(emprestimo.livroId, { transaction, lock: transaction.LOCK.UPDATE });
                livro.disponivel = true;
                await livro.save({ transaction });
            }
            emprestimo.dataEmprestimo = inicio;
            emprestimo.dataDevolucao = fim;
            await emprestimo.save({ transaction });
        });
    }

    async excluir(id) {
        return this.db.transaction(async (transaction) => {
            const emprestimo = await Emprestimo.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
            exigir(emprestimo, 'Empréstimo não encontrado.', 404);
            if (!emprestimo.dataDevolucao) {
                const livro = await Livro.findByPk(emprestimo.livroId, { transaction, lock: transaction.LOCK.UPDATE });
                livro.disponivel = true;
                await livro.save({ transaction });
            }
            await emprestimo.destroy({ transaction });
        });
    }
}
module.exports = EmprestimoService;
