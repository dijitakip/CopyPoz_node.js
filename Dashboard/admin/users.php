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

$action = $_GET['action'] ?? '';
$message = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'create') {
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
            $userId = $pdo->lastInsertId();
            
            // Şifre reset token oluştur
            $resetToken = generatePasswordResetToken($userId);
            
            // Email gönder
            if ($resetToken) {
                $emailSent = sendWelcomeEmail($email, $username, $resetToken);
                if ($emailSent) {
                    logAction('USER_CREATED', "Username: $username, Role: $role, Email sent", 'INFO');
                    $message = 'Kullanıcı başarıyla oluşturuldu. Bilgilendirme emaili gönderildi.';
                } else {
                    // Email gönderilemedi, linki göster
                    $resetLink = "https://fx.haziroglu.com/reset-password.php?token=" . $resetToken;
                    logAction('USER_CREATED', "Username: $username, Role: $role, Email failed", 'WARNING');
                    $message = 'Kullanıcı oluşturuldu. Email gönderilemedi. Şifre oluşturma linki: <br><code style="background: #f0f0f0; padding: 10px; display: block; margin-top: 10px; word-break: break-all;">' . $resetLink . '</code>';
                }
            } else {
                logAction('USER_CREATED', "Username: $username, Role: $role, Token failed", 'WARNING');
                $message = 'Kullanıcı oluşturuldu ama token oluşturulamadı.';
            }
        } catch (Exception $e) {
            $error = 'Kullanıcı oluşturulamadı: ' . $e->getMessage();
            logAction('USER_CREATE_ERROR', $e->getMessage(), 'ERROR');
        }
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'delete') {
    $userId = (int)($_POST['user_id'] ?? 0);
    if ($userId === $currentUser['id']) {
        $error = 'Kendi hesabınızı silemezsiniz.';
    } else {
        try {
            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            logAction('USER_DELETED', "User ID: $userId", 'INFO');
            $message = 'Kullanıcı başarıyla silindi.';
        } catch (Exception $e) {
            $error = 'Kullanıcı silinemedi.';
        }
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'toggle_status') {
    $userId = (int)($_POST['user_id'] ?? 0);
    if ($userId === $currentUser['id']) {
        $error = 'Kendi hesabınızın durumunu değiştiremezsiniz.';
    } else {
        try {
            $stmt = $pdo->prepare("UPDATE users SET status = IF(status = 'active', 'inactive', 'active') WHERE id = ?");
            $stmt->execute([$userId]);
            logAction('USER_STATUS_CHANGED', "User ID: $userId", 'INFO');
            $message = 'Kullanıcı durumu güncellendi.';
        } catch (Exception $e) {
            $error = 'Durum güncellenemedi.';
        }
    }
}

$stmt = $pdo->query("SELECT id, username, email, role, status, created_at FROM users ORDER BY created_at DESC");
$users = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>Kullanıcı Yönetimi - CopyPoz</title>
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
                    <li class="nav-item"><a class="nav-link active" href="users.php" style="color: rgba(255, 255, 255, 0.8);"><i class="fas fa-users"></i> Kullanıcılar</a></li>
                    <li class="nav-item"><a class="nav-link" href="clients.php" style="color: rgba(255, 255, 255, 0.8);"><i class="fas fa-server"></i> Client Yönetimi</a></li>
                    <li class="nav-item"><a class="nav-link" href="../logout.php" style="color: rgba(255, 255, 255, 0.8);"><i class="fas fa-sign-out-alt"></i> Çıkış</a></li>
                </ul>
            </div>
        </div>
    </nav>

    <div class="container-fluid" style="padding: 20px;">
        <h2 style="margin-bottom: 20px;"><i class="fas fa-users"></i> Kullanıcı Yönetimi</h2>

        <?php if ($message): ?>
            <div style="background-color: #d4edda; color: #155724; padding: 12px 15px; border-radius: 8px; margin-bottom: 20px;"><i class="fas fa-check-circle"></i> <?= escapeHtml($message) ?></div>
        <?php endif; ?>

        <?php if ($error): ?>
            <div style="background-color: #f8d7da; color: #721c24; padding: 12px 15px; border-radius: 8px; margin-bottom: 20px;"><i class="fas fa-exclamation-circle"></i> <?= escapeHtml($error) ?></div>
        <?php endif; ?>

        <div style="background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); margin-bottom: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 20px; font-weight: 600; border-radius: 12px 12px 0 0;"><i class="fas fa-user-plus"></i> Yeni Kullanıcı Oluştur</div>
            <div style="padding: 20px;">
                <form method="POST" action="?action=create">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        <div>
                            <label style="font-weight: 600; color: #333; margin-bottom: 8px; display: block; font-size: 14px;">Kullanıcı Adı</label>
                            <input type="text" name="username" style="border: 2px solid #e0e0e0; border-radius: 8px; padding: 12px 15px; font-size: 14px; width: 100%; min-height: 44px;" required>
                        </div>
                        <div>
                            <label style="font-weight: 600; color: #333; margin-bottom: 8px; display: block; font-size: 14px;">Email</label>
                            <input type="email" name="email" style="border: 2px solid #e0e0e0; border-radius: 8px; padding: 12px 15px; font-size: 14px; width: 100%; min-height: 44px;" required>
                        </div>
                        <div>
                            <label style="font-weight: 600; color: #333; margin-bottom: 8px; display: block; font-size: 14px;">Şifre</label>
                            <input type="password" name="password" style="border: 2px solid #e0e0e0; border-radius: 8px; padding: 12px 15px; font-size: 14px; width: 100%; min-height: 44px;" required>
                        </div>
                        <div>
                            <label style="font-weight: 600; color: #333; margin-bottom: 8px; display: block; font-size: 14px;">Rol</label>
                            <select name="role" style="border: 2px solid #e0e0e0; border-radius: 8px; padding: 12px 15px; font-size: 14px; width: 100%; min-height: 44px;" required>
                                <option value="viewer">Viewer</option>
                                <option value="trader">Trader</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div style="display: flex; align-items: flex-end;">
                            <button type="submit" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; padding: 12px 20px; font-weight: 600; cursor: pointer; width: 100%; min-height: 44px;"><i class="fas fa-plus"></i> Oluştur</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>

        <div style="background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 20px; font-weight: 600; border-radius: 12px 12px 0 0;"><i class="fas fa-list"></i> Kullanıcı Listesi</div>
            <div style="padding: 20px; overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="border-bottom: 2px solid #e0e0e0;">
                            <th style="padding: 15px; text-align: left; font-weight: 600; color: #333; font-size: 13px; text-transform: uppercase;">Kullanıcı Adı</th>
                            <th style="padding: 15px; text-align: left; font-weight: 600; color: #333; font-size: 13px; text-transform: uppercase;">Email</th>
                            <th style="padding: 15px; text-align: left; font-weight: 600; color: #333; font-size: 13px; text-transform: uppercase;">Rol</th>
                            <th style="padding: 15px; text-align: left; font-weight: 600; color: #333; font-size: 13px; text-transform: uppercase;">Durum</th>
                            <th style="padding: 15px; text-align: left; font-weight: 600; color: #333; font-size: 13px; text-transform: uppercase;">Oluşturma</th>
                            <th style="padding: 15px; text-align: left; font-weight: 600; color: #333; font-size: 13px; text-transform: uppercase;">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($users as $user): ?>
                            <tr style="border-bottom: 1px solid #f0f0f0;">
                                <td style="padding: 15px;"><strong><?= escapeHtml($user['username']) ?><?php if ($user['id'] === $currentUser['id']): ?> <span style="background-color: #d1ecf1; color: #0c5460; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">Siz</span><?php endif; ?></strong></td>
                                <td style="padding: 15px;"><?= escapeHtml($user['email']) ?></td>
                                <td style="padding: 15px;"><span style="background-color: <?= $user['role'] === 'admin' ? '#f8d7da' : ($user['role'] === 'trader' ? '#fff3cd' : '#e2e3e5') ?>; color: <?= $user['role'] === 'admin' ? '#721c24' : ($user['role'] === 'trader' ? '#856404' : '#383d41') ?>; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: 600;"><?= ucfirst($user['role']) ?></span></td>
                                <td style="padding: 15px;"><span style="background-color: <?= $user['status'] === 'active' ? '#d4edda' : '#e2e3e5' ?>; color: <?= $user['status'] === 'active' ? '#155724' : '#383d41' ?>; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: 600;"><?= $user['status'] === 'active' ? 'Aktif' : 'İnaktif' ?></span></td>
                                <td style="padding: 15px; color: #999; font-size: 12px;"><?= date('d.m.Y H:i', strtotime($user['created_at'])) ?></td>
                                <td style="padding: 15px;">
                                    <?php if ($user['id'] !== $currentUser['id']): ?>
                                        <form method="POST" action="?action=toggle_status" style="display: inline;">
                                            <input type="hidden" name="user_id" value="<?= $user['id'] ?>">
                                            <button type="submit" style="background: #fff3cd; border: 1px solid #ffc107; color: #856404; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;"><i class="fas fa-toggle-on"></i></button>
                                        </form>
                                        <form method="POST" action="?action=delete" style="display: inline;" onsubmit="return confirm('Emin misiniz?');">
                                            <input type="hidden" name="user_id" value="<?= $user['id'] ?>">
                                            <button type="submit" style="background: #f8d7da; border: 1px solid #dc3545; color: #721c24; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;"><i class="fas fa-trash"></i></button>
                                        </form>
                                    <?php else: ?>
                                        <span style="color: #999;">-</span>
                                    <?php endif; ?>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
