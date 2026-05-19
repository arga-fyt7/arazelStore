-- ============================================================
-- ARAZEL STORE — Complete Database Migration
-- Execute this file via phpMyAdmin or MySQL CLI:
--   mysql -u root -p arazel_db < migration.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS arazel_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE arazel_db;

-- ─── USERS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  status ENUM('active', 'suspended', 'blocked') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─── USER ADDRESSES ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_addresses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  label VARCHAR(50) NOT NULL,
  recipient_name VARCHAR(100) NOT NULL,
  recipient_phone VARCHAR(20) NOT NULL,
  street_address TEXT NOT NULL,
  notes TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── NOTIFICATIONS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info', 'promo', 'alert') DEFAULT 'info',
  link VARCHAR(500) DEFAULT NULL,
  active BOOLEAN DEFAULT TRUE,
  `read` BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─── PRODUCTS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(12,2) NOT NULL,
  image VARCHAR(500),
  category VARCHAR(50),
  tags VARCHAR(255) DEFAULT '',
  weight INT DEFAULT 0,
  stock INT DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─── ORDERS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  order_number VARCHAR(20) NOT NULL UNIQUE,
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  delivery_method ENUM('antar', 'jemput') NOT NULL,
  delivery_address TEXT,
  payment_method ENUM('transfer', 'e-wallet', 'cod') NOT NULL,
  promo_code VARCHAR(50),
  discount_amount DECIMAL(12,2) DEFAULT 0,
  subtotal DECIMAL(12,2) NOT NULL,
  shipping_fee DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  status ENUM('pending', 'paid', 'processing', 'done', 'cancelled') DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ─── ORDER ITEMS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT,
  product_name VARCHAR(200) NOT NULL,
  product_price DECIMAL(12,2) NOT NULL,
  quantity INT NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- ─── PAYMENTS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  method ENUM('transfer', 'e-wallet') NOT NULL,
  proof_image VARCHAR(255),
  account_name VARCHAR(100),
  account_number VARCHAR(50),
  amount DECIMAL(12,2) NOT NULL,
  status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- ─── REVIEWS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,
  order_id INT DEFAULT NULL,
  name VARCHAR(100) NOT NULL,
  rating TINYINT DEFAULT 5,
  content TEXT NOT NULL,
  reply TEXT DEFAULT NULL,
  replied_at TIMESTAMP NULL DEFAULT NULL,
  avatar VARCHAR(500) DEFAULT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ─── PROMOS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS promos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  type ENUM('percentage', 'fixed', 'free_shipping') NOT NULL,
  value DECIMAL(12,2) NOT NULL,
  min_purchase DECIMAL(12,2) DEFAULT 0,
  max_discount DECIMAL(12,2) DEFAULT NULL,
  usage_limit INT DEFAULT NULL,
  used_count INT DEFAULT 0,
  start_date DATE,
  end_date DATE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── SETTINGS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT
);

-- ─── SEED DATA ───────────────────────────────────────────────

-- Users (password terenkripsi bcrypt)
-- admin123 → $2a$10$...
-- customer123 → $2a$10$...
INSERT IGNORE INTO users (name, email, password, phone, role, status) VALUES
  ('Admin Arazel', 'admin@arazelstore.com', '$2a$10$8KRj.M.Ong.oaD14e.myFOa32wsSnI18VJsJe6nsnMqmBvvsnW0Wm', '081234567890', 'admin', 'active'),
  ('Budi Santoso', 'customer@arazelstore.com', '$2a$10$v0Ei9oGqk0q9HTE7oGjaGOtMSZ7oNi5UWkyNjLrMcdasUyojasBB.', '081298765432', 'user', 'active');

-- Products
INSERT IGNORE INTO products (name, description, price, image, category, tags, weight, stock, active) VALUES
  ('Dimsum Mentai', 'Dimsum ayam udang dengan saus mentai creamy yang dipanggang hingga kecoklatan. Topping melted cheese dan taburan nori.', 28000, 'https://images.unsplash.com/photo-1604632910793-c0601f361b34?w=400&h=400&fit=crop', 'dimsum', 'best-seller,populer', 200, 30, TRUE),
  ('Es Teh Manis', 'Minuman teh segar dengan gula batu. Cocok untuk melepas dahaga.', 8000, 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=400&fit=crop', 'minuman', 'irit', 250, 100, TRUE);

-- Promos
INSERT IGNORE INTO promos (code, title, description, type, value, min_purchase, max_discount, end_date, active) VALUES
  ('DISKON10', 'Diskon 10% Semua Menu', 'Nikmati diskon 10% untuk setiap pembelian di Arazel Store.', 'percentage', 10, 0, 30000, '2026-07-31', TRUE),
  ('GRATISONGKIR', 'Gratis Ongkir', 'Gratis biaya pengiriman untuk area Jabodetabek tanpa minimal pembelian.', 'free_shipping', 0, 0, NULL, '2026-07-31', TRUE);

-- Settings
INSERT IGNORE INTO settings (setting_key, setting_value) VALUES
  ('store_name', 'Arazel Store'),
  ('store_description', 'Toko Makanan & Minuman'),
  ('store_address', ''),
  ('store_phone', ''),
  ('store_email', ''),
  ('whatsapp_number', ''),
  ('instagram', ''),
  ('payment_transfer', '[{"bank":"Bank BCA","account":"1234567890","name":"Arazel Store"},{"bank":"Bank Mandiri","account":"9876543210","name":"Arazel Store"}]'),
  ('payment_ewallet', '[{"provider":"GoPay","account":"081234567890","name":"Arazel Store"},{"provider":"DANA","account":"081234567890","name":"Arazel Store"}]'),
  ('store_status', 'open'),
  ('maintenance_duration', ''),
  ('maintenance_until', ''),
  ('operational_hours', '{"senin":{"open":"08:00","close":"21:00","active":true},"selasa":{"open":"08:00","close":"21:00","active":true},"rabu":{"open":"08:00","close":"21:00","active":true},"kamis":{"open":"08:00","close":"21:00","active":true},"jumat":{"open":"08:00","close":"21:00","active":true},"sabtu":{"open":"08:00","close":"21:00","active":true},"minggu":{"open":"","close":"","active":false}}'),
  ('announcement_active', 'false'),
  ('announcement_text', ''),
  ('shipping_fee', '10000'),
  ('free_shipping_minimum', '50000'),
  ('store_address_full', 'Jl. Merdeka No. 123, Bandung'),
  ('pickup_estimate', '30-45 menit'),
  ('cod_enabled', 'true');
