<?php
@session_start();
require_once 'config/db.php';

$currentUser = authenticateUser();
if (!$currentUser) {
    header("Location: index.php");
    exit;
}

$masterStmt = $pdo->query("SELECT * FROM master_state WHERE id = 1");
$master = $masterStmt->fetch();
$masterPositions = $master ? json_decode($master['positions_json'], true)['positions'] ?? [] : [];

if ($currentUser['role'] === 'admin') {
    $clientStmt = $pdo->query("SELECT * FROM clients ORDER BY last_seen DESC");
} else {
    $clientStmt = $pdo->prepare("SELECT c.* FROM clients c JOIN trader_clients tc ON c.id = tc.client_id WHERE tc.trader_id = ? ORDER BY c.last_seen DESC");
    $clientStmt->execute([$currentUser['id']]);
}

$clients = $clientStmt->fetchAll();

$totalClients = count($clients);
$activeClients = 0;
$totalBalance = 0;
$totalEquity = 0;

foreach ($clients as $c) {
    if (strtotime($c['last_seen']) > time() - 60) {
        $activeClients++;
    }
    $totalBalance += $c['balance'];
    $totalEquity += $c['equity'];
}

$totalProfit = $totalEquity - $totalBalance;
?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <meta name="description" content="CopyPoz FX Trading Dashboard">
    <meta name="theme-color" content="#667eea">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="CopyPoz">
    <link rel="apple-touch-icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 180 180'><rect fill='%23667eea' width='180' height='180'/><text x='90' y='90' font-size='80' font-weight='bold' fill='white' text-anchor='middle' dominant-baseline='middle'>CP</text></svg>">
    <link rel="manifest" href="manifest.json">
    <title>CopyPoz Dashboard</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link href="assets/style.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-dark" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); padding: 15px 0;">
        <div class="container-fluid">
            <a class="navbar-brand" href="dashboard.php" style="font-weight: 700; font-size: 20px;">
                <i class="fas fa-chart-line"></i> CopyPoz
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    <?php if ($currentUser['role'] === 'admin'): ?>
                        <li class="nav-item dropdown">
                            <a class="nav-link dropdown-toggle" href="#" id="adminMenu" role="button" data-bs-toggle="dropdown" style="color: rgba(255, 255, 255, 0.8);">
                                <i class="fas fa-cog"></i> Yönetim
                            </a>
                            <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="adminMenu">
                                <li><a class="dropdown-item" href="admin/users.php"><i class="fas fa-users"></i> Kullanıcılar</a></li>
                                <li><a class="dropdown-item" href="admin/clients.php"><i class="fas fa-server"></i> Client Yönetimi</a></li>
                            </ul>
                        </li>
                    <?php endif; ?>
                    <li class="nav-item">
                        <span class="nav-link" style="color: rgba(255, 255, 255, 0.8);">
                            <i class="fas fa-user-circle"></i> <?= escapeHtml($currentUser['username']) ?>
                            <span class="badge bg-info ms-2"><?= ucfirst($currentUser['role']) ?></span>
                        </span>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="admin/profile.php" style="color: rgba(255, 255, 255, 0.8);">
                            <i class="fas fa-cog"></i> Profil
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="logout.php" style="color: rgba(255, 255, 255, 0.8);">
                            <i class="fas fa-sign-out-alt"></i> Çıkış
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <div class="container-fluid" style="padding: 20px; background-color: #f8f9fa;">
        <div class="row mb-4">
            <div class="col-12 col-sm-6 col-lg-3">
                <div style="background: white; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); border-left: 4px solid #0d6efd;">
                    <div style="font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Aktif Clientlar</div>
                    <div style="font-size: 28px; font-weight: 700; color: #212529;"><?= $activeClients ?> / <?= $totalClients ?></div>
                </div>
            </div>
            <div class="col-12 col-sm-6 col-lg-3">
                <div style="background: white; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); border-left: 4px solid #198754;">
                    <div style="font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Toplam Bakiye</div>
                    <div style="font-size: 28px; font-weight: 700; color: #212529;">$<?= number_format($totalBalance, 0) ?></div>
                </div>
            </div>
            <div class="col-12 col-sm-6 col-lg-3">
                <div style="background: white; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); border-left: 4px solid <?= $totalProfit >= 0 ? '#198754' : '#dc3545' ?>;">
                    <div style="font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Toplam Kâr/Zarar</div>
                    <div style="font-size: 28px; font-weight: 700; color: <?= $totalProfit >= 0 ? '#198754' : '#dc3545' ?>;">$<?= number_format($totalProfit, 0) ?></div>
                </div>
            </div>
            <div class="col-12 col-sm-6 col-lg-3">
                <div style="background: white; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); border-left: 4px solid #0dcaf0;">
                    <div style="font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Master Pozisyonlar</div>
                    <div style="font-size: 28px; font-weight: 700; color: #212529;"><?= count($masterPositions) ?></div>
                </div>
            </div>
        </div>

        <div style="background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); margin-bottom: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 20px; font-weight: 600; border-radius: 12px 12px 0 0;">
                <i class="fas fa-signal"></i> Master Açık Pozisyonlar
            </div>
            <div style="padding: 20px;">
                <?php if (empty($masterPositions)): ?>
                    <div style="text-align: center; padding: 40px 20px; color: #999;">
                        <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 15px; opacity: 0.3;"></i>
                        <p>Açık pozisyon bulunmuyor</p>
                    </div>
                <?php else: ?>
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="border-bottom: 2px solid #e0e0e0;">
                                    <th style="padding: 15px; text-align: left; font-weight: 600; color: #333; font-size: 13px; text-transform: uppercase;">Ticket</th>
                                    <th style="padding: 15px; text-align: left; font-weight: 600; color: #333; font-size: 13px; text-transform: uppercase;">Sembol</th>
                                    <th style="padding: 15px; text-align: left; font-weight: 600; color: #333; font-size: 13px; text-transform: uppercase;">Tip</th>
                                    <th style="padding: 15px; text-align: left; font-weight: 600; color: #333; font-size: 13px; text-transform: uppercase;">Lot</th>
                                    <th style="padding: 15px; text-align: left; font-weight: 600; color: #333; font-size: 13px; text-transform: uppercase;">Fiyat</th>
                                    <th style="padding: 15px; text-align: left; font-weight: 600; color: #333; font-size: 13px; text-transform: uppercase;">Kâr/Zarar</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($masterPositions as $pos): ?>
                                    <tr style="border-bottom: 1px solid #f0f0f0;">
                                        <td style="padding: 15px;"><strong><?= escapeHtml($pos['ticket']) ?></strong></td>
                                        <td style="padding: 15px;"><?= escapeHtml($pos['symbol']) ?></td>
                                        <td style="padding: 15px;"><span style="background-color: <?= $pos['type'] == 0 ? '#d4edda' : '#f8d7da' ?>; color: <?= $pos['type'] == 0 ? '#155724' : '#721c24' ?>; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;"><?= $pos['type'] == 0 ? 'BUY' : 'SELL' ?></span></td>
                                        <td style="padding: 15px;"><?= escapeHtml($pos['volume']) ?></td>
                                        <td style="padding: 15px;"><?= escapeHtml($pos['price']) ?></td>
                                        <td style="padding: 15px; color: <?= $pos['profit'] >= 0 ? '#198754' : '#dc3545' ?>; font-weight: 600;">$<?= number_format($pos['profit'], 2) ?></td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                <?php endif; ?>
            </div>
        </div>

        <div style="background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 20px; font-weight: 600; border-radius: 12px 12px 0 0; display: flex; justify-content: space-between; align-items: center;">
                <span><i class="fas fa-users"></i> Client Listesi</span>
                <button onclick="location.reload()" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;"><i class="fas fa-sync"></i> Yenile</button>
            </div>
            <div style="padding: 20px;">
                <?php if (empty($clients)): ?>
                    <div style="text-align: center; padding: 40px 20px; color: #999;">
                        <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 15px; opacity: 0.3;"></i>
                        <p>Henüz client kaydı bulunmuyor</p>
                    </div>
                <?php else: ?>
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="border-bottom: 2px solid #e0e0e0;">
                                    <th style="padding: 15px; text-align: left; font-weight: 600; color: #333; font-size: 13px; text-transform: uppercase;">Durum</th>
                                    <th style="padding: 15px; text-align: left; font-weight: 600; color: #333; font-size: 13px; text-transform: uppercase;">Hesap No</th>
                                    <th style="padding: 15px; text-align: left; font-weight: 600; color: #333; font-size: 13px; text-transform: uppercase;">İsim</th>
                                    <th style="padding: 15px; text-align: left; font-weight: 600; color: #333; font-size: 13px; text-transform: uppercase;">Bakiye</th>
                                    <th style="padding: 15px; text-align: left; font-weight: 600; color: #333; font-size: 13px; text-transform: uppercase;">Equity</th>
                                    <th style="padding: 15px; text-align: left; font-weight: 600; color: #333; font-size: 13px; text-transform: uppercase;">Pozisyonlar</th>
                                    <th style="padding: 15px; text-align: left; font-weight: 600; color: #333; font-size: 13px; text-transform: uppercase;">Son Görülme</th>
                                    <th style="padding: 15px; text-align: left; font-weight: 600; color: #333; font-size: 13px; text-transform: uppercase;">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($clients as $client): 
                                    $isOnline = strtotime($client['last_seen']) > time() - 60;
                                ?>
                                    <tr style="border-bottom: 1px solid #f0f0f0;">
                                        <td style="padding: 15px;"><span style="background-color: <?= $isOnline ? '#d4edda' : '#e2e3e5' ?>; color: <?= $isOnline ? '#155724' : '#383d41' ?>; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;"><i class="fas fa-circle"></i> <?= $isOnline ? 'ONLINE' : 'OFFLINE' ?></span></td>
                                        <td style="padding: 15px;"><strong><?= escapeHtml($client['account_number']) ?></strong></td>
                                        <td style="padding: 15px;"><?= escapeHtml($client['account_name']) ?></td>
                                        <td style="padding: 15px;">$<?= number_format($client['balance'], 2) ?></td>
                                        <td style="padding: 15px;">$<?= number_format($client['equity'], 2) ?></td>
                                        <td style="padding: 15px;"><?= escapeHtml($client['open_positions']) ?></td>
                                        <td style="padding: 15px; color: #999; font-size: 12px;"><?= escapeHtml($client['last_seen']) ?></td>
                                        <td style="padding: 15px;">
                                            <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                                                <button onclick="sendCommand(<?= $client['id'] ?>, 'PAUSE')" style="background: #fff3cd; border: 1px solid #ffc107; color: #856404; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;"><i class="fas fa-pause"></i></button>
                                                <button onclick="sendCommand(<?= $client['id'] ?>, 'RESUME')" style="background: #d4edda; border: 1px solid #198754; color: #155724; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;"><i class="fas fa-play"></i></button>
                                                <button onclick="sendCommand(<?= $client['id'] ?>, 'CLOSE_ALL')" style="background: #f8d7da; border: 1px solid #dc3545; color: #721c24; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;"><i class="fas fa-times-circle"></i></button>
                                            </div>
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

        // Modal backdrop sorununu çöz
        document.addEventListener('DOMContentLoaded', function() {
            // Tüm modalları kapat
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
            
            // Backdrop'ı kaldır
            document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
                backdrop.remove();
            });
            
            // Body'den modal-open class'ını kaldır
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
        });
        
        function sendCommand(clientId, command) {
            if (!confirm(`Bu komutu göndermek istediğinize emin misiniz? (${command})`)) return;
            axios.post('api/command.php', { client_id: clientId, command: command })
                .then(function (response) { alert('Komut başarıyla gönderildi!'); })
                .catch(function (error) { alert('Hata: ' + (error.response?.data?.error || 'Bilinmeyen hata')); });
        }
    </script>
</body>
</html>
