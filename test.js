const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('server/data/sakitrailer29.sqlite');
console.log(db.prepare("SELECT id, created_at FROM products ORDER BY datetime(created_at) DESC LIMIT 5").all());
