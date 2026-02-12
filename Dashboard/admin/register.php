<?php
@session_start();
require_once '../config/db.php';

$user = authenticateUser();
if (!$user || $user['role'] !== 'admin') {
    header("Location: ../index.php");
    exit;
}

$message = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = sanitizeInput($_POST['username'] ?? '');
    $email = sanitizeInput($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $role = $_POST['role'] ?? 'viewer';
    
    if (empty($username) || empty($email) || empty($password)) {
        $error = 'Tüm alanlar gereklidir.';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error = 'Geçersiz email adresi.';
    } elseif (strlen($password) < 6) {
        $error = 'Şifre en az 6 karakter olmalıdır.';
    } else {
        try {
            $passwordHash = password_hash($password, PASSWORD_BCRYPT);
            $stmt = $pdo->prepare("INSERT INTO users (username, email, password_hash, role, status) VALUES (?, ?, ?, ?, 'active')");
            $stmt->execute([$username, $email, $passwordHash, $role]);
            logAction('USER_CREATED', "Username: $username, Role: $role", 'INFO');
            $message = 'Kullanıcı başarıyla oluşturuldu!';
        } catch (Exception $e) {
            $error = 'Kullanıcı oluşturulamadı.';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>Kullanıcı Oluştur - CopyPoz</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        body { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
        .register-container { width: 100%; max-width: 500px; padding: 20px; }
        .register-card { background: white; border-radius: 12px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2); overflow: hidden; }
        .register-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
        .register-header h1 { font-size: 24px; font-weight: 700; margin-bottom: 5px; }
        .register-body { padding: 30px 20px; }
        .form-group { margin-bottom: 20px; }
        .form-label { font-weight: 600; color: #333; margin-bottom: 8px; display: block; font-size: 14px; }
        .form-control, .form-select { border: 2px solid #e0e0e0; border-radius: 8px; padding: 12px 15px; font-size: 14px; width: 100%; min-height: 44px; }
        .form-control:focus, .form-select:focus { border-color: #667eea; box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); outline: none; }
        .btn-register { width: 100%; padding: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 16px; cursor: pointer; transition: all 0.3s ease; margin-top: 10px; min-height: 44px; }
        .btn-register:hover { transform: translateY(-2px); box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4); }
        .alert { border-radius: 8px; border: none; margin-bottom: 20px; padding: 12px 15px; font-size: 14px; }
        .alert-success { background-color: #d4edda; color: #155724; }
        .alert-danger { background-color: #f8d7da; color: #721c24; }
        .register-footer { text-align: center; padding: 20px; background-color: #f8f9fa; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; }
        .register-footer a { color: #667eea; text-decoration: none; }
        @media (max-width: 480px) {
            .register-container { padding: 15px; }
            .register-header { padding: 25px 15px; }
            .register-header h1 { font-size: 20px; }
            .register-body { padding: 25px 15px; }
        }
    </style>
</head>
<body>
    <div class="register-container">
        <div class="register-card">
            <div class="register-header">
                <h1><i class="fas fa-user-plus"></i> Yeni Kullanıcı</h1>
                <p>CopyPoz Dashboard</p>
            </div>
            <div class="register-body">
                <?php if ($message): ?>
                    <div class="alert alert-success"><i class="fas fa-check-circle"></i> <?= escapeHtml($message) ?></div>
                <?php endif; ?>
                <?php if ($error): ?>
                    <div class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> <?= escapeHtml($error) ?></div>
                <?php endif; ?>
                <form method="POST" action="">
                    <div class="form-group">
                        <label class="form-label" for="username"><i class="fas fa-user"></i> Kullanıcı Adı</label>
                        <input type="text" id="username" name="username" class="form-control" placeholder="Kullanıcı adı" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="email"><i class="fas fa-envelope"></i> Email</label>
                        <input type="email" id="email" name="email" class="form-control" placeholder="email@example.com" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="password"><i class="fas fa-lock"></i> Şifre</label>
                        <input type="password" id="password" name="password" class="form-control" placeholder="En az 6 karakter" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="role"><i class="fas fa-shield-alt"></i> Rol</label>
                        <select id="role" name="role" class="form-select" required>
                            <option value="viewer">Viewer (Sadece Görüntüleme)</option>
                            <option value="trader">Trader (Komut Gönderme)</option>
                            <option value="admin">Admin (Tam Kontrol)</option>
                        </select>
                    </div>
                    <button type="submit" class="btn-register"><i class="fas fa-plus"></i> Kullanıcı Oluştur</button>
                </form>
            </div>
            <div class="register-footer">
                <p style="margin: 0;"><a href="../dashboard.php"><i class="fas fa-arrow-left"></i> Dashboard'a Dön</a></p>
            </div>
        </div>
    </div>
</body>
</html>
