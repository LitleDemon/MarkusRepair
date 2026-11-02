// ===== admin.js =====

document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('admin-dashboard')) return;

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

    setupTabs();
    loadAdminRequests();
    loadInventory();
    loadStaff();
    initCharts();

    document.getElementById('add-inventory-form').addEventListener('submit', handleAddInventory);
    setupAssignModal();
});

function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.getAttribute('data-tab')).classList.add('active');
        });
    });
}

async function loadAdminRequests() {
    const tbody = document.getElementById('admin-requests-table-body');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Загрузка...</td></tr>';

    try {
        const requests = await getAllRequests();
        tbody.innerHTML = '';
        
        const statusNames = {
            'accepted': 'Принята', 'diagnostics': 'Диагностика',
            'in_repair': 'В ремонте', 'ready': 'Готова к выдаче', 'issued': 'Выдана'
        };

        requests.forEach(req => {
            const tr = document.createElement('tr');
            // Бэкенд возвращает master_name напрямую (JOIN в контроллере)
            const masterName = req.master_name ? req.master_name : '<span style="color:red;">Не назначен</span>';
            
            tr.innerHTML = `
                <td>#${req.id}</td>
                <td>Клиент (ID: ${req.client_id})</td>
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

async function openAssignModal(reqId) {
    document.getElementById('assign-request-id').textContent = `#${reqId}`;
    document.getElementById('assign-req-id-input').value = reqId;
    
    const select = document.getElementById('master-select');
    select.innerHTML = '<option value="">-- Выберите --</option>';
    
    try {
        const masters = await getAllMasters();
        masters.forEach(m => {
            select.innerHTML += `<option value="${m.id}">${m.full_name} (ID: ${m.id})</option>`;
        });
        document.getElementById('assign-modal').classList.add('active');
    } catch (err) {
        alert("Ошибка загрузки мастеров");
    }
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

        try {
            await assignMasterToRequest(reqId, masterId);
            modal.classList.remove('active');
            loadAdminRequests();
            alert('Мастер назначен!');
        } catch (err) {
            alert("Ошибка при назначении");
        }
    });
}

async function loadInventory() {
    const tbody = document.getElementById('admin-inventory-table-body');
    try {
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
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="4" style="color:red;">Ошибка загрузки</td></tr>';
    }
}

async function handleAddInventory(e) {
    e.preventDefault();
    const name = document.getElementById('inv-name').value;
    const qty = document.getElementById('inv-qty').value;
    const price = document.getElementById('inv-price').value;

    try {
        await addInventoryItem({ part_name: name, quantity: qty, price: price });
        e.target.reset();
        loadInventory();
        alert('Запчасть добавлена на склад!');
    } catch (err) {
        alert("Ошибка при добавлении");
    }
}

async function loadStaff() {
    const tbody = document.getElementById('admin-staff-table-body');
    try {
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
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="4" style="color:red;">Ошибка загрузки</td></tr>';
    }
}

async function initCharts() {
    try {
        const stats = await getAdminStats();

        const ctxStatus = document.getElementById('statusChart').getContext('2d');
        new Chart(ctxStatus, {
            type: 'doughnut',
            data: {
                labels: ['Принята', 'Диагностика', 'В ремонте', 'Готова', 'Выдана'],
                datasets: [{
                    data: [
                        stats.requestsByStatus.accepted || 0,
                        stats.requestsByStatus.diagnostics || 0,
                        stats.requestsByStatus.in_repair || 0,
                        stats.requestsByStatus.ready || 0,
                        stats.requestsByStatus.issued || 0
                    ],
                    backgroundColor: ['#3b82f6', '#f59e0b', '#f97316', '#10b981', '#64748b']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });

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
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } }
            }
        });
    } catch (err) {
        console.error("Ошибка графиков", err);
    }
}