const db = require('../config/db');

// Клиент: создать заявку
exports.createRequest = async (req, res) => {
    const { service_id, description } = req.body;
    const photo_url = req.file ? `/uploads/${req.file.filename}` : null;
    const client_id = req.user.id; // Берем из токена!

    try {
        const [result] = await db.query(
            'INSERT INTO requests (client_id, service_id, description, photo_url) VALUES (?, ?, ?, ?)',
            [client_id, service_id, description, photo_url]
        );
        res.status(201).json({ success: true, id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Клиент: получить свои заявки
exports.getMyRequests = async (req, res) => {
    try {
        const [requests] = await db.query(`
            SELECT r.*, s.title AS service_title 
            FROM requests r
            JOIN services s ON r.service_id = s.id
            WHERE r.client_id = ?
            ORDER BY r.created_at DESC
        `, [req.user.id]);
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Мастер: получить назначенные заявки
exports.getMasterRequests = async (req, res) => {
    try {
        const [requests] = await db.query(`
            SELECT r.*, s.title AS service_title 
            FROM requests r
            JOIN services s ON r.service_id = s.id
            WHERE r.master_id = ?
            ORDER BY r.created_at DESC
        `, [req.user.id]);
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Мастер: обновить заявку (статус, стоимость, коммент)
exports.updateRequest = async (req, res) => {
    const { id } = req.params;
    const { status, master_comment, total_cost, used_parts } = req.body;
    
    try {
        // Проверяем, что заявка принадлежит этому мастеру
        const [check] = await db.query('SELECT id FROM requests WHERE id = ? AND master_id = ?', [id, req.user.id]);
        if (check.length === 0) return res.status(403).json({ error: 'Заявка не найдена или не назначена вам' });

        await db.query(
            'UPDATE requests SET status = ?, master_comment = ?, total_cost = ?, used_parts = ? WHERE id = ?',
            [status, master_comment, total_cost, JSON.stringify(used_parts || {}), id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Админ: получить все заявки
exports.getAllRequests = async (req, res) => {
    try {
        const [requests] = await db.query(`
            SELECT r.*, s.title AS service_title, u.full_name AS master_name 
            FROM requests r
            JOIN services s ON r.service_id = s.id
            LEFT JOIN users u ON r.master_id = u.id
            ORDER BY r.created_at DESC
        `);
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Админ: назначить мастера
exports.assignMaster = async (req, res) => {
    const { id } = req.params;
    const { master_id } = req.body;
    try {
        await db.query('UPDATE requests SET master_id = ? WHERE id = ?', [master_id, id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};