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
        grid.innerHTML = ''; // Очищаем

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
                    <button class="btn btn-primary" onclick="createRequest(${service.id})">
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

// Функция для создания заявки (пока просто заглушка)
function createRequest(serviceId) {
    // Проверяем, авторизован ли пользователь (пока просто имитация)
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Для создания заявки необходимо войти в систему.');
        window.location.href = 'login.html';
        return;
    }
    alert(`Заявка на услугу ID ${serviceId} будет создана (функционал в разработке).`);
}

// Настройка навигации (скрытие кнопок, если пользователь вошёл)
function setupNavigation() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role'); // 'client', 'master', 'admin'

    const navLogin = document.getElementById('nav-login');
    const navRegister = document.getElementById('nav-register');
    const navProfile = document.getElementById('nav-profile');

    if (token) {
        // Пользователь авторизован
        navLogin.style.display = 'none';
        navRegister.style.display = 'none';
        navProfile.textContent = 'Личный кабинет';

        // Ссылка на кабинет в зависимости от роли
        let dashUrl = 'client-dashboard.html';
        if (role === 'master') dashUrl = 'master-dashboard.html';
        if (role === 'admin') dashUrl = 'admin-dashboard.html';
        navProfile.href = dashUrl;

        // Добавим кнопку "Выйти" (можно добавить в HTML, но проще через JS)
        const logoutBtn = document.createElement('a');
        logoutBtn.href = '#';
        logoutBtn.className = 'btn btn-outline';
        logoutBtn.textContent = 'Выйти';
        logoutBtn.onclick = (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('userName');
            window.location.reload();
        };
        // Вставляем после navProfile
        navProfile.parentNode.insertBefore(logoutBtn, navProfile.nextSibling);
    }
}
// ==========================================
// ЛОГИКА ЛИЧНОГО КАБИНЕТА КЛИЕНТА
// ==========================================
if (document.getElementById('client-dashboard')) {
    initClientDashboard();
}

async function initClientDashboard() {
    // 1. Проверка авторизации
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // 2. Приветствие
    const userName = localStorage.getItem('userName') || 'Клиент';
    document.getElementById('user-name-display').textContent = userName;

    // 3. Кнопка выхода
    document.getElementById('logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.clear();
        window.location.href = 'index.html';
    });

    // 4. Загрузка услуг в выпадающий список
    await loadServicesIntoSelect();

    // 5. Загрузка и отрисовка заявок
    await renderMyRequests();

    // 6. Обработка формы создания заявки
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
        
        // Словарь для перевода статусов на русский
        const statusNames = {
            'accepted': 'Принята',
            'diagnostics': 'Диагностика',
            'in_repair': 'В ремонте',
            'ready': 'Готова к выдаче',
            'issued': 'Выдана',
            'cancelled': 'Отменена'
        };

        requests.forEach(req => {
            const tr = document.createElement('tr');
            
            // Форматируем дату (ДД.ММ.ГГГГ)
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
    
    // Валидация (граничные значения из ТЗ)
    if (!serviceId) {
        alert('Пожалуйста, выберите услугу.');
        return;
    }
    if (description.trim().length < 10) {
        alert('Описание должно содержать хотя бы 10 символов.');
        return;
    }

    // Блокируем кнопку на время отправки
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправка...';

    try {
        // Вызываем наш mock-API
        await createRequest({
            service_id: serviceId,
            description: description,
            photo: photoInput.files[0] || null
        });

        alert('Заявка успешно создана! Мастер свяжется с вами.');
        
        // Очищаем форму
        e.target.reset();
        
        // Обновляем таблицу
        await renderMyRequests();

    } catch (error) {
        alert('Ошибка при создании заявки: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}