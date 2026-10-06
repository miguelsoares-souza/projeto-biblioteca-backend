const { Sequelize } = require('sequelize');
const { postgres } = require('./settings');
module.exports = new Sequelize(postgres.database, postgres.username, postgres.password, {
    host: postgres.host,
    port: postgres.port,
    dialect: 'postgres',
    logging: false
});
