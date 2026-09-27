const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Увеличиваем лимит для картинок в base64

// Инициализация базы данных SQLite
const dbFile = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbFile, (err) => {
  if (err) {
    console.error('Ошибка подключения к базе данных', err.message);
  } else {
    console.log('Подключено к базе данных SQLite.');
  }
});

// Создание таблицы объявлений, если она еще не создана
db.run(`CREATE TABLE IF NOT EXISTS ads (
  id TEXT PRIMARY KEY,
  title TEXT,
  telegram TEXT,
  price TEXT,
  crypto TEXT,
  seller TEXT,
  description TEXT,
  photos TEXT,
  created_at INTEGER
)`);

// 1. Получить все объявления
app.get('/api/ads', (req, res) => {
  db.all(`SELECT * FROM ads ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    // Превращаем строку с фотографиями обратно в массив JSON
    const ads = rows.map(row => ({
      ...row,
      photos: row.photos ? JSON.parse(row.photos) : []
    }));
    res.json(ads);
  });
});

// 2. Добавить новое объявление
app.post('/api/ads', (req, res) => {
  const { id, title, telegram, price, crypto, seller, description, photos, created_at } = req.body;
  
  const photosString = photos ? JSON.stringify(photos) : '[]';

  const query = `INSERT INTO ads (id, title, telegram, price, crypto, seller, description, photos, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(query, [id, title, telegram, price, crypto, seller, description, photosString, created_at], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ success: true, id });
  });
});

// 3. Удалить объявление
app.delete('/api/ads/:id', (req, res) => {
  const adId = req.params.id;
  db.run(`DELETE FROM ads WHERE id = ?`, [adId], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ success: true, deleted: this.changes });
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});