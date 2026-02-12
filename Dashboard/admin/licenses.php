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

// Lisans oluştur
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'create') {
    $type = sanitizeInput($_POST['type'] ?? '');
    $days = (int)($_POST['days'] ?? 0);
    
    if (!in_array($type, ['TRIAL', 'PRO', 'ENTERPRISE'])) {
        $error = 'Invalid license type';
    } elseif ($days <= 0) {
        $error = 'Days must be greater than 0';
    } else {
        try {
            // Lisans anahtarı oluştur: COPYPOZ-TYPE-YEAR-HASH
            $year = date('Y');
            $hash = strtoupper(substr(bin2hex(random_bytes(6)), 0, 12));
            $licenseKey = "COPYPOZ-$type-$year-$hash";
            
            // Süresi hesapla
            $issuedDate = date('Y-m-d H:i:s');
            $expiryDate = date('Y-m-d H:i:s', strtotime("+$days days"));
            
            // Veritabanına ekle
            $stmt = $pdo->prepare("INSERT INTO licenses (license_key, type, issued_date, expiry_date, status) VALUES (?, ?, ?, ?, 'active')");
            $stmt->execute([$licenseKey, $type, $issuedDate, $expiryDate]);
            
            logAction('LICENSE_CREATED', "Key: $licenseKey, Type: $type, Days: $days", 'INFO');
            $message = "License created successfully. Key: <strong style='color: #667eea; font-family: monospace;'>$licenseKey</strong>";
        } catch (Exception $e) {
            $error = 'Error creating license: ' . $e->getMessage();
        }
    }
}

// Lisans deaktif et
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'deactivate') {
    $licenseId = (int)($_POST['license_id'] ?? 0);
    
    try {
        $stmt = $pdo->prepare("UPDATE licenses SET status = 'inactive' WHERE id = ?");
        $stmt->execute([$licenseId]);
        logAction('LICENSE_DEACTIVATED', "License ID: $licenseId", 'INFO');
        $message = 'License deactivated successfully';
    } catch (Exception $e) {
        $error = 'Error deactivating license';
    }
}

// Lisans sil
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'delete') {
    $licenseId = (int)($_POST['license_id'] ?? 0);
    
    try {
        $stmt = $pdo->prepare("DELETE FROM licenses WHERE id = ?");
        $stmt->execute([$licenseId]);
        logAction('LICENSE_DELETED', "License ID: $licenseId", 'INFO');
        $message = 'License deleted successfully';
    } catch (Exception $e) {
        $error = 'Error deleting license';
    }
}

// Tüm lisansları al
$licensesStmt = $pdo->query("SELECT * FROM licenses ORDER BY created_at DESC");
$licenses = $licensesStmt->fetchAll();

// İstatistikler
$statsStmt = $pdo->query("SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
    SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive,
    SUM(CASE WHEN expiry_date < NOW() THEN 1 ELSE 0 END) as expired
FROM licenses");
$stats = $statsStmt->fetch();
?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>Lisans Yönetimi - CopyPoz</title>
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
                    <li class="nav-item"><a class="nav-link" href="users.php" style="color: rgba(255, 255, 255, 0.8);"><i class="fas fa-users"></i> Kullanıcılar</a></li>
                    <li class="nav-item"><a class="nav-link" href="clients.php" style="color: rgba(255, 255, 255, 0.8);"><i class="fas fa-server"></i> Client Yönetimi</a></li>
                    <li class="nav-item"><a class="nav-link active" href="licenses.php" style="color: rgba(255, 255, 255, 0.8);"><i class="fas fa-key"></i> Lisans Yönetimi</a></li>
                    <li class="nav-item"><a class="nav-link" href="../logout.php" style="color: rgba(255, 255, 255, 0.8);"><i class="fas fa-sign-out-alt"></i> Çıkış</a></li>
                </ul>
            </div>
        </div>
    </nav>

    <div class="container-fluid" style="padding: 20px;">
        <h2 style="margin-bottom: 20px;"><i class="fas fa-key"></i> Lisans Yönetimi</h2>

        <?php if ($message): ?>
            <div style="background-color: #d4edda; color: #155724; padding: 12px 15px; border-radius: 8px; margin-bottom: 20px;"><i class="fas fa-check-circle"></i> <?= $message ?></div>
        <?php endif; ?>

        <?php if ($error): ?>
            <div style="background-color: #f8d7da; color: #721c24; padding: 12px 15px; border-radius: 8px; margin-bottom: 20px;"><i class="fas fa-exclamation-circle"></i> <?= escapeHtml($error) ?></div>
        <?php endif; ?>

        <!-- İstatistikler -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
            <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);">
                <div style="font-size: 12px; color: #999; text-transform: uppercase; margin-bottom: 10px;">Toplam Lisans</div>
                <div style="font-size: 28px; font-weight: bold; color: #667eea;"><?= $stats['total'] ?></div>
            </div>
            <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);">
                <div style="font-size: 12px; color: #999; text-transform: uppercase; margin-bottom: 10px;">Aktif</div>
                <div style="font-size: 28px; font-weight: bold; color: #28a745;"><?= $stats['active'] ?></div>
            </div>
            <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);">
                <div style="font-size: 12px; color: #999; text-transform: uppercase; margin-bottom: 10px;">Pasif</div>
                <div style="font-size: 28px; font-weight: bold; color: #ffc107;"><?= $stats['inactive'] ?></div>
            </div>
            <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);">
                <div style="font-size: 12px; color: #999; text-transform: uppercase; margin-bottom: 10px;">Süresi Dolmuş</div>
                <div style="font-size: 28px; font-weight: bold; color: #dc3545;"><?= $stats['expired'] ?></div>
            </div>
        </div>

        <!-- Yeni Lisans Oluştur -->
        <div style="background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); margin-bottom: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 20px; font-weight: 600; border-radius: 12px 12px 0 0;"><i class="fas fa-plus-circle"></i> Yeni Lisans Oluştur</div>
            <div style="padding: 20px;">
                <form method="POST" action="?action=create">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        <div>
                            <label style="font-weight: 600; color: #333; margin-bottom: 8px; display: block; font-size: 14px;">Lisans Türü</label>
                            <select name="type" style="border: 2px solid #e0e0e0; border-radius: 8px; padding: 12px 15px; font-size: 14px; width: 100%; min-height: 44px;" required>
                                <option value="">-- Seçin --</option>
                                <option value="TRIAL">TRIAL (30 gün, 5 client)</option>
                                <option value="PRO">PRO (1 yıl, 50 client)</option>
                                <option value="ENTERPRISE">ENTERPRISE (Unlimited, 1000 client)</option>
                            </select>
                        </div>
                        <div>
                            <label style="font-weight: 600; color: #333; margin-bottom: 8px; display: block; font-size: 14px;">Gün Sayısı</label>
                            <input type="number" name="days" style="border: 2px solid #e0e0e0; border-radius: 8px; padding: 12px 15px; font-size: 14px; width: 100%; min-height: 44px;" placeholder="Örn: 30" required>
                        </div>
                        <div style="display: flex; align-items: flex-end;">
                            <button type="submit" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; padding: 12px 20px; font-weight: 600; cursor: pointer; width: 100%; min-height: 44px;"><i class="fas fa-plus"></i> Oluştur</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>

        <!-- Lisans Listesi -->
        <div style="background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 20px; font-weight: 600; border-radius: 12px 12px 0 0;"><i class="fas fa-list"></i> Lisans Listesi</div>
            <div style="padding: 20px;">
                <?php if (empty($licenses)): ?>
                    <div style="background-color: #d1ecf1; color: #0c5460; padding: 12px 15px; border-radius: 8px;"><i class="fas fa-info-circle"></i> Henüz lisans bulunmuyor.</div>
                <?php else: ?>
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="border-bottom: 2px solid #e0e0e0;">
                                    <th style="padding: 15px; text-align: left; font-weight: 600; color: #333; font-size: 13px; text-transform: uppercase;">Lisans Anahtarı</th>
                                    <th style="padding: 15px; text-align: left; font-weight: 600; color: #333; font-size: 13px; text-transform: uppercase;">Türü</th>
                                    <th style="padding: 15px; text-align: left; font-weight: 600; color: #333; font-size: 13px; text-transform: uppercase;">Durum</th>
                                    <th style="padding: 15px; text-align: left; font-weight: 600; color: #333; font-size: 13px; text-transform: uppercase;">Süresi Dolma</th>
                                    <th style="padding: 15px; text-align: left; font-weight: 600; color: #333; font-size: 13px; text-transform: uppercase;">Son Kontrol</th>
                                    <th style="padding: 15px; text-align: left; font-weight: 600; color: #333; font-size: 13px; text-transform: uppercase;">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($licenses as $license): ?>
                                    <?php
                                    $isExpired = strtotime($license['expiry_date']) < time();
                                    $statusColor = $license['status'] === 'active' ? '#28a745' : '#ffc107';
                                    $statusText = $license['status'] === 'active' ? 'Aktif' : 'Pasif';
                                    ?>
                                    <tr style="border-bottom: 1px solid #f0f0f0;">
                                        <td style="padding: 15px; font-family: monospace; font-size: 12px;"><strong><?= escapeHtml($license['license_key']) ?></strong></td>
                                        <td style="padding: 15px;"><span style="background: #e7f3ff; color: #0066cc; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;"><?= escapeHtml($license['type']) ?></span></td>
                                        <td style="padding: 15px;"><span style="background: <?= $statusColor ?>20; color: <?= $statusColor ?>; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;"><?= $statusText ?></span></td>
                                        <td style="padding: 15px;">
                                            <?php
                                            $expiryDate = new DateTime($license['expiry_date']);
                                            $now = new DateTime();
                                            $interval = $now->diff($expiryDate);
                                            
                                            if ($isExpired) {
                                                echo '<span style="color: #dc3545; font-weight: 600;">Süresi Dolmuş</span>';
                                            } else {
                                                echo $interval->days . ' gün kaldı';
                                            }
                                            ?>
                                        </td>
                                        <td style="padding: 15px;">
                                            <?php
                                            if ($license['last_check_date']) {
                                                echo date('d.m.Y H:i', strtotime($license['last_check_date']));
                                            } else {
                                                echo 'Henüz kontrol edilmedi';
                                            }
                                            ?>
                                        </td>
                                        <td style="padding: 15px;">
                                            <?php if ($license['status'] === 'active'): ?>
                                                <form method="POST" action="?action=deactivate" style="display: inline;" onsubmit="return confirm('Lisansı deaktif etmek istiyor musunuz?');">
                                                    <input type="hidden" name="license_id" value="<?= $license['id'] ?>">
                                                    <button type="submit" style="background: #fff3cd; border: 1px solid #ffc107; color: #856404; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;"><i class="fas fa-pause"></i> Deaktif Et</button>
                                                </form>
                                            <?php endif; ?>
                                            <form method="POST" action="?action=delete" style="display: inline;" onsubmit="return confirm('Lisansı silmek istiyor musunuz?');">
                                                <input type="hidden" name="license_id" value="<?= $license['id'] ?>">
                                                <button type="submit" style="background: #f8d7da; border: 1px solid #dc3545; color: #721c24; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;"><i class="fas fa-trash"></i> Sil</button>
                                            </form>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
