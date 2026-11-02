const db = require('../config/db');

exports.getInventory = async (req, res) => {
    try {
        const [items] = await db.query('SELECT * FROM inventory');
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.addItem = async (req, res) => {
    const { part_name, quantity, price } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO inventory (part_name, quantity, price) VALUES (?, ?, ?)',
            [part_name, quantity, price]
        );
        res.status(201).json({ success: true, id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};