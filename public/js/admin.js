// ===== admin.js =====

document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('admin-dashboard')) return;

    // 1. Проверка авторизации
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (!token || role !== 'admin') {
        alert('Доступ запрещен.');
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('user-name-display').textContent = localStorage.getItem('userName') || 'Админ';
    document.getElementById('logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.clear();
        window.location.href = 'index.html';
    });

    // 2. Настройка табов
    setupTabs();

    // 3. Загрузка данных для всех вкладок
    loadAdminRequests();
    loadInventory();
    loadStaff();
    initCharts();

    // 4. Обработчики форм
    document.getElementById('add-inventory-form').addEventListener('submit', handleAddInventory);
    setupAssignModal();
});

// ===== 1. ЛОГИКА ТАБОВ =====
function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Убираем активный класс у всех
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Добавляем активный текущему
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-tab');
            document.getElementById(targetId).classList.add('active');
        });
    });
}

// ===== 2. ВКЛАДКА "ЗАЯВКИ" =====
async function loadAdminRequests() {
    const tbody = document.getElementById('admin-requests-table-body');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Загрузка...</td></tr>';

    try {
        const [requests, masters] = await Promise.all([getAllRequests(), getAllMasters()]);
        
        tbody.innerHTML = '';
        const statusNames = {
            'accepted': 'Принята', 'diagnostics': 'Диагностика',
            'in_repair': 'В ремонте', 'ready': 'Готова к выдаче', 'issued': 'Выдана'
        };

        requests.forEach(req => {
            const tr = document.createElement('tr');
            // Ищем имя мастера по ID
            const master = masters.find(m => m.id === req.master_id);
            const masterName = master ? master.full_name : '<span style="color:red;">Не назначен</span>';
            
            tr.innerHTML = `
                <td>#${req.id}</td>
                <td>Клиент (ID: ${req.client_id || 1})</td>
                <td>${req.service_title}</td>
                <td><span class="status-badge status-${req.status}">${statusNames[req.status]}</span></td>
                <td>${masterName}</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="openAssignModal(${req.id})">Назначить</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="6" style="color:red; text-align:center;">Ошибка загрузки</td></tr>';
    }
}

// Модалка назначения мастера
let mastersCache = [];
async function openAssignModal(reqId) {
    document.getElementById('assign-request-id').textContent = `#${reqId}`;
    document.getElementById('assign-req-id-input').value = reqId;
    
    const select = document.getElementById('master-select');
    select.innerHTML = '<option value="">-- Выберите --</option>';
    
    mastersCache = await getAllMasters();
    mastersCache.forEach(m => {
        select.innerHTML += `<option value="${m.id}">${m.full_name} (ID: ${m.id})</option>`;
    });

    document.getElementById('assign-modal').classList.add('active');
}

function setupAssignModal() {
    const modal = document.getElementById('assign-modal');
    document.getElementById('close-assign-modal').onclick = () => modal.classList.remove('active');
    window.onclick = (e) => { if (e.target === modal) modal.classList.remove('active'); };

    document.getElementById('assign-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const reqId = document.getElementById('assign-req-id-input').value;
        const masterId = document.getElementById('master-select').value;
        
        if (!masterId) return alert('Выберите мастера');

        await assignMasterToRequest(reqId, masterId);
        modal.classList.remove('active');
        loadAdminRequests(); // Обновляем таблицу
        alert('Мастер назначен!');
    });
}

// ===== 3. ВКЛАДКА "СКЛАД" =====
async function loadInventory() {
    const tbody = document.getElementById('admin-inventory-table-body');
    const items = await getInventory();
    
    tbody.innerHTML = '';
    items.forEach(item => {
        tbody.innerHTML += `
            <tr>
                <td>${item.id}</td>
                <td>${item.part_name}</td>
                <td>${item.quantity} шт.</td>
                <td>${item.price} ₽</td>
            </tr>
        `;
    });
}

async function handleAddInventory(e) {
    e.preventDefault();
    const name = document.getElementById('inv-name').value;
    const qty = document.getElementById('inv-qty').value;
    const price = document.getElementById('inv-price').value;

    await addInventoryItem({ part_name: name, quantity: qty, price: price });
    e.target.reset();
    loadInventory(); // Обновляем таблицу
    alert('Запчасть добавлена на склад!');
}

// ===== 4. ВКЛАДКА "СОТРУДНИКИ" =====
async function loadStaff() {
    const tbody = document.getElementById('admin-staff-table-body');
    const masters = await getAllMasters();
    
    tbody.innerHTML = '';
    masters.forEach(m => {
        tbody.innerHTML += `
            <tr>
                <td>${m.id}</td>
                <td>${m.full_name}</td>
                <td>${m.email}</td>
                <td><span class="status-badge status-ready">${m.role}</span></td>
            </tr>
        `;
    });
}

// ===== 5. ВКЛАДКА "СТАТИСТИКА" (ГРАФИКИ) =====
async function initCharts() {
    const stats = await getAdminStats();

    // График 1: Круговая диаграмма статусов
    const ctxStatus = document.getElementById('statusChart').getContext('2d');
    new Chart(ctxStatus, {
        type: 'doughnut',
        data: {
            labels: ['Принята', 'Диагностика', 'В ремонте', 'Готова', 'Выдана'],
            datasets: [{
                data: Object.values(stats.requestsByStatus),
                backgroundColor: ['#3b82f6', '#f59e0b', '#f97316', '#10b981', '#64748b']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // График 2: Линейный график дохода
    const ctxRevenue = document.getElementById('revenueChart').getContext('2d');
    new Chart(ctxRevenue, {
        type: 'line',
        data: {
            labels: ['Май', 'Июнь', 'Июль', 'Авг', 'Сент', 'Окт'],
            datasets: [{
                label: 'Доход (₽)',
                data: stats.revenueByMonth,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.3 // Плавные линии
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}