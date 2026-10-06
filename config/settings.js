const fs = require('fs');
const path = require('path');
const arquivo = path.join(__dirname, 'local.js');
module.exports = fs.existsSync(arquivo) ? require(arquivo) : require('./local.example');
