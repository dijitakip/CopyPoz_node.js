<?php
@session_start();
require_once 'config/db.php';

$token = $_GET['token'] ?? '';
$message = '';
$error = '';
$user = null;

// Token kontrol et
if (!empty($token)) {
    try {
        $stmt = $pdo->prepare("
            SELECT u.* FROM users u
            JOIN password_resets pr ON u.id = pr.user_id
            WHERE pr.token = ? AND pr.expires_at > NOW()
        ");
        $stmt->execute([$token]);
        $user = $stmt->fetch();
        
        if (!$user) {
            $error = 'Geçersiz veya süresi dolmuş link.';
        }
    } catch (Exception $e) {
        $error = 'Bir hata oluştu.';
    }
}

// Şifre değiştir
if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty($token)) {
    $newPassword = $_POST['new_password'] ?? '';
    $confirmPassword = $_POST['confirm_password'] ?? '';
    
    if (empty($newPassword) || empty($confirmPassword)) {
        $error = 'Tüm alanlar gereklidir.';
    } elseif (strlen($newPassword) < 6) {
        $error = 'Şifre en az 6 karakter olmalıdır.';
    } elseif ($newPassword !== $confirmPassword) {
        $error = 'Şifreler eşleşmiyor.';
    } else {
        try {
            $newHash = password_hash($newPassword, PASSWORD_BCRYPT);
            
            // Şifre güncelle
            $stmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
            $stmt->execute([$newHash, $user['id']]);
            
            // Token'ı sil
            $stmt = $pdo->prepare("DELETE FROM password_resets WHERE token = ?");
            $stmt->execute([$token]);
            
            logAction('PASSWORD_RESET', "User: {$user['username']}", 'INFO');
            $message = 'Şifre başarıyla oluşturuldu. Şimdi giriş yapabilirsiniz.';
            $user = null;
        } catch (Exception $e) {
            $error = 'Şifre oluşturulamadı.';
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
    <meta name="description" content="CopyPoz - Şifre Oluştur">
    <meta name="theme-color" content="#667eea">
    <title>CopyPoz - Şifre Oluştur</title>
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
        .reset-container { width: 100%; max-width: 420px; padding: 20px; }
        .reset-card { background: white; border-radius: 12px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2); overflow: hidden; }
        .reset-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
        .reset-header h1 { font-size: 28px; font-weight: 700; margin-bottom: 5px; }
        .reset-header p { font-size: 14px; opacity: 0.9; margin: 0; }
        .reset-body { padding: 30px 20px; }
        .form-group { margin-bottom: 20px; }
        .form-label { font-weight: 600; color: #333; margin-bottom: 8px; display: block; font-size: 14px; }
        .form-control { border: 2px solid #e0e0e0; border-radius: 8px; padding: 12px 15px; font-size: 16px; transition: all 0.3s ease; width: 100%; min-height: 44px; }
        .form-control:focus { border-color: #667eea; box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); outline: none; }
        .btn-reset { width: 100%; padding: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 16px; cursor: pointer; transition: all 0.3s ease; margin-top: 10px; min-height: 44px; }
        .btn-reset:hover { transform: translateY(-2px); box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4); }
        .alert { border-radius: 8px; border: none; margin-bottom: 20px; padding: 12px 15px; font-size: 14px; }
        .alert-danger { background-color: #f8d7da; color: #721c24; }
        .alert-success { background-color: #d4edda; color: #155724; }
        .reset-footer { text-align: center; padding: 20px; background-color: #f8f9fa; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; }
        .reset-footer a { color: #667eea; text-decoration: none; }
        @media (max-width: 480px) {
            .reset-container { padding: 15px; }
            .reset-header { padding: 25px 15px; }
            .reset-header h1 { font-size: 24px; }
            .reset-body { padding: 25px 15px; }
        }
    </style>
</head>
<body>
    <div class="reset-container">
        <div class="reset-card">
            <div class="reset-header">
                <h1><i class="fas fa-lock"></i> CopyPoz</h1>
                <p>Şifre Oluştur</p>
            </div>
            <div class="reset-body">
                <?php if ($error): ?>
                    <div class="alert alert-danger" role="alert">
                        <i class="fas fa-exclamation-circle"></i> <?= escapeHtml($error) ?>
                    </div>
                    <?php if (empty($token) || !$user): ?>
                        <p style="text-align: center; color: #666;">
                            <a href="index.php" style="color: #667eea; text-decoration: none;">← Giriş sayfasına dön</a>
                        </p>
                    <?php endif; ?>
                <?php endif; ?>

                <?php if ($message): ?>
                    <div class="alert alert-success" role="alert">
                        <i class="fas fa-check-circle"></i> <?= escapeHtml($message) ?>
                    </div>
                    <p style="text-align: center; margin-top: 20px;">
                        <a href="index.php" class="btn-reset" style="text-decoration: none; display: inline-block; width: auto; padding: 12px 30px;">
                            <i class="fas fa-sign-in-alt"></i> Giriş Yap
                        </a>
                    </p>
                <?php elseif ($user): ?>
                    <p style="margin-bottom: 20px; color: #666;">
                        Merhaba <strong><?= escapeHtml($user['username']) ?></strong>, lütfen yeni şifrenizi oluşturun.
                    </p>

                    <form method="POST" action="">
                        <div class="form-group">
                            <label class="form-label" for="new_password"><i class="fas fa-lock"></i> Yeni Şifre</label>
                            <input type="password" id="new_password" name="new_password" class="form-control" placeholder="Yeni şifrenizi girin" required autocomplete="new-password">
                            <small style="color: #666; margin-top: 5px; display: block;">En az 6 karakter olmalıdır</small>
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="confirm_password"><i class="fas fa-lock"></i> Şifre (Tekrar)</label>
                            <input type="password" id="confirm_password" name="confirm_password" class="form-control" placeholder="Şifrenizi tekrar girin" required autocomplete="new-password">
                        </div>

                        <button type="submit" class="btn-reset"><i class="fas fa-save"></i> Şifre Oluştur</button>
                    </form>
                <?php else: ?>
                    <p style="text-align: center; color: #666;">
                        Geçerli bir link ile erişim sağlayın.
                    </p>
                    <p style="text-align: center; margin-top: 20px;">
                        <a href="index.php" style="color: #667eea; text-decoration: none;">← Giriş sayfasına dön</a>
                    </p>
                <?php endif; ?>
            </div>
            <div class="reset-footer">
                <p style="margin: 0;"><i class="fas fa-shield-alt"></i> Güvenli bağlantı ile korunmaktadır</p>
            </div>
        </div>
    </div>
</body>
</html>
