SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

CREATE DATABASE IF NOT EXISTS repair_shop
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE repair_shop;

-- ---------- Пользователи ----------
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(150) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  phone         VARCHAR(50) NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('client','master','admin') NOT NULL DEFAULT 'client',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------- Услуги (Каталог) ----------
CREATE TABLE IF NOT EXISTS services (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(150) NOT NULL,
  description TEXT,
  price       DECIMAL(10,2) NOT NULL,          -- Базовая цена
  image_url   VARCHAR(500) NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_services_active (is_active)
) ENGINE=InnoDB;

-- ---------- Склад запчастей ----------
CREATE TABLE IF NOT EXISTS inventory (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  part_name   VARCHAR(150) NOT NULL,
  quantity    INT NOT NULL DEFAULT 0,
  price       DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_inventory_part (part_name)
) ENGINE=InnoDB;

-- ---------- Заявки на ремонт ----------
CREATE TABLE IF NOT EXISTS requests (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  client_id      INT NOT NULL,
  master_id      INT NULL,
  service_id     INT NOT NULL,
  description    TEXT NOT NULL,
  photo_url      VARCHAR(500) NULL,
  status         ENUM('accepted','diagnostics','in_repair','ready','issued','cancelled') NOT NULL DEFAULT 'accepted',
  total_cost     DECIMAL(10,2) NOT NULL DEFAULT 0,
  master_comment TEXT NULL,
  used_parts     JSON NULL,                    -- [{"part_id":1,"name":"Экран","qty":1}] или просто текст, если проще
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_req_client  FOREIGN KEY (client_id)  REFERENCES users(id)    ON DELETE CASCADE,
  CONSTRAINT fk_req_master  FOREIGN KEY (master_id)  REFERENCES users(id)    ON DELETE SET NULL,
  CONSTRAINT fk_req_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT,
  
  INDEX idx_req_status (status),
  INDEX idx_req_client (client_id),
  INDEX idx_req_master (master_id)
) ENGINE=InnoDB;

-- ---------- Блог / Новости (опционально) ----------
CREATE TABLE IF NOT EXISTS posts (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  title      VARCHAR(200) NOT NULL,
  excerpt    VARCHAR(300),
  body       MEDIUMTEXT NOT NULL,
  cover_url  VARCHAR(500),
  author_id  INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_posts_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =========================================================
-- Тестовые данные (Совпадают с mock-данными из вашего api.js)
-- =========================================================

-- Пароль для всех: 123456 (в реальности хеш bcrypt будет другим)
INSERT INTO users (full_name, email, phone, password_hash, role) VALUES
('Иван Клиентов', 'client@test.ru', '+7 (900) 111-22-33', '$2b$10$EPI7Wq2T.a4q.Q.2Q.2Q.2uQ.2Q.2Q.2Q.2Q.2Q.2Q.2Q.2Q.2Q.2', 'client'),
('Сергей Мастеров', 'master@test.ru', '+7 (900) 444-55-66', '$2b$10$EPI7Wq2T.a4q.Q.2Q.2Q.2uQ.2Q.2Q.2Q.2Q.2Q.2Q.2Q.2Q.2Q.2', 'master'),
('Админ Админов', 'admin@test.ru', NULL, '$2b$10$EPI7Wq2T.a4q.Q.2Q.2Q.2uQ.2Q.2Q.2Q.2Q.2Q.2Q.2Q.2Q.2Q.2', 'admin');

INSERT INTO services (title, description, price, image_url) VALUES
('Диагностика', 'Выявление неисправности устройства', 500.00, 'https://picsum.photos/seed/diag/600/450'),
('Замена экрана', 'Замена дисплейного модуля на смартфоне', 2500.00, 'https://picsum.photos/seed/screen/600/450'),
('Замена аккумулятора', 'Установка новой батареи', 1500.00, 'https://picsum.photos/seed/battery/600/450'),
('Чистка от пыли', 'Профилактическая чистка ноутбука', 1000.00, 'https://picsum.photos/seed/clean/600/450');

INSERT INTO inventory (part_name, quantity, price) VALUES
('Экран iPhone 13', 5, 8000.00),
('Аккумулятор Samsung S21', 10, 2000.00),
('Термопаста Arctic', 20, 300.00);

INSERT INTO requests (client_id, master_id, service_id, description, status, total_cost) VALUES
(1, 2, 1, 'Не включается ноутбук после залития.', 'in_repair', 500.00),
(1, NULL, 3, 'Быстро разряжается телефон.', 'ready', 1500.00);