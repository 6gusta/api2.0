// db.js
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');

const file = path.join(__dirname, 'db.json');
const adapter = new FileSync(file);
const db = low(adapter);

// Inicializa com dados padrão se estiver vazio
db.defaults({ instancias: [] }).write();

module.exports = db;
