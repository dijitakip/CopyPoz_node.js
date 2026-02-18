<?php
/**
 * CopyPoz V5 - Token Management UI
 * Master ve Client tokenlarını yönet
 */

require_once '../config/db.php';
requireAdmin();

$page_title = 'Token Yönetimi';
?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $page_title; ?> - CopyPoz V5</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link rel="stylesheet" href="../assets/style.css">
    <style>
        body { background-color: #f8f9fa; }
        .token-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .token-section {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .token-section h2 {
            margin-top: 0;
            color: #333;
            border-bottom: 2px solid #007bff;
            padding-bottom: 10px;
        }
        
        .token-form {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-bottom: 20px;
        }
        
        .form-group {
            display: flex;
            flex-direction: column;
        }
        
        .form-group label {
            font-weight: bold;
            margin-bottom: 5px;
            color: #555;
        }
        
        .form-group input,
        .form-group select {
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
        }
        
        .btn {
            padding: 10px 15px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s;
        }
        
        .btn-primary {
            background: #007bff;
            color: white;
        }
        
        .btn-primary:hover {
            background: #0056b3;
        }
        
        .btn-danger {
            background: #dc3545;
            color: white;
        }
        
        .btn-danger:hover {
            background: #c82333;
        }
        
        .btn-warning {
            background: #ffc107;
            color: black;
        }
        
        .btn-warning:hover {
            background: #e0a800;
        }
        
        .token-list {
            margin-top: 20px;
        }
        
        .token-item {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 15px;
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .token-info {
            flex: 1;
        }
        
        .token-info h4 {
            margin: 0 0 5px 0;
            color: #333;
        }
        
        .token-info p {
            margin: 3px 0;
            color: #666;
            font-size: 13px;
        }
        
        .token-value {
            background: #e9ecef;
            padding: 8px 12px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            word-break: break-all;
            margin: 5px 0;
        }
        
        .token-actions {
            display: flex;
            gap: 5px;
            margin-left: 10px;
        }
        
        .token-actions button {
            padding: 6px 10px;
            font-size: 12px;
        }
        
        .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 12px;
            font-weight: bold;
        }
        
        .status-active {
            background: #d4edda;
            color: #155724;
        }
        
        .status-inactive {
            background: #f8d7da;
            color: #721c24;
        }
        
        .alert {
            padding: 12px;
            border-radius: 4px;
            margin-bottom: 15px;
        }
        
        .alert-success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .alert-error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .alert-info {
            background: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
        }
        
        @media (max-width: 768px) {
            .token-container {
                grid-template-columns: 1fr;
            }
            
            .token-item {
                flex-direction: column;
                align-items: flex-start;
            }
            
            .token-actions {
                margin-left: 0;
                margin-top: 10px;
                width: 100%;
            }
            
            .token-actions button {
                flex: 1;
            }
        }

        .admin-nav {
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
        }

        .admin-nav a {
            text-decoration: none;
            color: #2c3e50;
            font-weight: 600;
            padding: 8px 12px;
            border-radius: 5px;
            background: #ecf0f1;
            transition: all 0.3s;
        }

        .admin-nav a:hover {
            background: #3498db;
            color: white;
        }
    </style>
</head>
<body>
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
    
    <div class="container" style="padding-top: 20px;">
        <!-- Admin Nav -->
        <div class="admin-nav">
            <span style="display: flex; align-items: center; font-weight: bold; margin-right: 10px;">👑 Admin Paneli:</span>
            <a href="users.php">👥 Kullanıcılar</a>
            <a href="clients.php">💻 Client Yönetimi</a>
            <a href="master-groups-ui.php">🔗 Master Grupları</a>
            <a href="tokens-ui.php">🔑 Token Yönetimi</a>
            <a href="licenses.php">📜 Lisanslar</a>
            <a href="profile.php">⚙️ Profil</a>
        </div>

        <h1><?php echo $page_title; ?></h1>
        
        <div id="alert-container"></div>
        
        <div class="token-container">
            <!-- MASTER TOKEN YÖNETİMİ -->
            <div class="token-section">
                <h2>🔐 Master Token</h2>
                
                <form class="token-form" id="master-form">
                    <div class="form-group">
                        <label>Master Adı</label>
                        <input type="text" id="master_name" placeholder="Örn: Master-1" required>
                    </div>
                    <div class="form-group">
                        <label>Hesap Numarası</label>
                        <input type="number" id="master_account" placeholder="Örn: 123456789" required>
                    </div>
                    <div class="form-group">
                        <label>Hesap Adı</label>
                        <input type="text" id="master_account_name" placeholder="Örn: Live Account">
                    </div>
                    <div class="form-group">
                        <label>Token Tipi</label>
                        <select id="master_token_type">
                            <option value="MASTER_TOKEN">MASTER_TOKEN</option>
                            <option value="ADMIN_TOKEN">ADMIN_TOKEN</option>
                        </select>
                    </div>
                    <button type="button" class="btn btn-primary" onclick="createMasterToken()">
                        Token Oluştur
                    </button>
                </form>
                
                <div class="token-list" id="master-list">
                    <p style="text-align: center; color: #999;">Yükleniyor...</p>
                </div>
            </div>
            
            <!-- CLIENT TOKEN YÖNETİMİ -->
            <div class="token-section">
                <h2>🔑 Client Token</h2>
                
                <form class="token-form" id="client-form">
                    <div class="form-group">
                        <label>Hesap Numarası</label>
                        <input type="number" id="client_account" placeholder="Örn: 987654321" required>
                    </div>
                    <div class="form-group">
                        <label>Hesap Adı</label>
                        <input type="text" id="client_account_name" placeholder="Örn: Client Account">
                    </div>
                    <div class="form-group">
                        <label>Master Seç</label>
                        <select id="client_master_id">
                            <option value="">-- Master Seçiniz --</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Token Tipi</label>
                        <select id="client_token_type">
                            <option value="CLIENT_TOKEN">CLIENT_TOKEN</option>
                            <option value="TRADER_TOKEN">TRADER_TOKEN</option>
                        </select>
                    </div>
                    <button type="button" class="btn btn-primary" onclick="createClientToken()">
                        Token Oluştur
                    </button>
                </form>
                
                <div class="token-list" id="client-list">
                    <p style="text-align: center; color: #999;">Yükleniyor...</p>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // Master Token Yönetimi
        function loadMasterTokens() {
            fetch('tokens.php?action=list&type=master')
                .then(r => r.json())
                .then(data => {
                    if (data.success) {
                        let html = '';
                        if (data.data.length === 0) {
                            html = '<p style="text-align: center; color: #999;">Henüz master token yok</p>';
                        } else {
                            data.data.forEach(master => {
                                html += `
                                    <div class="token-item">
                                        <div class="token-info">
                                            <h4>${master.master_name}</h4>
                                            <p><strong>Hesap:</strong> ${master.account_number} (${master.account_name})</p>
                                            <p><strong>Tip:</strong> ${master.token_type}</p>
                                            <p><strong>Durum:</strong> <span class="status-badge status-${master.status}">${master.status.toUpperCase()}</span></p>
                                            <div class="token-value">Token: ${master.token}</div>
                                            <p><strong>Son Görülme:</strong> ${master.last_seen || 'Hiç'}</p>
                                        </div>
                                        <div class="token-actions">
                                            <button class="btn btn-warning" onclick="regenerateMasterToken(${master.id})">Yenile</button>
                                            <button class="btn btn-danger" onclick="deleteMasterToken(${master.id})">Sil</button>
                                        </div>
                                    </div>
                                `;
                            });
                        }
                        document.getElementById('master-list').innerHTML = html;
                        
                        // Master dropdown'ı doldur
                        let options = '<option value="">-- Master Seçiniz --</option>';
                        data.data.forEach(master => {
                            options += `<option value="${master.id}">${master.master_name}</option>`;
                        });
                        document.getElementById('client_master_id').innerHTML = options;
                    }
                })
                .catch(e => showAlert('Master tokenlar yüklenemedi: ' + e, 'error'));
        }
        
        function createMasterToken() {
            const formData = new FormData();
            formData.append('master_name', document.getElementById('master_name').value);
            formData.append('account_number', document.getElementById('master_account').value);
            formData.append('account_name', document.getElementById('master_account_name').value);
            formData.append('token_type', document.getElementById('master_token_type').value);
            
            fetch('tokens.php?action=create&type=master', {
                method: 'POST',
                body: formData
            })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    showAlert('Master token oluşturuldu: ' + data.token, 'success');
                    document.getElementById('master-form').reset();
                    loadMasterTokens();
                } else {
                    showAlert(data.error, 'error');
                }
            })
            .catch(e => showAlert('Hata: ' + e, 'error'));
        }
        
        function regenerateMasterToken(id) {
            if (!confirm('Master tokenı yenilemek istediğinize emin misiniz?')) return;
            
            const formData = new FormData();
            formData.append('id', id);
            
            fetch('tokens.php?action=regenerate&type=master', {
                method: 'POST',
                body: formData
            })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    showAlert('Token yenilendi: ' + data.token, 'success');
                    loadMasterTokens();
                } else {
                    showAlert(data.error, 'error');
                }
            })
            .catch(e => showAlert('Hata: ' + e, 'error'));
        }
        
        function deleteMasterToken(id) {
            if (!confirm('Master tokenı silmek istediğinize emin misiniz?')) return;
            
            const formData = new FormData();
            formData.append('id', id);
            
            fetch('tokens.php?action=delete&type=master', {
                method: 'POST',
                body: formData
            })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    showAlert('Master token silindi', 'success');
                    loadMasterTokens();
                } else {
                    showAlert(data.error, 'error');
                }
            })
            .catch(e => showAlert('Hata: ' + e, 'error'));
        }
        
        // Client Token Yönetimi
        function loadClientTokens() {
            fetch('tokens.php?action=list&type=client')
                .then(r => r.json())
                .then(data => {
                    if (data.success) {
                        let html = '';
                        if (data.data.length === 0) {
                            html = '<p style="text-align: center; color: #999;">Henüz client token yok</p>';
                        } else {
                            data.data.forEach(client => {
                                html += `
                                    <div class="token-item">
                                        <div class="token-info">
                                            <h4>Client - ${client.account_number}</h4>
                                            <p><strong>Hesap Adı:</strong> ${client.account_name}</p>
                                            <p><strong>Master:</strong> ${client.master_name || 'Atanmamış'}</p>
                                            <p><strong>Tip:</strong> ${client.token_type}</p>
                                            <p><strong>Durum:</strong> <span class="status-badge status-${client.status}">${client.status.toUpperCase()}</span></p>
                                            <div class="token-value">Token: ${client.auth_token}</div>
                                        </div>
                                        <div class="token-actions">
                                            <button class="btn btn-warning" onclick="regenerateClientToken(${client.id})">Yenile</button>
                                        </div>
                                    </div>
                                `;
                            });
                        }
                        document.getElementById('client-list').innerHTML = html;
                    }
                })
                .catch(e => showAlert('Client tokenlar yüklenemedi: ' + e, 'error'));
        }
        
        function createClientToken() {
            const formData = new FormData();
            formData.append('account_number', document.getElementById('client_account').value);
            formData.append('account_name', document.getElementById('client_account_name').value);
            formData.append('master_id', document.getElementById('client_master_id').value);
            formData.append('token_type', document.getElementById('client_token_type').value);
            
            fetch('tokens.php?action=create&type=client', {
                method: 'POST',
                body: formData
            })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    showAlert('Client token oluşturuldu: ' + data.token, 'success');
                    document.getElementById('client-form').reset();
                    loadClientTokens();
                } else {
                    showAlert(data.error, 'error');
                }
            })
            .catch(e => showAlert('Hata: ' + e, 'error'));
        }
        
        function regenerateClientToken(id) {
            if (!confirm('Client tokenı yenilemek istediğinize emin misiniz?')) return;
            
            const formData = new FormData();
            formData.append('id', id);
            
            fetch('tokens.php?action=regenerate&type=client', {
                method: 'POST',
                body: formData
            })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    showAlert('Token yenilendi: ' + data.token, 'success');
                    loadClientTokens();
                } else {
                    showAlert(data.error, 'error');
                }
            })
            .catch(e => showAlert('Hata: ' + e, 'error'));
        }
        
        function showAlert(message, type) {
            const alertDiv = document.createElement('div');
            alertDiv.className = `alert alert-${type}`;
            alertDiv.textContent = message;
            document.getElementById('alert-container').appendChild(alertDiv);
            setTimeout(() => alertDiv.remove(), 5000);
        }
        
        // Sayfa yüklendiğinde
        document.addEventListener('DOMContentLoaded', () => {
            loadMasterTokens();
            loadClientTokens();
        });
    </script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
