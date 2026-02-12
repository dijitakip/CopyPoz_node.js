<?php
@session_start();
require_once 'config/db.php';

$message = '';
$error = '';

// Zaten login olmuşsa dashboard'a yönlendir
$user = authenticateUser();
if ($user) {
    header("Location: dashboard.php");
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = sanitizeInput($_POST['email'] ?? '');
    
    if (empty($email)) {
        $error = 'Email adresi gereklidir.';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error = 'Geçersiz email adresi.';
    } else {
        try {
            // Email'e göre kullanıcı bul
            $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
            $stmt->execute([$email]);
            $user = $stmt->fetch();
            
            if (!$user) {
                // Güvenlik nedeniyle aynı mesajı göster
                $message = 'Eğer bu email adresine kayıtlı bir hesap varsa, şifre sıfırlama linki gönderilecektir.';
                logAction('PASSWORD_RESET_REQUEST', "Email not found: $email", 'INFO');
            } else {
                // Eski token'ları sil
                $stmt = $pdo->prepare("DELETE FROM password_resets WHERE user_id = ?");
                $stmt->execute([$user['id']]);
                
                // Yeni token oluştur
                $resetToken = generatePasswordResetToken($user['id']);
                
                if ($resetToken) {
                    // Email gönder
                    $emailSent = sendPasswordResetEmail($user['email'], $user['username'], $resetToken);
                    
                    if ($emailSent) {
                        $message = 'Şifre sıfırlama linki email adresinize gönderilmiştir. Lütfen email'inizi kontrol edin.';
                        logAction('PASSWORD_RESET_EMAIL_SENT', "User: {$user['username']}", 'INFO');
                    } else {
                        $message = 'Şifre sıfırlama linki email adresinize gönderilmiştir. Lütfen email'inizi kontrol edin.';
                        logAction('PASSWORD_RESET_EMAIL_FAILED', "User: {$user['username']}", 'WARNING');
                    }
                } else {
                    $error = 'Bir hata oluştu. Lütfen tekrar deneyin.';
                    logAction('PASSWORD_RESET_TOKEN_ERROR', "User: {$user['username']}", 'ERROR');
                }
            }
        } catch (Exception $e) {
            $error = 'Bir hata oluştu. Lütfen tekrar deneyin.';
            logAction('PASSWORD_RESET_ERROR', $e->getMessage(), 'ERROR');
        }
    }
}
?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <meta name="description" content="CopyPoz - Şifremi Unuttum">
    <meta name="theme-color" content="#667eea">
    <title>CopyPoz - Şifremi Unuttum</title>
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
        .forgot-container { width: 100%; max-width: 420px; padding: 20px; }
        .forgot-card { background: white; border-radius: 12px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2); overflow: hidden; }
        .forgot-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
        .forgot-header h1 { font-size: 28px; font-weight: 700; margin-bottom: 5px; }
        .forgot-header p { font-size: 14px; opacity: 0.9; margin: 0; }
        .forgot-body { padding: 30px 20px; }
        .form-group { margin-bottom: 20px; }
        .form-label { font-weight: 600; color: #333; margin-bottom: 8px; display: block; font-size: 14px; }
        .form-control { border: 2px solid #e0e0e0; border-radius: 8px; padding: 12px 15px; font-size: 16px; transition: all 0.3s ease; width: 100%; min-height: 44px; }
        .form-control:focus { border-color: #667eea; box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); outline: none; }
        .btn-forgot { width: 100%; padding: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 16px; cursor: pointer; transition: all 0.3s ease; margin-top: 10px; min-height: 44px; }
        .btn-forgot:hover { transform: translateY(-2px); box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4); }
        .alert { border-radius: 8px; border: none; margin-bottom: 20px; padding: 12px 15px; font-size: 14px; }
        .alert-danger { background-color: #f8d7da; color: #721c24; }
        .alert-success { background-color: #d4edda; color: #155724; }
        .forgot-footer { text-align: center; padding: 20px; background-color: #f8f9fa; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; }
        .forgot-footer a { color: #667eea; text-decoration: none; }
        .forgot-footer a:hover { text-decoration: underline; }
        .info-text { font-size: 13px; color: #666; margin-bottom: 20px; line-height: 1.5; }
        @media (max-width: 480px) {
            .forgot-container { padding: 15px; }
            .forgot-header { padding: 25px 15px; }
            .forgot-header h1 { font-size: 24px; }
            .forgot-body { padding: 25px 15px; }
        }
    </style>
</head>
<body>
    <div class="forgot-container">
        <div class="forgot-card">
            <div class="forgot-header">
                <h1><i class="fas fa-key"></i> CopyPoz</h1>
                <p>Şifremi Unuttum</p>
            </div>
            <div class="forgot-body">
                <?php if ($error): ?>
                    <div class="alert alert-danger" role="alert">
                        <i class="fas fa-exclamation-circle"></i> <?= escapeHtml($error) ?>
                    </div>
                <?php endif; ?>

                <?php if ($message): ?>
                    <div class="alert alert-success" role="alert">
                        <i class="fas fa-check-circle"></i> <?= escapeHtml($message) ?>
                    </div>
                    <p style="text-align: center; margin-top: 20px;">
                        <a href="index.php" style="color: #667eea; text-decoration: none;">← Giriş sayfasına dön</a>
                    </p>
                <?php else: ?>
                    <p class="info-text">
                        <i class="fas fa-info-circle"></i> 
                        Hesabınıza kayıtlı email adresini girin. Şifre sıfırlama linki email'inize gönderilecektir.
                    </p>

                    <form method="POST" action="">
                        <div class="form-group">
                            <label class="form-label" for="email"><i class="fas fa-envelope"></i> Email Adresi</label>
                            <input type="email" id="email" name="email" class="form-control" placeholder="Email adresinizi girin" required autocomplete="email">
                        </div>

                        <button type="submit" class="btn-forgot"><i class="fas fa-paper-plane"></i> Sıfırlama Linki Gönder</button>
                    </form>
                <?php endif; ?>
            </div>
            <div class="forgot-footer">
                <p style="margin: 0;">
                    <a href="index.php"><i class="fas fa-sign-in-alt"></i> Giriş Yap</a> | 
                    <a href="dashboard.php"><i class="fas fa-home"></i> Ana Sayfa</a>
                </p>
            </div>
        </div>
    </div>
</body>
</html>
