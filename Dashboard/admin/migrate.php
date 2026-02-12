<?php
@session_start();
require_once '../config/db.php';

$currentUser = authenticateUser();
if (!$currentUser) {
    header("Location: ../index.php");
    exit;
}

// Sadece admin erişebilir
if ($currentUser['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}
?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>Database Migration - CopyPoz</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        body { background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
        .container { max-width: 800px; margin-top: 40px; }
        .card { border: none; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); }
        .card-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; font-weight: 600; border-radius: 12px 12px 0 0; }
        .card-body { padding: 30px; }
        .status-item { padding: 15px; margin-bottom: 10px; border-radius: 8px; display: flex; align-items: center; gap: 10px; }
        .status-success { background-color: #d4edda; color: #155724; }
        .status-error { background-color: #f8d7da; color: #721c24; }
        .status-icon { font-size: 18px; }
        .btn-back { margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="card-header">
                <i class="fas fa-database"></i> Database Migration
            </div>
            <div class="card-body">
                <h5 style="margin-bottom: 20px;">Veritabanı Tabloları Güncelleniyor...</h5>

                <?php
                try {
                    // 1. Users tablosuna yeni kolonlar ekle
                    echo '<div class="status-item status-success"><span class="status-icon">✓</span> Users tablosuna yeni kolonlar ekleniyor...</div>';
                    
                    $pdo->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(100) UNIQUE");
                    $pdo->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_token VARCHAR(255) UNIQUE NULL");
                    $pdo->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_token_expires DATETIME NULL");
                    $pdo->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS status ENUM('active', 'inactive') DEFAULT 'active'");
                    $pdo->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
                    $pdo->exec("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'trader', 'viewer') DEFAULT 'viewer'");
                    
                    echo '<div class="status-item status-success"><span class="status-icon">✓</span> Users tablosu güncellendi</div>';
                    
                    // 2. Trader-Client ilişki tablosu oluştur
                    echo '<div class="status-item status-success"><span class="status-icon">✓</span> Trader-Client ilişki tablosu oluşturuluyor...</div>';
                    
                    $pdo->exec("
                        CREATE TABLE IF NOT EXISTS trader_clients (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            trader_id INT NOT NULL,
                            client_id INT NOT NULL,
                            assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY (trader_id) REFERENCES users(id) ON DELETE CASCADE,
                            FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
                            UNIQUE KEY unique_trader_client (trader_id, client_id)
                        )
                    ");
                    
                    echo '<div class="status-item status-success"><span class="status-icon">✓</span> Trader-Client tablosu oluşturuldu</div>';
                    
                    // 3. Clients tablosuna updated_at ekle
                    echo '<div class="status-item status-success"><span class="status-icon">✓</span> Clients tablosuna updated_at kolonu ekleniyor...</div>';
                    
                    $pdo->exec("ALTER TABLE clients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
                    
                    echo '<div class="status-item status-success"><span class="status-icon">✓</span> Clients tablosu güncellendi</div>';
                    
                    // 4. İndeksler oluştur
                    echo '<div class="status-item status-success"><span class="status-icon">✓</span> İndeksler oluşturuluyor...</div>';
                    
                    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)");
                    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)");
                    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_trader_clients_trader ON trader_clients(trader_id)");
                    
                    echo '<div class="status-item status-success"><span class="status-icon">✓</span> İndeksler oluşturuldu</div>';
                    
                    echo '<hr>';
                    echo '<div class="status-item status-success" style="font-weight: 600;"><span class="status-icon">✓</span> Migration başarıyla tamamlandı!</div>';
                    
                } catch (Exception $e) {
                    echo '<div class="status-item status-error"><span class="status-icon">✗</span> Hata: ' . escapeHtml($e->getMessage()) . '</div>';
                }
                ?>

                <div class="btn-back">
                    <a href="../dashboard.php" class="btn btn-primary"><i class="fas fa-arrow-left"></i> Dashboard'a Dön</a>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
