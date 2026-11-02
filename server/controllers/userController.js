const db = require('../config/db');

// Получить всех мастеров (для выпадающего списка админа)
exports.getMasters = async (req, res) => {
    try {
        const [masters] = await db.query("SELECT id, full_name, email FROM users WHERE role = 'master'");
        res.json(masters);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};