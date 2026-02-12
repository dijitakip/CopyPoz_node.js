-- ============================================================================
-- CopyPoz V5 - Web Dashboard Complete Database Schema
-- Tüm tabloları içeren tek SQL dosyası
-- ============================================================================
-- Tarih: 12 Şubat 2026
-- Versiyon: 1.0
-- ============================================================================

-- Database oluştur
CREATE DATABASE IF NOT EXISTS copypoz_v5 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE copypoz_v5;

-- ============================================================================
-- 1. USERS TABLOSU (Kullanıcılar)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'master_owner', 'trader', 'viewer') DEFAULT 'viewer',
    status ENUM('active', 'inactive') DEFAULT 'active',
    auth_token VARCHAR(255) UNIQUE NULL,
    auth_token_expires DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_status (status)
);

-- ============================================================================
-- 2. MASTER GROUPS TABLOSU (Master Grupları)
-- ============================================================================
CREATE TABLE IF NOT EXISTS master_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_name VARCHAR(100) NOT NULL,
    owner_id INT NOT NULL,
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    max_clients INT DEFAULT 50,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_owner (owner_id),
    INDEX idx_status (status)
);

-- ============================================================================
-- 3. MASTERS TABLOSU (Master Terminalleri)
-- ============================================================================
CREATE TABLE IF NOT EXISTS masters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    master_name VARCHAR(100) NOT NULL,
    account_number BIGINT NOT NULL UNIQUE,
    account_name VARCHAR(100),
    token VARCHAR(64) NOT NULL UNIQUE,
    token_type ENUM('MASTER_TOKEN', 'ADMIN_TOKEN') DEFAULT 'MASTER_TOKEN',
    group_id INT NULL,
    owner_id INT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    last_seen TIMESTAMP NULL,
    total_positions INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES master_groups(id) ON DELETE SET NULL,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_token (token),
    INDEX idx_group (group_id),
    INDEX idx_owner (owner_id),
    INDEX idx_status (status)
);

-- ============================================================================
-- 4. CLIENTS TABLOSU (Client Terminalleri)
-- ============================================================================
CREATE TABLE IF NOT EXISTS clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_number BIGINT NOT NULL UNIQUE,
    account_name VARCHAR(100),
    auth_token VARCHAR(64) NOT NULL,
    token_type ENUM('CLIENT_TOKEN', 'TRADER_TOKEN') DEFAULT 'CLIENT_TOKEN',
    master_id INT NULL,
    owner_id INT NULL,
    assigned_to_user_id INT NULL,
    status ENUM('active', 'paused', 'disconnected') DEFAULT 'active',
    last_seen TIMESTAMP NULL,
    balance DOUBLE DEFAULT 0,
    equity DOUBLE DEFAULT 0,
    open_positions INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (master_id) REFERENCES masters(id) ON DELETE SET NULL,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_account (account_number),
    INDEX idx_token (auth_token),
    INDEX idx_master (master_id),
    INDEX idx_owner (owner_id),
    INDEX idx_assigned_user (assigned_to_user_id),
    INDEX idx_status (status)
);

-- ============================================================================
-- 5. MASTER GROUP MEMBERS TABLOSU (Master Grubu Üyeleri)
-- ============================================================================
CREATE TABLE IF NOT EXISTS master_group_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('owner', 'manager', 'trader', 'viewer') DEFAULT 'viewer',
    added_by INT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES master_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE RESTRICT,
    UNIQUE KEY unique_group_member (group_id, user_id),
    INDEX idx_group (group_id),
    INDEX idx_user (user_id)
);

-- ============================================================================
-- 6. USER CLIENT ASSIGNMENTS TABLOSU (Kullanıcı-Client Atamaları)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_client_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    client_id INT NOT NULL,
    assigned_by INT NOT NULL,
    assignment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'inactive') DEFAULT 'active',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE RESTRICT,
    UNIQUE KEY unique_user_client (user_id, client_id),
    INDEX idx_user (user_id),
    INDEX idx_client (client_id)
);

-- ============================================================================
-- 7. USER TOKENS TABLOSU (Kullanıcı Tokenları)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    client_id INT NOT NULL,
    token_value VARCHAR(64) NOT NULL UNIQUE,
    token_type ENUM('CLIENT_TOKEN', 'TRADER_TOKEN') DEFAULT 'CLIENT_TOKEN',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    last_used TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_user (user_id),
    INDEX idx_client (client_id),
    INDEX idx_token (token_value),
    INDEX idx_status (status)
);

-- ============================================================================
-- 8. USER PERMISSIONS TABLOSU (Kullanıcı İzinleri)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    master_group_id INT NULL,
    client_id INT NULL,
    permission_type ENUM('view', 'edit', 'manage', 'admin') DEFAULT 'view',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (master_group_id) REFERENCES master_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    UNIQUE KEY unique_permission (user_id, master_group_id, client_id),
    INDEX idx_user (user_id),
    INDEX idx_master_group (master_group_id),
    INDEX idx_client (client_id)
);

-- ============================================================================
-- 9. MASTER STATE TABLOSU (Master Durumu)
-- ============================================================================
CREATE TABLE IF NOT EXISTS master_state (
    id INT PRIMARY KEY DEFAULT 1,
    positions JSON,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================================
-- 10. COMMAND QUEUE TABLOSU (Komut Kuyruğu)
-- ============================================================================
CREATE TABLE IF NOT EXISTS command_queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    command ENUM('PAUSE', 'RESUME', 'CLOSE_ALL_BUY', 'CLOSE_ALL_SELL', 'CLOSE_ALL') NOT NULL,
    status ENUM('pending', 'executed', 'failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    executed_at TIMESTAMP NULL,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    INDEX idx_client (client_id),
    INDEX idx_status (status)
);

-- ============================================================================
-- 11. TRADER CLIENTS TABLOSU (Trader-Client İlişkisi)
-- ============================================================================
CREATE TABLE IF NOT EXISTS trader_clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trader_id INT NOT NULL,
    client_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trader_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    UNIQUE KEY unique_trader_client (trader_id, client_id),
    INDEX idx_trader (trader_id),
    INDEX idx_client (client_id)
);

-- ============================================================================
-- 12. TOKEN LOGS TABLOSU (Token İşlem Günlüğü)
-- ============================================================================
CREATE TABLE IF NOT EXISTS token_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token_type VARCHAR(50) NOT NULL,
    token_value VARCHAR(64) NOT NULL,
    action VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token (token_value),
    INDEX idx_action (action),
    INDEX idx_created (created_at)
);

-- ============================================================================
-- 13. AUDIT LOGS TABLOSU (İşlem Günlüğü)
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    old_value TEXT,
    new_value TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_created (created_at)
);

-- ============================================================================
-- 14. DEFAULT ADMIN USER OLUŞTUR
-- ============================================================================
INSERT INTO users (username, email, password_hash, role, status) 
VALUES ('admin', 'admin@copypoz.local', SHA2('admin123', 256), 'admin', 'active')
ON DUPLICATE KEY UPDATE id=id;

-- ============================================================================
-- 15. İNDEKSLER
-- ============================================================================
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_master_groups_owner ON master_groups(owner_id);
CREATE INDEX idx_master_groups_status ON master_groups(status);
CREATE INDEX idx_masters_group ON masters(group_id);
CREATE INDEX idx_masters_owner ON masters(owner_id);
CREATE INDEX idx_masters_status ON masters(status);
CREATE INDEX idx_clients_owner ON clients(owner_id);
CREATE INDEX idx_clients_assigned_user ON clients(assigned_to_user_id);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_master_group_members_group ON master_group_members(group_id);
CREATE INDEX idx_master_group_members_user ON master_group_members(user_id);
CREATE INDEX idx_user_client_assignments_user ON user_client_assignments(user_id);
CREATE INDEX idx_user_client_assignments_client ON user_client_assignments(client_id);
CREATE INDEX idx_user_tokens_user ON user_tokens(user_id);
CREATE INDEX idx_user_tokens_client ON user_tokens(client_id);
CREATE INDEX idx_user_tokens_token ON user_tokens(token_value);
CREATE INDEX idx_user_tokens_status ON user_tokens(status);
CREATE INDEX idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX idx_user_permissions_group ON user_permissions(master_group_id);
CREATE INDEX idx_user_permissions_client ON user_permissions(client_id);
CREATE INDEX idx_trader_clients_trader ON trader_clients(trader_id);
CREATE INDEX idx_trader_clients_client ON trader_clients(client_id);
CREATE INDEX idx_token_logs_token ON token_logs(token_value);
CREATE INDEX idx_token_logs_action ON token_logs(action);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- ============================================================================
-- TAMAMLANDI
-- ============================================================================
-- Tüm tablolar başarıyla oluşturuldu
-- Default admin kullanıcı oluşturuldu
-- Tüm indeksler oluşturuldu
-- ============================================================================
