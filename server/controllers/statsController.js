const db = require('../config/db');

exports.getStats = async (req, res) => {
    try {
        // Считаем заявки по статусам
        const [rows] = await db.query(`
            SELECT status, COUNT(*) as count 
            FROM requests 
            GROUP BY status
        `);
        
        // Формируем объект вида { accepted: 1, in_repair: 2, ... }
        const requestsByStatus = {
            accepted: 0, diagnostics: 0, in_repair: 0, ready: 0, issued: 0
        };
        rows.forEach(r => {
            if (requestsByStatus[r.status] !== undefined) {
                requestsByStatus[r.status] = r.count;
            }
        });

        // Заглушка для графика доходов (в реальности нужно группировать по месяцам)
        const revenueByMonth = [15000, 22000, 18000, 25000, 30000, 28000];

        res.json({ requestsByStatus, revenueByMonth });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};