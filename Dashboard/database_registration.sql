-- CopyPoz V5 - Kullanıcı Kayıt ve Email Doğrulama Sistemi
-- Add to existing fx_dashboard database

-- ============ USERS TABLOSU (Güncellenmiş) ============
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_strength INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_attempts INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP NULL;

-- ============ EMAIL VERIFICATION TOKENS TABLOSU (YENİ) ============
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(64) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user (user_id),
    INDEX idx_expires (expires_at)
);

-- ============ PASSWORD RESET TOKENS TABLOSU (YENİ) ============
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user (user_id),
    INDEX idx_expires (expires_at)
);

-- ============ METATRADER ACCOUNTS TABLOSU (YENİ) ============
CREATE TABLE IF NOT EXISTS metatrader_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    account_number BIGINT NOT NULL UNIQUE,
    account_name VARCHAR(100),
    account_type ENUM('demo', 'live') DEFAULT 'live',
    broker VARCHAR(100),
    currency VARCHAR(10),
    leverage INT DEFAULT 100,
    balance DECIMAL(15,2) DEFAULT 0,
    equity DECIMAL(15,2) DEFAULT 0,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_account (user_id, account_number),
    INDEX idx_user (user_id),
    INDEX idx_account (account_number),
    INDEX idx_status (status)
);

-- ============ REGISTRATION LOGS TABLOSU (YENİ) ============
CREATE TABLE IF NOT EXISTS registration_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    email VARCHAR(100),
    action VARCHAR(50),
    status VARCHAR(20),
    ip_address VARCHAR(45),
    user_agent TEXT,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_email (email),
    INDEX idx_action (action),
    INDEX idx_created (created_at)
);

-- ============ SECURITY QUESTIONS TABLOSU (YENİ) ============
CREATE TABLE IF NOT EXISTS security_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_text VARCHAR(255) NOT NULL,
    language VARCHAR(5) DEFAULT 'TR',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ USER SECURITY ANSWERS TABLOSU (YENİ) ============
CREATE TABLE IF NOT EXISTS user_security_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    question_id INT NOT NULL,
    answer_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES security_questions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_question (user_id, question_id),
    INDEX idx_user (user_id)
);

-- ============ İNDEKSLER ============
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_email_verified ON users(email_verified);
CREATE INDEX idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX idx_email_verification_tokens_user ON email_verification_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX idx_metatrader_accounts_user ON metatrader_accounts(user_id);
CREATE INDEX idx_metatrader_accounts_account ON metatrader_accounts(account_number);
CREATE INDEX idx_registration_logs_user ON registration_logs(user_id);
CREATE INDEX idx_registration_logs_email ON registration_logs(email);

-- ============ SECURITY QUESTIONS (ÖRNEK) ============
INSERT INTO security_questions (question_text, language, status) VALUES
('Doğum yeriniz nedir?', 'TR', 'active'),
('İlk evcil hayvanınızın adı nedir?', 'TR', 'active'),
('Annenizin kızlık soyadı nedir?', 'TR', 'active'),
('En sevdiğiniz kitap nedir?', 'TR', 'active'),
('İlk öğretmeninizin adı nedir?', 'TR', 'active'),
('Lise mezuniyetiniz hangi yıl?', 'TR', 'active'),
('En sevdiğiniz şehir nedir?', 'TR', 'active'),
('İlk arabanızın markası nedir?', 'TR', 'active');
