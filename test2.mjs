import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
const db = new DatabaseSync('server/data/sakitrailer29.sqlite');
const rows = db.prepare("SELECT id, created_at FROM products ORDER BY datetime(created_at) DESC LIMIT 5").all();
fs.writeFileSync('out2.json', JSON.stringify(rows, null, 2));
