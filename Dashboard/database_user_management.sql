-- CopyPoz V5 - Kullanıcı Bazlı Master Grubu ve Client Terminal Yönetimi
-- Add to existing fx_dashboard database

-- ============ USERS TABLOSU (Güncellenmiş) ============
ALTER TABLE users ADD COLUMN IF NOT EXISTS role ENUM('admin', 'master_owner', 'trader', 'viewer') DEFAULT 'viewer';
ALTER TABLE users ADD COLUMN IF NOT EXISTS status ENUM('active', 'inactive') DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- ============ MASTER GROUPS TABLOSU (YENİ) ============
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

-- ============ MASTER TERMINALS TABLOSU (Güncellenmiş) ============
ALTER TABLE masters ADD COLUMN IF NOT EXISTS group_id INT NULL;
ALTER TABLE masters ADD COLUMN IF NOT EXISTS owner_id INT NULL;
ALTER TABLE masters ADD FOREIGN KEY IF NOT EXISTS (group_id) REFERENCES master_groups(id) ON DELETE SET NULL;
ALTER TABLE masters ADD FOREIGN KEY IF NOT EXISTS (owner_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE masters ADD INDEX IF NOT EXISTS idx_group (group_id);
ALTER TABLE masters ADD INDEX IF NOT EXISTS idx_owner (owner_id);

-- ============ CLIENT TERMINALS TABLOSU (Güncellenmiş) ============
ALTER TABLE clients ADD COLUMN IF NOT EXISTS owner_id INT NULL;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS assigned_to_user_id INT NULL;
ALTER TABLE clients ADD FOREIGN KEY IF NOT EXISTS (owner_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE clients ADD FOREIGN KEY IF NOT EXISTS (assigned_to_user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE clients ADD INDEX IF NOT EXISTS idx_owner (owner_id);
ALTER TABLE clients ADD INDEX IF NOT EXISTS idx_assigned_user (assigned_to_user_id);

-- ============ USER PERMISSIONS TABLOSU (YENİ) ============
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

-- ============ USER CLIENT ASSIGNMENTS TABLOSU (YENİ) ============
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

-- ============ USER TOKENS TABLOSU (YENİ) ============
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

-- ============ MASTER GROUP MEMBERS TABLOSU (YENİ) ============
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

-- ============ AUDIT LOG TABLOSU (YENİ) ============
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
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

-- ============ İNDEKSLER ============
CREATE INDEX idx_master_groups_owner ON master_groups(owner_id);
CREATE INDEX idx_master_groups_status ON master_groups(status);
CREATE INDEX idx_masters_group ON masters(group_id);
CREATE INDEX idx_masters_owner ON masters(owner_id);
CREATE INDEX idx_clients_owner ON clients(owner_id);
CREATE INDEX idx_clients_assigned_user ON clients(assigned_to_user_id);
CREATE INDEX idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX idx_user_permissions_group ON user_permissions(master_group_id);
CREATE INDEX idx_user_permissions_client ON user_permissions(client_id);
CREATE INDEX idx_user_client_assignments_user ON user_client_assignments(user_id);
CREATE INDEX idx_user_client_assignments_client ON user_client_assignments(client_id);
CREATE INDEX idx_user_tokens_user ON user_tokens(user_id);
CREATE INDEX idx_user_tokens_client ON user_tokens(client_id);
CREATE INDEX idx_user_tokens_token ON user_tokens(token_value);
CREATE INDEX idx_master_group_members_group ON master_group_members(group_id);
CREATE INDEX idx_master_group_members_user ON master_group_members(user_id);
