// ===== client.js =====
document.addEventListener('DOMContentLoaded', async () => {
    await renderServices();
    setupNavigation();
});

async function renderServices() {
    const grid = document.getElementById('services-grid');
    if (!grid) return;

    try {
        const services = await getServices();
        grid.innerHTML = '';

        services.forEach(service => {
            const card = document.createElement('div');
            card.className = 'service-card';
            card.innerHTML = `
                <div>
                    <h3>${service.title}</h3>
                    <p>${service.description}</p>
                </div>
                <div>
                    <div class="service-price">${service.price} ₽</div>
                    <button class="btn btn-primary" onclick="redirectToCreateRequest(${service.id})">
                        Оставить заявку
                    </button>
                </div>
            `;
            grid.appendChild(card);
        });
    } catch (error) {
        console.error('Ошибка:', error);
        grid.innerHTML = '<p>Не удалось загрузить услуги. Попробуйте позже.</p>';
    }
}

// Перенаправление на личный кабинет для создания заявки
function redirectToCreateRequest(serviceId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Для создания заявки необходимо войти в систему.');
        window.location.href = 'login.html';
        return;
    }
    // Сохраняем выбранную услугу, чтобы в кабинете она выбралась автоматически
    localStorage.setItem('preselected_service', serviceId);
    window.location.href = 'client-dashboard.html';
}

// Настройка навигации
function setupNavigation() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    const navLogin = document.getElementById('nav-login');
    const navRegister = document.getElementById('nav-register');
    const navProfile = document.getElementById('nav-profile');

    if (token) {
        if (navLogin) navLogin.style.display = 'none';
        if (navRegister) navRegister.style.display = 'none';
        
        if (navProfile) {
            let dashUrl = 'client-dashboard.html';
            if (role === 'master') dashUrl = 'master-dashboard.html';
            if (role === 'admin') dashUrl = 'admin-dashboard.html';
            navProfile.href = dashUrl;

            const logoutBtn = document.createElement('a');
            logoutBtn.href = '#';
            logoutBtn.className = 'btn btn-outline';
            logoutBtn.textContent = 'Выйти';
            logoutBtn.onclick = (e) => {
                e.preventDefault();
                localStorage.clear();
                window.location.reload();
            };
            navProfile.parentNode.insertBefore(logoutBtn, navProfile.nextSibling);
        }
    }
}

// ==========================================
// ЛОГИКА ЛИЧНОГО КАБИНЕТА КЛИЕНТА
// ==========================================
if (document.getElementById('client-dashboard')) {
    initClientDashboard();
}

async function initClientDashboard() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('user-name-display').textContent = localStorage.getItem('userName') || 'Клиент';

    document.getElementById('logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.clear();
        window.location.href = 'index.html';
    });

    await loadServicesIntoSelect();
    await renderMyRequests();

    document.getElementById('new-request-form').addEventListener('submit', handleNewRequest);
}

async function loadServicesIntoSelect() {
    const select = document.getElementById('service-select');
    try {
        const services = await getServices();
        select.innerHTML = '<option value="">-- Выберите услугу --</option>';
        services.forEach(s => {
            const option = document.createElement('option');
            option.value = s.id;
            option.textContent = `${s.title} (от ${s.price} ₽)`;
            select.appendChild(option);
        });

        // Если пользователь кликнул на услугу на главной странице
        const preselected = localStorage.getItem('preselected_service');
        if (preselected) {
            select.value = preselected;
            localStorage.removeItem('preselected_service');
        }
    } catch (error) {
        console.error('Ошибка загрузки услуг', error);
    }
}

async function renderMyRequests() {
    const tbody = document.getElementById('requests-table-body');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Загрузка...</td></tr>';

    try {
        const requests = await getMyRequests();
        
        if (requests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#64748b;">У вас пока нет заявок</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        const statusNames = {
            'accepted': 'Принята', 'diagnostics': 'Диагностика',
            'in_repair': 'В ремонте', 'ready': 'Готова к выдаче', 'issued': 'Выдана', 'cancelled': 'Отменена'
        };

        requests.forEach(req => {
            const tr = document.createElement('tr');
            const date = new Date(req.created_at).toLocaleDateString('ru-RU');
            
            tr.innerHTML = `
                <td>#${req.id}</td>
                <td>${req.service_title}</td>
                <td>${date}</td>
                <td><span class="status-badge status-${req.status}">${statusNames[req.status] || req.status}</span></td>
                <td>${req.total_cost} ₽</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Ошибка загрузки заявок', error);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Ошибка загрузки данных</td></tr>';
    }
}

async function handleNewRequest(e) {
    e.preventDefault();
    
    const serviceId = document.getElementById('service-select').value;
    const description = document.getElementById('request-desc').value;
    const photoInput = document.getElementById('request-photo');
    
    if (!serviceId) return alert('Пожалуйста, выберите услугу.');
    if (description.trim().length < 10) return alert('Описание должно содержать хотя бы 10 символов.');

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправка...';

    try {
        await createRequest({
            service_id: serviceId,
            description: description,
            photo: photoInput.files[0] || null
        });

        alert('Заявка успешно создана!');
        e.target.reset();
        await renderMyRequests();
    } catch (error) {
        alert('Ошибка при создании заявки: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}