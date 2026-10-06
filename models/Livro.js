const { DataTypes } = require('sequelize');
const db = require('../config/db_sequelize');
module.exports = db.define('Livro', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    titulo: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: true } },
    autor: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: true } },
    ano: { type: DataTypes.INTEGER, validate: { min: 1, max: 9999 } },
    disponivel: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, { timestamps: false });
