// ===== api.js =====
// Базовая обёртка для запросов. Пока используется mock-режим.

// Флаг: true — используем заглушки, false — реальные запросы к серверу
const USE_MOCK = true;

// Базовый URL для API (изменится, когда бэкенд будет готов)
const API_BASE = 'http://localhost:3000/api';

/**
 * Получить список услуг
 * @returns {Promise<Array>}
 */
async function getServices() {
    if (USE_MOCK) {
        // Заглушка: возвращаем тестовые данные
        return [
            { id: 1, title: 'Диагностика', description: 'Выявление неисправности устройства', price: 500.00 },
            { id: 2, title: 'Замена экрана', description: 'Замена дисплейного модуля на смартфоне', price: 2500.00 },
            { id: 3, title: 'Замена аккумулятора', description: 'Установка новой батареи', price: 1500.00 },
            { id: 4, title: 'Чистка от пыли', description: 'Профилактическая чистка ноутбука', price: 1000.00 }
        ];
    }

    // Реальный запрос (включим позже)
    const res = await fetch(`${API_BASE}/services`);
    if (!res.ok) throw new Error('Ошибка загрузки услуг');
    return res.json();
}
// ==========================================
// MOCK-ДАННЫЕ ДЛЯ ЗАЯВОК (имитация БД)
// ==========================================
let mockRequests = [
    {
        id: 101,
        service_id: 1,
        service_title: 'Диагностика',
        description: 'Не включается ноутбук после залития.',
        status: 'in_repair',
        created_at: '2026-10-25T10:30:00',
        total_cost: 500.00
    },
    {
        id: 102,
        service_id: 3,
        service_title: 'Замена аккумулятора',
        description: 'Быстро разряжается телефон.',
        status: 'ready',
        created_at: '2026-10-28T14:15:00',
        total_cost: 1500.00
    }
];

/**
 * Получить заявки текущего пользователя
 */
async function getMyRequests() {
    if (USE_MOCK) {
        // Имитация задержки сети
        await new Promise(r => setTimeout(r, 300));
        return [...mockRequests]; // Возвращаем копию массива
    }
    // Реальный запрос (позже):
    // const res = await fetch(`${API_BASE}/requests/my`, { headers: getAuthHeaders() });
    // return res.json();
}

/**
 * Создать новую заявку
 */
async function createRequest(data) {
    if (USE_MOCK) {
        await new Promise(r => setTimeout(r, 500));
        
        // Находим название услуги по ID
        const services = await getServices();
        const service = services.find(s => s.id == data.service_id);
        
        const newReq = {
            id: Math.floor(Math.random() * 1000) + 200, // Случайный ID
            service_id: data.service_id,
            service_title: service ? service.title : 'Неизвестно',
            description: data.description,
            status: 'accepted', // Новые заявки всегда "Приняты"
            created_at: new Date().toISOString(),
            total_cost: service ? service.price : 0
        };
        
        mockRequests.unshift(newReq); // Добавляем в начало списка
        return { success: true, request: newReq };
    }
    // Реальный запрос (позже):
    // const res = await fetch(`${API_BASE}/requests`, { method: 'POST', ... });
    // return res.json();
}
// ==========================================
// MOCK-ФУНКЦИИ ДЛЯ МАСТЕРА
// ==========================================

/**
 * Получить заявки, назначенные на мастера
 */
async function getMasterRequests() {
    if (USE_MOCK) {
        await new Promise(r => setTimeout(r, 300));
        // В реальности тут будет фильтр по master_id, но для теста вернем все
        return [...mockRequests]; 
    }
    // Реальный запрос:
    // const res = await fetch(`${API_BASE}/requests/master`, { headers: getAuthHeaders() });
    // return res.json();
}

/**
 * Обновить статус заявки и добавить комментарий/запчасти
 */
async function updateRequest(requestId, status, comment, usedParts, workCost) {
    if (USE_MOCK) {
        await new Promise(r => setTimeout(r, 400));
        
        // Находим заявку в "базе" и обновляем её
        const reqIndex = mockRequests.findIndex(r => r.id == requestId);
        if (reqIndex !== -1) {
            mockRequests[reqIndex].status = status;
            
            // Если передан комментарий, сохраняем его (в реальности — в таблицу comments)
            if (comment) {
                console.log(`[БД] Добавлен комментарий к заявке #${requestId}: ${comment}`);
            }
            
            // Если переданы запчасти и стоимость, обновляем итоговую сумму
            if (workCost) {
                mockRequests[reqIndex].total_cost = Number(workCost);
            }
            if (usedParts) {
                console.log(`[БД] Списаны запчасти по заявке #${requestId}: ${usedParts}`);
            }
            
            return { success: true };
        }
        return { success: false, error: 'Заявка не найдена' };
    }
    // Реальный запрос:
    // const res = await fetch(`${API_BASE}/requests/${requestId}`, { method: 'PATCH', ... });
    // return res.json();
}
// ==========================================
// MOCK-ДАННЫЕ ДЛЯ АДМИНИСТРАТОРА
// ==========================================

// Список сотрудников (мастера)
let mockMasters = [
    { id: 2, full_name: 'Сергей Мастеров', email: 'master@test.ru', role: 'master' }
];

// Склад запчастей
let mockInventory = [
    { id: 1, part_name: 'Экран iPhone 13', quantity: 5, price: 8000.00 },
    { id: 2, part_name: 'Аккумулятор Samsung S21', quantity: 10, price: 2000.00 },
    { id: 3, part_name: 'Термопаста Arctic', quantity: 20, price: 300.00 }
];

// Функции для админа
async function getAllMasters() {
    if (USE_MOCK) {
        await new Promise(r => setTimeout(r, 200));
        return [...mockMasters];
    }
}

async function getAllRequests() {
    if (USE_MOCK) {
        await new Promise(r => setTimeout(r, 200));
        return [...mockRequests]; // Берем заявки из общей "базы"
    }
}

async function assignMasterToRequest(requestId, masterId) {
    if (USE_MOCK) {
        await new Promise(r => setTimeout(r, 300));
        const req = mockRequests.find(r => r.id == requestId);
        if (req) {
            req.master_id = masterId;
            return { success: true };
        }
        return { success: false };
    }
}

async function getInventory() {
    if (USE_MOCK) {
        await new Promise(r => setTimeout(r, 200));
        return [...mockInventory];
    }
}

async function addInventoryItem(item) {
    if (USE_MOCK) {
        await new Promise(r => setTimeout(r, 300));
        const newItem = {
            id: Math.floor(Math.random() * 1000) + 100,
            part_name: item.part_name,
            quantity: item.quantity,
            price: item.price
        };
        mockInventory.push(newItem);
        return { success: true, item: newItem };
    }
}

// Заглушка для статистики (для графиков)
async function getAdminStats() {
    if (USE_MOCK) {
        return {
            requestsByStatus: {
                'accepted': 3,
                'diagnostics': 2,
                'in_repair': 5,
                'ready': 1,
                'issued': 10
            },
            revenueByMonth: [15000, 22000, 18000, 25000, 30000, 28000] // За 6 месяцев
        };
    }
}