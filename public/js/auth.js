// ===== auth.js =====

// --- 1. Обработка формы ВХОДА ---
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Отменяем перезагрузку страницы
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        // Имитация запроса к серверу (заглушка)
        simulateLogin(email, password);
    });
}

function simulateLogin(email, password) {
    // В реальности здесь будет fetch('/api/auth/login', ...)
    
    // Определяем роль по тестовому email
    let role = 'client';
    let name = 'Клиент';
    
    if (email === 'master@test.ru') {
        role = 'master';
        name = 'Мастер';
    } else if (email === 'admin@test.ru') {
        role = 'admin';
        name = 'Администратор';
    } else if (email === 'client@test.ru') {
        role = 'client';
        name = 'Клиент';
    } else {
        // Если ввели другой email, просто регистрируем как клиента
        role = 'client';
        name = email.split('@')[0];
    }

    // Сохраняем данные сессии в localStorage
    localStorage.setItem('token', 'mock-jwt-token-12345');
    localStorage.setItem('role', role);
    localStorage.setItem('userName', name);

    // Перенаправляем в нужный кабинет
    if (role === 'master') {
        window.location.href = 'master-dashboard.html';
    } else if (role === 'admin') {
        window.location.href = 'admin-dashboard.html';
    } else {
        window.location.href = 'client-dashboard.html';
    }
}

// --- 2. Обработка формы РЕГИСТРАЦИИ ---
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm_password').value;

        // Валидация: пароли должны совпадать
        if (password !== confirmPassword) {
            alert('Ошибка: Пароли не совпадают!');
            return;
        }

        // Имитация успешной регистрации
        alert('Регистрация успешна! Теперь вы можете войти в систему.');
        window.location.href = 'login.html';
    });
}