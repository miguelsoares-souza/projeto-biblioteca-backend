const mongoose = require('mongoose');
const schema = new mongoose.Schema({
    livroId: { type: Number, required: true, min: 1, validate: Number.isInteger },
    usuario: { type: String, required: true, trim: true, maxlength: 255 },
    nota: { type: Number, required: true, min: 1, max: 5, validate: Number.isInteger },
    comentario: { type: String, required: true, trim: true, maxlength: 2000 },
    data: { type: Date, default: Date.now }
}, { versionKey: false, collection: 'avaliacoes' });
module.exports = mongoose.model('Avaliacao', schema);
