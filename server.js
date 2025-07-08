// server.js - Backend Server cho Website Nghỉ Lễ
// Copy toàn bộ code này và lưu vào file server.js trong thư mục gốc của dự án

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));

// Initialize Database
const db = new sqlite3.Database('./database.db');

// Create tables
db.serialize(() => {
    // Settings table
    db.run(`CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY,
        key TEXT UNIQUE,
        value TEXT
    )`);

    // Holidays table
    db.run(`CREATE TABLE IF NOT EXISTS holidays (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT UNIQUE,
        name TEXT
    )`);

    // Quotes table
    db.run(`CREATE TABLE IF NOT EXISTS quotes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT,
        author TEXT
    )`);

    // Products table
    db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        image TEXT,
        link TEXT,
        position INTEGER
    )`);

    // Tours table
    db.run(`CREATE TABLE IF NOT EXISTS tours (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        image TEXT,
        departure TEXT,
        transport TEXT,
        date TEXT,
        price TEXT,
        position INTEGER
    )`);

    // Bookings table
    db.run(`CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tour TEXT,
        customer_name TEXT,
        customer_phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Footer links table
    db.run(`CREATE TABLE IF NOT EXISTS footer_links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT,
        url TEXT,
        position INTEGER
    )`);

    // Insert default data
    insertDefaultData();
});

function insertDefaultData() {
    // Default holidays
    const holidays = [
        { date: '2025-04-30', name: 'Ngày Giải phóng miền Nam' },
        { date: '2025-05-01', name: 'Ngày Quốc tế Lao động' }
    ];
    
    holidays.forEach(holiday => {
        db.run(`INSERT OR IGNORE INTO holidays (date, name) VALUES (?, ?)`, 
            [holiday.date, holiday.name]);
    });

    // Default quotes
    const quotes = [
        { text: 'Không có gì quý hơn độc lập, tự do', author: 'Hồ Chí Minh' },
        { text: 'Đoàn kết, đoàn kết, đại đoàn kết. Thành công, thành công, đại thành công', author: 'Hồ Chí Minh' },
        { text: 'Dân ta phải biết sử ta. Cho tường gốc tích nước nhà Việt Nam', author: 'Hồ Chí Minh' }
    ];
    
    quotes.forEach((quote, index) => {
        db.run(`INSERT OR IGNORE INTO quotes (text, author) VALUES (?, ?)`, 
            [quote.text, quote.author]);
    });

    // Default settings
    const settings = [
        { key: 'countdown_date', value: '2025-04-30T00:00:00+07:00' },
        { key: 'popup_enabled', value: 'true' },
        { key: 'popup_delay', value: '5' },
        { key: 'popup_content', value: '<h3>Chào mừng ngày lễ 30/4!</h3>' },
        { key: 'meta_title', value: 'Lịch Nghỉ Lễ 30/4 - 01/5' },
        { key: 'meta_description', value: 'Theo dõi lịch nghỉ lễ và tour du lịch' }
    ];
    
    settings.forEach(setting => {
        db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`, 
            [setting.key, setting.value]);
    });
}

// API Routes

// Get all settings
app.get('/api/settings', (req, res) => {
    db.all('SELECT * FROM settings', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const settings = {};
        rows.forEach(row => {
            settings[row.key] = row.value;
        });
        res.json(settings);
    });
});

// Update setting
app.post('/api/settings', (req, res) => {
    const { key, value } = req.body;
    db.run(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
        [key, value], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Get holidays
app.get('/api/holidays', (req, res) => {
    db.all('SELECT * FROM holidays ORDER BY date', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Add/Update holiday
app.post('/api/holidays', (req, res) => {
    const { date, name } = req.body;
    db.run(`INSERT OR REPLACE INTO holidays (date, name) VALUES (?, ?)`,
        [date, name], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID });
    });
});

// Delete holiday
app.delete('/api/holidays/:id', (req, res) => {
    db.run('DELETE FROM holidays WHERE id = ?', req.params.id, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Get quotes
app.get('/api/quotes', (req, res) => {
    db.all('SELECT * FROM quotes', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Add quote
app.post('/api/quotes', (req, res) => {
    const { text, author } = req.body;
    db.run('INSERT INTO quotes (text, author) VALUES (?, ?)',
        [text, author], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID });
    });
});

// Delete quote
app.delete('/api/quotes/:id', (req, res) => {
    db.run('DELETE FROM quotes WHERE id = ?', req.params.id, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Get products
app.get('/api/products', (req, res) => {
    db.all('SELECT * FROM products ORDER BY position', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Add/Update product
app.post('/api/products', (req, res) => {
    const { id, title, image, link, position } = req.body;
    if (id) {
        db.run(`UPDATE products SET title = ?, image = ?, link = ?, position = ? WHERE id = ?`,
            [title, image, link, position, id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    } else {
        db.run(`INSERT INTO products (title, image, link, position) VALUES (?, ?, ?, ?)`,
            [title, image, link, position || 0], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: this.lastID });
        });
    }
});

// Delete product
app.delete('/api/products/:id', (req, res) => {
    db.run('DELETE FROM products WHERE id = ?', req.params.id, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Get tours
app.get('/api/tours', (req, res) => {
    db.all('SELECT * FROM tours ORDER BY position', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Add/Update tour
app.post('/api/tours', (req, res) => {
    const { id, name, image, departure, transport, date, price, position } = req.body;
    if (id) {
        db.run(`UPDATE tours SET name = ?, image = ?, departure = ?, transport = ?, 
                date = ?, price = ?, position = ? WHERE id = ?`,
            [name, image, departure, transport, date, price, position, id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    } else {
        db.run(`INSERT INTO tours (name, image, departure, transport, date, price, position) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, image, departure, transport, date, price, position || 0], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: this.lastID });
        });
    }
});

// Delete tour
app.delete('/api/tours/:id', (req, res) => {
    db.run('DELETE FROM tours WHERE id = ?', req.params.id, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Get bookings
app.get('/api/bookings', (req, res) => {
    db.all('SELECT * FROM bookings ORDER BY created_at DESC', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Add booking
app.post('/api/bookings', (req, res) => {
    const { tour, customer_name, customer_phone } = req.body;
    db.run(`INSERT INTO bookings (tour, customer_name, customer_phone) VALUES (?, ?, ?)`,
        [tour, customer_name, customer_phone], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID });
    });
});

// Delete booking
app.delete('/api/bookings/:id', (req, res) => {
    db.run('DELETE FROM bookings WHERE id = ?', req.params.id, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Get footer links
app.get('/api/footer-links', (req, res) => {
    db.all('SELECT * FROM footer_links ORDER BY position', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Add/Update footer link
app.post('/api/footer-links', (req, res) => {
    const { id, text, url, position } = req.body;
    if (id) {
        db.run(`UPDATE footer_links SET text = ?, url = ?, position = ? WHERE id = ?`,
            [text, url, position, id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    } else {
        db.run(`INSERT INTO footer_links (text, url, position) VALUES (?, ?, ?)`,
            [text, url, position || 0], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: this.lastID });
        });
    }
});

// Delete footer link
app.delete('/api/footer-links/:id', (req, res) => {
    db.run('DELETE FROM footer_links WHERE id = ?', req.params.id, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Serve admin page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'admin.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
    console.log(`Trang quản trị: http://localhost:${PORT}/admin`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Đã đóng kết nối database.');
        process.exit(0);
    });
});