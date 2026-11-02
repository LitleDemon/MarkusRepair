// ===== auth.js =====

const API_BASE = 'http://localhost:3000/api';

// --- 1. Обработка формы ВХОДА ---
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;

        submitBtn.disabled = true;
        submitBtn.textContent = 'Вход...';

        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!res.ok) {
                throw new Error('Неверный email или пароль');
            }

            const data = await res.json();
            
            // Сохраняем данные сессии
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('role', data.role);
            localStorage.setItem('userName', data.name);

            // Перенаправляем в нужный кабинет
            if (data.role === 'master') {
                window.location.href = 'master-dashboard.html';
            } else if (data.role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else {
                window.location.href = 'client-dashboard.html';
            }
        } catch (error) {
            alert(error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}

// --- 2. Обработка формы РЕГИСТРАЦИИ ---
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const full_name = document.getElementById('full_name').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm_password').value;

        if (password !== confirmPassword) {
            return alert('Ошибка: Пароли не совпадают!');
        }

        const submitBtn = registerForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Регистрация...';

        try {
            const res = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ full_name, email, phone, password })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Ошибка регистрации');
            }

            alert('Регистрация успешна! Теперь вы можете войти.');
            window.location.href = 'login.html';
        } catch (error) {
            alert(error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}