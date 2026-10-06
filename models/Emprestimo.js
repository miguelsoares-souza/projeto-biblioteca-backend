const { DataTypes } = require('sequelize');
const db = require('../config/db_sequelize');
module.exports = db.define('Emprestimo', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    dataEmprestimo: { type: DataTypes.DATEONLY, allowNull: false },
    dataDevolucao: { type: DataTypes.DATEONLY, allowNull: true },
    usuarioId: { type: DataTypes.INTEGER, allowNull: false },
    livroId: { type: DataTypes.INTEGER, allowNull: false }
}, { timestamps: false });
