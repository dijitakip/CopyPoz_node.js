-- CopyPoz Token Management Tables
-- Add to existing fx_dashboard database

-- Master Terminalleri (Master EA'lar)
CREATE TABLE IF NOT EXISTS masters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    master_name VARCHAR(100) NOT NULL,
    account_number BIGINT NOT NULL UNIQUE,
    account_name VARCHAR(100),
    token VARCHAR(64) NOT NULL UNIQUE,
    token_type ENUM('MASTER_TOKEN', 'ADMIN_TOKEN') DEFAULT 'MASTER_TOKEN',
    status ENUM('active', 'inactive') DEFAULT 'active',
    last_seen TIMESTAMP NULL,
    total_positions INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Client Terminalleri (Client EA'lar) - Güncellenmiş
ALTER TABLE clients ADD COLUMN IF NOT EXISTS token_type ENUM('CLIENT_TOKEN', 'TRADER_TOKEN') DEFAULT 'CLIENT_TOKEN';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS master_id INT NULL;
ALTER TABLE clients ADD FOREIGN KEY IF NOT EXISTS (master_id) REFERENCES masters(id) ON DELETE SET NULL;

-- Token Yönetim Günlüğü
CREATE TABLE IF NOT EXISTS token_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token_type VARCHAR(50) NOT NULL,
    token_value VARCHAR(64) NOT NULL,
    action VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- İndeksler
CREATE INDEX idx_masters_token ON masters(token);
CREATE INDEX idx_masters_status ON masters(status);
CREATE INDEX idx_clients_token_type ON clients(token_type);
CREATE INDEX idx_token_logs_token ON token_logs(token_value);
