const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(401).json({ error: 'Неверный email или пароль' });

        const user = users[0];
        const validPass = await bcrypt.compare(password, user.password_hash);
        if (!validPass) return res.status(401).json({ error: 'Неверный email или пароль' });

        const token = jwt.sign(
            { id: user.id, role: user.role, name: user.full_name },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Возвращаем в формате, который ожидает ваш auth.js
        res.json({ 
            access_token: token, 
            role: user.role, 
            name: user.full_name 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.register = async (req, res) => {
    const { email, password, full_name, phone } = req.body;
    try {
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(400).json({ error: 'Email уже занят' });

        const hash = await bcrypt.hash(password, 10);
        // По умолчанию регистрируем как клиента
        const [result] = await db.query(
            'INSERT INTO users (email, password_hash, full_name, phone, role) VALUES (?, ?, ?, ?, "client")',
            [email, hash, full_name, phone]
        );
        res.status(201).json({ success: true, id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};