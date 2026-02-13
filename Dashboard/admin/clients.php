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
    $accountNumber = (int)($_POST['account_number'] ?? 0);
    $accountName = sanitizeInput($_POST['account_name'] ?? '');
    
    if ($accountNumber <= 0 || empty($accountName)) {
        $error = 'Hesap numarası ve adı gereklidir.';
    } else {
        try {
            // Aynı hesap numarası var mı kontrol et
            $checkStmt = $pdo->prepare("SELECT id FROM clients WHERE account_number = ?");
            $checkStmt->execute([$accountNumber]);
            if ($checkStmt->fetch()) {
                $error = 'Bu hesap numarası zaten kayıtlı.';
            } else {
                // Token oluştur
                $token = bin2hex(random_bytes(TOKEN_LENGTH));
                $stmt = $pdo->prepare("INSERT INTO clients (account_number, account_name, auth_token, last_seen, balance, equity, open_positions) VALUES (?, ?, ?, NOW(), 0, 0, 0)");
                $stmt->execute([$accountNumber, $accountName, $token]);
                logAction('CLIENT_CREATED', "Account: $accountNumber, Name: $accountName", 'INFO');
                $message = "Client başarıyla oluşturuldu. Token: <strong style='color: #667eea; font-family: monospace;'>$token</strong>";
            }
        } catch (Exception $e) {
            $error = 'Client oluşturulurken hata oluştu.';
        }
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'assign') {
    $traderId = (int)($_POST['trader_id'] ?? 0);
    $clientId = (int)($_POST['client_id'] ?? 0);
    
    try {
        $stmt = $pdo->prepare("INSERT INTO trader_clients (trader_id, client_id) VALUES (?, ?)");
        $stmt->execute([$traderId, $clientId]);
        logAction('CLIENT_ASSIGNED', "Trader: $traderId, Client: $clientId", 'INFO');
        $message = 'Client başarıyla trader\'a atandı.';
    } catch (Exception $e) {
        $error = 'Client atanırken hata oluştu.';
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'unassign') {
    $traderId = (int)($_POST['trader_id'] ?? 0);
    $clientId = (int)($_POST['client_id'] ?? 0);
    
    try {
        $stmt = $pdo->prepare("DELETE FROM trader_clients WHERE trader_id = ? AND client_id = ?");
        $stmt->execute([$traderId, $clientId]);
        logAction('CLIENT_UNASSIGNED', "Trader: $traderId, Client: $clientId", 'INFO');
        $message = 'Client başarıyla trader\'dan kaldırıldı.';
    } catch (Exception $e) {
        $error = 'Client kaldırılırken hata oluştu.';
    }
}

$traderStmt = $pdo->query("SELECT id, username FROM users WHERE role = 'trader' AND status = 'active' ORDER BY username");
$traders = $traderStmt->fetchAll();

$clientStmt = $pdo->query("SELECT id, account_number, account_name FROM clients ORDER BY account_name");
$clients = $clientStmt->fetchAll();

$relationsStmt = $pdo->query("SELECT tc.id, tc.trader_id, tc.client_id, u.username, c.account_number, c.account_name FROM trader_clients tc JOIN users u ON tc.trader_id = u.id JOIN clients c ON tc.client_id = c.id ORDER BY u.username, c.account_name");
$relations = $relationsStmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>Client Yönetimi - CopyPoz</title>
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
                    <li class="nav-item"><a class="nav-link" href="../logout.php" style="color: rgba(255, 255, 255, 0.8);"><i class="fas fa-sign-out-alt"></i> Çıkış</a></li>
                </ul>
            </div>
        </div>
    </nav>

    <div class="container-fluid" style="padding: 20px;">
        <!-- Admin Nav -->
        <div class="admin-nav" style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; gap: 15px; flex-wrap: wrap;">
            <span style="display: flex; align-items: center; font-weight: bold; margin-right: 10px;">👑 Admin Paneli:</span>
            <a href="users.php" style="text-decoration: none; color: #2c3e50; font-weight: 600; padding: 8px 12px; border-radius: 5px; background: #ecf0f1; transition: all 0.3s;">👥 Kullanıcılar</a>
            <a href="clients.php" style="text-decoration: none; color: white; font-weight: 600; padding: 8px 12px; border-radius: 5px; background: #667eea; box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);">💻 Client Yönetimi</a>
            <a href="master-groups-ui.php" style="text-decoration: none; color: #2c3e50; font-weight: 600; padding: 8px 12px; border-radius: 5px; background: #ecf0f1; transition: all 0.3s;">🔗 Master Grupları</a>
            <a href="tokens-ui.php" style="text-decoration: none; color: #2c3e50; font-weight: 600; padding: 8px 12px; border-radius: 5px; background: #ecf0f1; transition: all 0.3s;">🔑 Token Yönetimi</a>
            <a href="licenses.php" style="text-decoration: none; color: #2c3e50; font-weight: 600; padding: 8px 12px; border-radius: 5px; background: #ecf0f1; transition: all 0.3s;">📜 Lisanslar</a>
            <a href="profile.php" style="text-decoration: none; color: #2c3e50; font-weight: 600; padding: 8px 12px; border-radius: 5px; background: #ecf0f1; transition: all 0.3s;">⚙️ Profil</a>
        </div>
        <h2 style="margin-bottom: 20px;"><i class="fas fa-server"></i> Client Yönetimi</h2>

        <?php if ($message): ?>
            <div style="background-color: #d4edda; color: #155724; padding: 12px 15px; border-radius: 8px; margin-bottom: 20px;"><i class="fas fa-check-circle"></i> <?= escapeHtml($message) ?></div>
        <?php endif; ?>

        <?php if ($error): ?>
            <div style="background-color: #f8d7da; color: #721c24; padding: 12px 15px; border-radius: 8px; margin-bottom: 20px;"><i class="fas fa-exclamation-circle"></i> <?= escapeHtml($error) ?></div>
        <?php endif; ?>

        <div style="background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); margin-bottom: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 20px; font-weight: 600; border-radius: 12px 12px 0 0;"><i class="fas fa-plus-circle"></i> Yeni Client Oluştur</div>
            <div style="padding: 20px;">
                <form method="POST" action="?action=create">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        <div>
                            <label style="font-weight: 600; color: #333; margin-bottom: 8px; display: block; font-size: 14px;">Hesap Numarası</label>
                            <input type="number" name="account_number" style="border: 2px solid #e0e0e0; border-radius: 8px; padding: 12px 15px; font-size: 14px; width: 100%; min-height: 44px;" placeholder="Örn: 123456" required>
                        </div>
                        <div>
                            <label style="font-weight: 600; color: #333; margin-bottom: 8px; display: block; font-size: 14px;">Client Adı</label>
                            <input type="text" name="account_name" style="border: 2px solid #e0e0e0; border-radius: 8px; padding: 12px 15px; font-size: 14px; width: 100%; min-height: 44px;" placeholder="Örn: Demo Account" required>
                        </div>
                        <div style="display: flex; align-items: flex-end;">
                            <button type="submit" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; padding: 12px 20px; font-weight: 600; cursor: pointer; width: 100%; min-height: 44px;"><i class="fas fa-plus"></i> Oluştur</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>

        <div style="background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); margin-bottom: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 20px; font-weight: 600; border-radius: 12px 12px 0 0;"><i class="fas fa-link"></i> Trader'a Client Ata</div>
            <div style="padding: 20px;">
                <form method="POST" action="?action=assign">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        <div>
                            <label style="font-weight: 600; color: #333; margin-bottom: 8px; display: block; font-size: 14px;">Trader Seç</label>
                            <select name="trader_id" style="border: 2px solid #e0e0e0; border-radius: 8px; padding: 12px 15px; font-size: 14px; width: 100%; min-height: 44px;" required>
                                <option value="">-- Trader Seçin --</option>
                                <?php foreach ($traders as $trader): ?>
                                    <option value="<?= $trader['id'] ?>"><?= escapeHtml($trader['username']) ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div>
                            <label style="font-weight: 600; color: #333; margin-bottom: 8px; display: block; font-size: 14px;">Client Seç</label>
                            <select name="client_id" style="border: 2px solid #e0e0e0; border-radius: 8px; padding: 12px 15px; font-size: 14px; width: 100%; min-height: 44px;" required>
                                <option value="">-- Client Seçin --</option>
                                <?php foreach ($clients as $client): ?>
                                    <option value="<?= $client['id'] ?>"><?= escapeHtml($client['account_name']) ?> (<?= $client['account_number'] ?>)</option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div style="display: flex; align-items: flex-end;">
                            <button type="submit" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; padding: 12px 20px; font-weight: 600; cursor: pointer; width: 100%; min-height: 44px;"><i class="fas fa-plus"></i> Ata</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>

        <div style="background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 20px; font-weight: 600; border-radius: 12px 12px 0 0;"><i class="fas fa-list"></i> Trader - Client İlişkileri</div>
            <div style="padding: 20px;">
                <?php if (empty($relations)): ?>
                    <div style="background-color: #d1ecf1; color: #0c5460; padding: 12px 15px; border-radius: 8px;"><i class="fas fa-info-circle"></i> Henüz atanmış client bulunmuyor.</div>
                <?php else: ?>
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="border-bottom: 2px solid #e0e0e0;">
                                    <th style="padding: 15px; text-align: left; font-weight: 600; color: #333; font-size: 13px; text-transform: uppercase;">Trader</th>
                                    <th style="padding: 15px; text-align: left; font-weight: 600; color: #333; font-size: 13px; text-transform: uppercase;">Client Adı</th>
                                    <th style="padding: 15px; text-align: left; font-weight: 600; color: #333; font-size: 13px; text-transform: uppercase;">Hesap No</th>
                                    <th style="padding: 15px; text-align: left; font-weight: 600; color: #333; font-size: 13px; text-transform: uppercase;">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($relations as $relation): ?>
                                    <tr style="border-bottom: 1px solid #f0f0f0;">
                                        <td style="padding: 15px;"><strong><?= escapeHtml($relation['username']) ?></strong></td>
                                        <td style="padding: 15px;"><?= escapeHtml($relation['account_name']) ?></td>
                                        <td style="padding: 15px;"><?= escapeHtml($relation['account_number']) ?></td>
                                        <td style="padding: 15px;">
                                            <form method="POST" action="?action=unassign" style="display: inline;" onsubmit="return confirm('Emin misiniz?');">
                                                <input type="hidden" name="trader_id" value="<?= $relation['trader_id'] ?>">
                                                <input type="hidden" name="client_id" value="<?= $relation['client_id'] ?>">
                                                <button type="submit" style="background: #f8d7da; border: 1px solid #dc3545; color: #721c24; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;"><i class="fas fa-unlink"></i> Kaldır</button>
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
