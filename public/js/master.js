// ===== master.js =====

document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('master-dashboard')) return;

    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token || role !== 'master') {
        alert('Доступ запрещен. Войдите как мастер.');
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('user-name-display').textContent = localStorage.getItem('userName') || 'Мастер';
    document.getElementById('logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.clear();
        window.location.href = 'index.html';
    });

    loadMasterRequests();
    setupModal();
});

async function loadMasterRequests() {
    const tbody = document.getElementById('master-requests-table-body');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Загрузка...</td></tr>';

    try {
        const requests = await getMasterRequests();
        
        if (requests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#64748b;">Нет назначенных заявок</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        const statusNames = {
            'accepted': 'Принята', 'diagnostics': 'Диагностика',
            'in_repair': 'В ремонте', 'ready': 'Готова к выдаче', 'issued': 'Выдана'
        };

        requests.forEach(req => {
            const tr = document.createElement('tr');
            const date = new Date(req.created_at).toLocaleDateString('ru-RU');
            
            tr.innerHTML = `
                <td>#${req.id}</td>
                <td>${req.service_title}</td>
                <td>${req.description}</td>
                <td>${date}</td>
                <td><span class="status-badge status-${req.status}">${statusNames[req.status]}</span></td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="openEditModal(${req.id})">Обработать</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error('Ошибка:', error);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">Ошибка загрузки</td></tr>';
    }
}

let currentRequestsCache = [];

async function openEditModal(requestId) {
    currentRequestsCache = await getMasterRequests();
    const req = currentRequestsCache.find(r => r.id == requestId);
    
    if (!req) return;

    document.getElementById('modal-request-id').textContent = `#${req.id}`;
    document.getElementById('modal-req-id-input').value = req.id;
    document.getElementById('modal-status').value = req.status;
    document.getElementById('modal-cost').value = req.total_cost;
    document.getElementById('modal-comment').value = req.master_comment || '';
    document.getElementById('modal-parts').value = req.used_parts || '';

    document.getElementById('edit-modal').classList.add('active');
}

function setupModal() {
    const modal = document.getElementById('edit-modal');
    const closeBtn = document.getElementById('close-modal');
    const form = document.getElementById('edit-request-form');

    closeBtn.onclick = () => modal.classList.remove('active');
    window.onclick = (e) => { if (e.target === modal) modal.classList.remove('active'); };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const requestId = document.getElementById('modal-req-id-input').value;
        const status = document.getElementById('modal-status').value;
        const comment = document.getElementById('modal-comment').value.trim();
        const parts = document.getElementById('modal-parts').value.trim();
        const cost = document.getElementById('modal-cost').value;

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Сохранение...';

        try {
            await updateRequest(requestId, status, comment, parts, cost);
            
            modal.classList.remove('active');
            alert('Изменения сохранены!');
            await loadMasterRequests();
        } catch (error) {
            alert('Ошибка сохранения: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Сохранить изменения';
            form.reset();
        }
    });
}