<?php
@session_start();
require_once 'config/db.php';

$user = authenticateUser();
if ($user) {
    // Session verilerini ayarla
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['role'] = $user['role'];
    $_SESSION['username'] = $user['username'];
    
    // Yönlendirme yapmadan önce session'ı kaydet
    session_write_close();
    header("Location: dashboard.php");
    exit;
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = sanitizeInput($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';
    
    if (!checkRateLimit($_SERVER['REMOTE_ADDR'])) {
        $error = 'Çok fazla başarısız giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin.';
        logAction('LOGIN_FAILED', "Rate limit exceeded for $username", 'WARNING');
    } elseif (empty($username) || empty($password)) {
        $error = 'Kullanıcı adı ve şifre gereklidir.';
    } else {
        try {
            $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? OR email = ?");
            $stmt->execute([$username, $username]);
            $user = $stmt->fetch();
            
            // SHA2 hash veya password_verify ile kontrol et
            $passwordMatch = false;
            if ($user) {
                // password_verify ile kontrol et (PHP hash)
                if (password_verify($password, $user['password_hash'])) {
                    $passwordMatch = true;
                }
                // SHA2 hash ile kontrol et (MySQL hash)
                elseif ($user['password_hash'] === hash('sha256', $password)) {
                    $passwordMatch = true;
                }
            }
            
            if ($user && $passwordMatch) {
                $token = bin2hex(random_bytes(32));
                $updateStmt = $pdo->prepare("UPDATE users SET auth_token = ?, auth_token_expires = DATE_ADD(NOW(), INTERVAL 30 DAY) WHERE id = ?");
                $updateStmt->execute([$token, $user['id']]);
                setSecureCookie('user_token', $token);
                
                // Session verilerini ayarla
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['role'] = $user['role'];
                $_SESSION['username'] = $user['username'];
                
                logAction('LOGIN_SUCCESS', $username, 'INFO');
                
                // Yönlendirme yapmadan önce session'ı kaydet
                session_write_close();
                header("Location: dashboard.php");
                exit;
            } else {
                $error = 'Geçersiz kullanıcı adı veya şifre.';
                logAction('LOGIN_FAILED', $username, 'WARNING');
            }
        } catch (Exception $e) {
            $error = 'Bir hata oluştu. Lütfen tekrar deneyin.';
            logAction('LOGIN_ERROR', $e->getMessage(), 'ERROR');
        }
    }
}
?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <meta name="description" content="CopyPoz FX Trading Dashboard - Güvenli Giriş">
    <meta name="theme-color" content="#667eea">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="CopyPoz">
    <link rel="apple-touch-icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 180 180'><rect fill='%23667eea' width='180' height='180'/><text x='90' y='90' font-size='80' font-weight='bold' fill='white' text-anchor='middle' dominant-baseline='middle'>CP</text></svg>">
    <link rel="manifest" href="manifest.json">
    <title>CopyPoz - Giriş</title>
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
        .login-container { width: 100%; max-width: 420px; padding: 20px; }
        .login-card { background: white; border-radius: 12px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2); overflow: hidden; }
        .login-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
        .login-header h1 { font-size: 28px; font-weight: 700; margin-bottom: 5px; }
        .login-header p { font-size: 14px; opacity: 0.9; margin: 0; }
        .login-body { padding: 30px 20px; }
        .form-group { margin-bottom: 20px; }
        .form-label { font-weight: 600; color: #333; margin-bottom: 8px; display: block; font-size: 14px; }
        .form-control { border: 2px solid #e0e0e0; border-radius: 8px; padding: 12px 15px; font-size: 16px; transition: all 0.3s ease; width: 100%; min-height: 44px; }
        .form-control:focus { border-color: #667eea; box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); outline: none; }
        .btn-login { width: 100%; padding: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 16px; cursor: pointer; transition: all 0.3s ease; margin-top: 10px; min-height: 44px; }
        .btn-login:hover { transform: translateY(-2px); box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4); }
        .alert { border-radius: 8px; border: none; margin-bottom: 20px; padding: 12px 15px; font-size: 14px; }
        .alert-danger { background-color: #f8d7da; color: #721c24; }
        .login-footer { text-align: center; padding: 20px; background-color: #f8f9fa; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; }
        @media (max-width: 480px) {
            .login-container { padding: 15px; }
            .login-header { padding: 25px 15px; }
            .login-header h1 { font-size: 24px; }
            .login-body { padding: 25px 15px; }
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="login-card">
            <div class="login-header">
                <h1><i class="fas fa-chart-line"></i> CopyPoz</h1>
                <p>FX Trading Dashboard</p>
            </div>
            <div class="login-body">
                <?php if ($error): ?>
                    <div class="alert alert-danger" role="alert">
                        <i class="fas fa-exclamation-circle"></i> <?= escapeHtml($error) ?>
                    </div>
                <?php endif; ?>
                <form method="POST" action="">
                    <div class="form-group">
                        <label class="form-label" for="username"><i class="fas fa-user"></i> Kullanıcı Adı</label>
                        <input type="text" id="username" name="username" class="form-control" placeholder="Kullanıcı adınızı girin" required autocomplete="username">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="password"><i class="fas fa-lock"></i> Şifre</label>
                        <input type="password" id="password" name="password" class="form-control" placeholder="Şifrenizi girin" required autocomplete="current-password">
                    </div>
                    <button type="submit" class="btn-login"><i class="fas fa-sign-in-alt"></i> Giriş Yap</button>
                </form>

                <p style="text-align: center; margin-top: 20px;">
                    <a href="forgot-password.php" style="color: #667eea; text-decoration: none; font-size: 14px; margin-right: 15px;">
                        <i class="fas fa-key"></i> Şifremi Unuttum
                    </a>
                    <span style="color: #ccc;">|</span>
                    <a href="register.php" style="color: #667eea; text-decoration: none; font-size: 14px; margin-left: 15px;">
                        <i class="fas fa-user-plus"></i> Kayıt Ol
                    </a>
                </p>
            </div>
            <div class="login-footer">
                <p style="margin: 0;"><i class="fas fa-shield-alt"></i> Güvenli bağlantı ile korunmaktadır</p>
            </div>
        </div>
    </div>

    <script>
        // Service Worker registration
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        }
    </script>
</body>
</html>
