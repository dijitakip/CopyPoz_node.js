<?php
@session_start();
require_once '../config/db.php';

$currentUser = authenticateUser();
if (!$currentUser) {
    header("Location: ../index.php");
    exit;
}

$message = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $currentPassword = $_POST['current_password'] ?? '';
    $newPassword = $_POST['new_password'] ?? '';
    $confirmPassword = $_POST['confirm_password'] ?? '';
    
    // Mevcut şifreyi kontrol et
    if (!password_verify($currentPassword, $currentUser['password_hash'])) {
        $error = 'Mevcut şifre yanlış.';
    } elseif (empty($newPassword) || empty($confirmPassword)) {
        $error = 'Tüm alanlar gereklidir.';
    } elseif (strlen($newPassword) < 6) {
        $error = 'Yeni şifre en az 6 karakter olmalıdır.';
    } elseif ($newPassword !== $confirmPassword) {
        $error = 'Yeni şifreler eşleşmiyor.';
    } else {
        try {
            $newHash = password_hash($newPassword, PASSWORD_BCRYPT);
            $stmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
            $stmt->execute([$newHash, $currentUser['id']]);
            logAction('PASSWORD_CHANGED', "User: {$currentUser['username']}", 'INFO');
            $message = 'Şifre başarıyla değiştirildi.';
        } catch (Exception $e) {
            $error = 'Şifre değiştirilemedi.';
            logAction('PASSWORD_CHANGE_ERROR', $e->getMessage(), 'ERROR');
        }
    }
}
?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>Profil - CopyPoz</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link href="../assets/style.css" rel="stylesheet">
</head>
<body style="background-color: #f8f9fa;">
    <nav class="navbar navbar-expand-lg navbar-dark" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); padding: 15px 0;">
        <div class="container-fluid">
            <a class="navbar-brand" href="../dashboard.php" style="font-weight: 700; font-size: 20px;"><i class="fas fa-chart-line"></i> CopyPoz</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"><span class="navbar-toggler-icon"></span></button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item"><a class="nav-link" href="../dashboard.php" style="color: rgba(255, 255, 255, 0.8);"><i class="fas fa-home"></i> Dashboard</a></li>
                    <?php if ($currentUser['role'] === 'admin'): ?>
                        <li class="nav-item"><a class="nav-link" href="users.php" style="color: rgba(255, 255, 255, 0.8);"><i class="fas fa-users"></i> Kullanıcılar</a></li>
                        <li class="nav-item"><a class="nav-link" href="clients.php" style="color: rgba(255, 255, 255, 0.8);"><i class="fas fa-server"></i> Client Yönetimi</a></li>
                    <?php endif; ?>
                    <li class="nav-item"><a class="nav-link active" href="profile.php" style="color: rgba(255, 255, 255, 0.8);"><i class="fas fa-user"></i> Profil</a></li>
                    <li class="nav-item"><a class="nav-link" href="../logout.php" style="color: rgba(255, 255, 255, 0.8);"><i class="fas fa-sign-out-alt"></i> Çıkış</a></li>
                </ul>
            </div>
        </div>
    </nav>

    <div class="container" style="max-width: 600px; margin-top: 40px;">
        <div style="background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); padding: 30px;">
            <h2 style="margin-bottom: 30px;"><i class="fas fa-user-circle"></i> Profil</h2>

            <?php if ($message): ?>
                <div class="alert alert-success" role="alert">
                    <i class="fas fa-check-circle"></i> <?= escapeHtml($message) ?>
                </div>
            <?php endif; ?>

            <?php if ($error): ?>
                <div class="alert alert-danger" role="alert">
                    <i class="fas fa-exclamation-circle"></i> <?= escapeHtml($error) ?>
                </div>
            <?php endif; ?>

            <div style="margin-bottom: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                <p style="margin: 0;"><strong>Kullanıcı Adı:</strong> <?= escapeHtml($currentUser['username']) ?></p>
                <p style="margin: 10px 0 0 0;"><strong>Email:</strong> <?= escapeHtml($currentUser['email']) ?></p>
                <p style="margin: 10px 0 0 0;"><strong>Rol:</strong> <span style="background-color: #667eea; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;"><?= ucfirst($currentUser['role']) ?></span></p>
            </div>

            <h4 style="margin-bottom: 20px;">Şifre Değiştir</h4>

            <form method="POST" action="">
                <div class="form-group" style="margin-bottom: 20px;">
                    <label class="form-label" for="current_password"><i class="fas fa-lock"></i> Mevcut Şifre</label>
                    <input type="password" id="current_password" name="current_password" class="form-control" placeholder="Mevcut şifrenizi girin" required>
                </div>

                <div class="form-group" style="margin-bottom: 20px;">
                    <label class="form-label" for="new_password"><i class="fas fa-lock"></i> Yeni Şifre</label>
                    <input type="password" id="new_password" name="new_password" class="form-control" placeholder="Yeni şifrenizi girin" required>
                    <small style="color: #666; margin-top: 5px; display: block;">En az 6 karakter olmalıdır</small>
                </div>

                <div class="form-group" style="margin-bottom: 20px;">
                    <label class="form-label" for="confirm_password"><i class="fas fa-lock"></i> Yeni Şifre (Tekrar)</label>
                    <input type="password" id="confirm_password" name="confirm_password" class="form-control" placeholder="Yeni şifrenizi tekrar girin" required>
                </div>

                <button type="submit" class="btn btn-primary" style="width: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; padding: 12px; font-weight: 600; border-radius: 8px; color: white; cursor: pointer; min-height: 44px;">
                    <i class="fas fa-save"></i> Şifre Değiştir
                </button>
            </form>

            <hr style="margin: 30px 0;">

            <a href="../dashboard.php" style="color: #667eea; text-decoration: none; display: inline-flex; align-items: center; gap: 8px;">
                <i class="fas fa-arrow-left"></i> Dashboard'a Dön
            </a>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
