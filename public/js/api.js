// ===== api.js =====
// Флаг выключен, теперь используем реальный бэкенд
const USE_MOCK = false; 

// Базовый URL для API
const API_BASE = 'http://localhost:3000/api';

// Вспомогательная функция для заголовков с токеном
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

/**
 * Получить список услуг
 */
async function getServices() {
    const res = await fetch(`${API_BASE}/services`);
    if (!res.ok) throw new Error('Ошибка загрузки услуг');
    return res.json();
}

/**
 * Получить заявки текущего клиента
 */
async function getMyRequests() {
    const res = await fetch(`${API_BASE}/requests/my`, { 
        headers: getAuthHeaders() 
    });
    if (!res.ok) throw new Error('Ошибка загрузки заявок');
    return res.json();
}

/**
 * Создать новую заявку (с фото)
 */
async function createRequest(data) {
    const formData = new FormData();
    formData.append('service_id', data.service_id);
    formData.append('description', data.description);
    if (data.photo) {
        formData.append('photo', data.photo);
    }

    const res = await fetch(`${API_BASE}/requests`, {
        method: 'POST',
        headers: getAuthHeaders(), // Content-Type ставить не нужно, браузер сам поставит multipart/form-data
        body: formData
    });
    
    if (!res.ok) throw new Error('Ошибка создания заявки');
    return res.json();
}

/**
 * Получить заявки, назначенные на мастера
 */
async function getMasterRequests() {
    const res = await fetch(`${API_BASE}/requests/master`, { 
        headers: getAuthHeaders() 
    });
    if (!res.ok) throw new Error('Ошибка загрузки заявок мастера');
    return res.json();
}

/**
 * Обновить статус заявки и добавить комментарий/запчасти (Мастер)
 */
async function updateRequest(requestId, status, comment, usedParts, workCost) {
    const res = await fetch(`${API_BASE}/requests/${requestId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
        },
        body: JSON.stringify({
            status: status,
            master_comment: comment,
            used_parts: usedParts,
            total_cost: workCost
        })
    });
    if (!res.ok) throw new Error('Ошибка обновления заявки');
    return res.json();
}

// ==========================================
// ФУНКЦИИ ДЛЯ АДМИНИСТРАТОРА
// ==========================================

async function getAllMasters() {
    const res = await fetch(`${API_BASE}/users/masters`, { 
        headers: getAuthHeaders() 
    });
    if (!res.ok) throw new Error('Ошибка загрузки мастеров');
    return res.json();
}

async function getAllRequests() {
    const res = await fetch(`${API_BASE}/requests`, { 
        headers: getAuthHeaders() 
    });
    if (!res.ok) throw new Error('Ошибка загрузки всех заявок');
    return res.json();
}

async function assignMasterToRequest(requestId, masterId) {
    const res = await fetch(`${API_BASE}/requests/${requestId}/assign`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
        },
        body: JSON.stringify({ master_id: masterId })
    });
    if (!res.ok) throw new Error('Ошибка назначения мастера');
    return res.json();
}

async function getInventory() {
    const res = await fetch(`${API_BASE}/inventory`, { 
        headers: getAuthHeaders() 
    });
    if (!res.ok) throw new Error('Ошибка загрузки склада');
    return res.json();
}

async function addInventoryItem(item) {
    const res = await fetch(`${API_BASE}/inventory`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
        },
        body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error('Ошибка добавления запчасти');
    return res.json();
}

async function getAdminStats() {
    const res = await fetch(`${API_BASE}/stats`, { 
        headers: getAuthHeaders() 
    });
    if (!res.ok) throw new Error('Ошибка загрузки статистики');
    return res.json();
}