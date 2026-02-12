-- CopyPoz Web Dashboard Database Schema
-- MySQL 5.7 Compatible

CREATE DATABASE IF NOT EXISTS fx_dashboard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fx_dashboard;

-- Kullanıcılar (Admin, Trader, Viewer)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'trader', 'viewer') DEFAULT 'viewer',
    auth_token VARCHAR(255) UNIQUE NULL,
    auth_token_expires DATETIME NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Client Terminalleri (EA'lar)
CREATE TABLE IF NOT EXISTS clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_number BIGINT NOT NULL UNIQUE,
    account_name VARCHAR(100),
    auth_token VARCHAR(64) NOT NULL,
    status ENUM('active', 'paused', 'disconnected') DEFAULT 'active',
    last_seen TIMESTAMP NULL,
    balance DOUBLE DEFAULT 0,
    equity DOUBLE DEFAULT 0,
    open_positions INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Trader - Client İlişkisi (Hangi trader hangi clientları yönetebilir)
CREATE TABLE IF NOT EXISTS trader_clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trader_id INT NOT NULL,
    client_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trader_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    UNIQUE KEY unique_trader_client (trader_id, client_id)
);

-- Master Sinyalleri (Son Durum)
CREATE TABLE IF NOT EXISTS master_state (
    id INT AUTO_INCREMENT PRIMARY KEY,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    total_positions INT DEFAULT 0,
    positions_json LONGTEXT
);

-- Client Komut Kuyruğu (Web -> EA)
CREATE TABLE IF NOT EXISTS command_queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    command ENUM('PAUSE', 'RESUME', 'CLOSE_ALL_BUY', 'CLOSE_ALL_SELL', 'CLOSE_ALL') NOT NULL,
    status ENUM('pending', 'executed', 'failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    executed_at TIMESTAMP NULL,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- İndeksler
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_trader_clients_trader ON trader_clients(trader_id);
CREATE INDEX idx_command_queue_client ON command_queue(client_id);
CREATE INDEX idx_command_queue_status ON command_queue(status);
