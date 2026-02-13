<?php
@session_start();
require_once 'config/db.php';

// Zaten giriş yapmışsa dashboard'a yönlendir
$user = authenticateUser();
if ($user) {
    header("Location: dashboard.php");
    exit;
}

$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = sanitizeInput($_POST['username'] ?? '');
    $email = sanitizeInput($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $password_confirm = $_POST['password_confirm'] ?? '';
    
    // Validasyonlar
    if (!checkRateLimit($_SERVER['REMOTE_ADDR'])) {
        $error = 'Çok fazla deneme yaptınız. Lütfen 15 dakika sonra tekrar deneyin.';
        logAction('REGISTER_FAILED', "Rate limit exceeded for IP: " . $_SERVER['REMOTE_ADDR'], 'WARNING');
    } elseif (empty($username) || empty($email) || empty($password)) {
        $error = 'Tüm alanlar gereklidir.';
    } elseif ($password !== $password_confirm) {
        $error = 'Şifreler eşleşmiyor.';
    } elseif (strlen($password) < 6) {
        $error = 'Şifre en az 6 karakter olmalıdır.';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error = 'Geçersiz email adresi.';
    } else {
        try {
            // Kullanıcı adı veya email zaten var mı?
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE username = ? OR email = ?");
            $stmt->execute([$username, $email]);
            if ($stmt->fetchColumn() > 0) {
                $error = 'Bu kullanıcı adı veya email zaten kullanılıyor.';
            } else {
                // Yeni kullanıcı oluştur
                $passwordHash = password_hash($password, PASSWORD_BCRYPT);
                // Varsayılan rol 'viewer' olarak ayarlandı, admin sonradan değiştirebilir
                $stmt = $pdo->prepare("INSERT INTO users (username, email, password_hash, role, status) VALUES (?, ?, ?, 'viewer', 'active')");
                $stmt->execute([$username, $email, $passwordHash]);
                
                logAction('REGISTER_SUCCESS', "New user registered: $username", 'INFO');
                $success = 'Kayıt başarılı! Şimdi giriş yapabilirsiniz.';
            }
        } catch (Exception $e) {
            $error = 'Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.';
            logAction('REGISTER_ERROR', $e->getMessage(), 'ERROR');
        }
    }
}
?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>Kayıt Ol - CopyPoz</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        .register-container { width: 100%; max-width: 460px; padding: 20px; }
        .register-card { background: white; border-radius: 12px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2); overflow: hidden; }
        .register-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
        .register-header h1 { font-size: 24px; font-weight: 700; margin-bottom: 5px; }
        .register-body { padding: 30px 20px; }
        .form-group { margin-bottom: 20px; }
        .form-label { font-weight: 600; color: #333; margin-bottom: 8px; display: block; font-size: 14px; }
        .form-control { border: 2px solid #e0e0e0; border-radius: 8px; padding: 12px 15px; font-size: 16px; transition: all 0.3s ease; width: 100%; min-height: 44px; }
        .form-control:focus { border-color: #667eea; box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); outline: none; }
        .btn-register { width: 100%; padding: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 16px; cursor: pointer; transition: all 0.3s ease; margin-top: 10px; min-height: 44px; }
        .btn-register:hover { transform: translateY(-2px); box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4); }
        .login-link { text-align: center; margin-top: 20px; font-size: 14px; color: #666; }
        .login-link a { color: #667eea; text-decoration: none; font-weight: 600; }
        .alert { border-radius: 8px; border: none; margin-bottom: 20px; padding: 12px 15px; font-size: 14px; }
        .alert-danger { background-color: #f8d7da; color: #721c24; }
        .alert-success { background-color: #d4edda; color: #155724; }
    </style>
</head>
<body>
    <div class="register-container">
        <div class="register-card">
            <div class="register-header">
                <h1><i class="fas fa-user-plus"></i> CopyPoz'a Katıl</h1>
                <p>Yeni Hesap Oluştur</p>
            </div>
            <div class="register-body">
                <?php if ($error): ?>
                    <div class="alert alert-danger" role="alert">
                        <i class="fas fa-exclamation-circle"></i> <?= escapeHtml($error) ?>
                    </div>
                <?php endif; ?>
                
                <?php if ($success): ?>
                    <div class="alert alert-success" role="alert">
                        <i class="fas fa-check-circle"></i> <?= escapeHtml($success) ?>
                        <div style="margin-top: 10px;">
                            <a href="index.php" class="btn btn-sm btn-success w-100">Giriş Yap</a>
                        </div>
                    </div>
                <?php else: ?>
                    <form method="POST" action="">
                        <div class="form-group">
                            <label class="form-label" for="username"><i class="fas fa-user"></i> Kullanıcı Adı</label>
                            <input type="text" id="username" name="username" class="form-control" placeholder="Kullanıcı adı seçin" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="email"><i class="fas fa-envelope"></i> E-posta</label>
                            <input type="email" id="email" name="email" class="form-control" placeholder="E-posta adresiniz" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="password"><i class="fas fa-lock"></i> Şifre</label>
                            <input type="password" id="password" name="password" class="form-control" placeholder="En az 6 karakter" required minlength="6">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="password_confirm"><i class="fas fa-lock"></i> Şifre Tekrar</label>
                            <input type="password" id="password_confirm" name="password_confirm" class="form-control" placeholder="Şifrenizi tekrar girin" required minlength="6">
                        </div>
                        <button type="submit" class="btn-register"><i class="fas fa-user-plus"></i> Kayıt Ol</button>
                    </form>
                <?php endif; ?>

                <div class="login-link">
                    Zaten hesabınız var mı? <a href="index.php">Giriş Yap</a>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
