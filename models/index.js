const Usuario = require('./Usuario');
const Livro = require('./Livro');
const Emprestimo = require('./Emprestimo');
Usuario.hasMany(Emprestimo, { foreignKey: 'usuarioId', onDelete: 'RESTRICT' });
Emprestimo.belongsTo(Usuario, { foreignKey: 'usuarioId' });
Livro.hasMany(Emprestimo, { foreignKey: 'livroId', onDelete: 'RESTRICT' });
Emprestimo.belongsTo(Livro, { foreignKey: 'livroId' });
module.exports = { Usuario, Livro, Emprestimo };
