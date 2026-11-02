const jwt = require('jsonwebtoken');

// Проверка токена
exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) return res.status(401).json({ error: 'Доступ запрещен. Нет токена.' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Недействительный токен.' });
        req.user = user; // { id, role, name }
        next();
    });
};

// Проверка ролей
exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'У вас нет прав для этого действия.' });
        }
        next();
    };
};