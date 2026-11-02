require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Импорт роутов
const authRoutes = require('./routes/authRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const requestRoutes = require('./routes/requestRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const statsRoutes = require('./routes/statsRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Раздача статики (ваш фронтенд)
// Указываем путь на уровень выше, в папку public
app.use(express.static(path.join(__dirname, '../public')));

// API Роуты
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/users', userRoutes);

// Обработка ошибок (глобальный перехватчик)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message || 'Что-то пошло не так!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен: http://localhost:${PORT}`);
});