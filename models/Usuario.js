const { DataTypes } = require('sequelize');
const db = require('../config/db_sequelize');
module.exports = db.define('Usuario', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nome: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: true } },
    email: { type: DataTypes.STRING, allowNull: false, validate: { isEmail: true, notEmpty: true } }
}, { timestamps: false });
