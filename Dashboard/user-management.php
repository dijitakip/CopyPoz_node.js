<?php
/**
 * CopyPoz V5 - User Management UI
 * Master Grupları, Client Terminalleri ve Kullanıcı Atamalarını Yönet
 */

require_once 'config/db.php';
requireAdmin();

$page_title = 'Kullanıcı Yönetimi';
?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $page_title; ?> - CopyPoz V5</title>
    <link rel="stylesheet" href="assets/style.css">
    <style>
        .management-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .management-section {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .management-section h2 {
            margin-top: 0;
            color: #333;
            border-bottom: 2px solid #007bff;
            padding-bottom: 10px;
        }
        
        .form-group {
            display: flex;
            flex-direction: column;
            margin-bottom: 10px;
        }
        
        .form-group label {
            font-weight: bold;
            margin-bottom: 5px;
            color: #555;
        }
        
        .form-group input,
        .form-group select,
        .form-group textarea {
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
            margin-right: 5px;
        }
        
        .btn-primary {
            background: #007bff;
            color: white;
        }
        
        .btn-primary:hover {
            background: #0056b3;
        }
        
        .btn-success {
            background: #28a745;
            color: white;
        }
        
        .btn-success:hover {
            background: #218838;
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
        
        .btn-sm {
            padding: 5px 10px;
            font-size: 12px;
        }
        
        .list-container {
            margin-top: 20px;
            max-height: 500px;
            overflow-y: auto;
        }
        
        .list-item {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 12px;
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .list-item-info {
            flex: 1;
        }
        
        .list-item-info h4 {
            margin: 0 0 5px 0;
            color: #333;
        }
        
        .list-item-info p {
            margin: 3px 0;
            color: #666;
            font-size: 13px;
        }
        
        .list-item-actions {
            display: flex;
            gap: 5px;
            margin-left: 10px;
        }
        
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 12px;
            font-weight: bold;
            margin-right: 5px;
        }
        
        .badge-primary {
            background: #007bff;
            color: white;
        }
        
        .badge-success {
            background: #28a745;
            color: white;
        }
        
        .badge-warning {
            background: #ffc107;
            color: black;
        }
        
        .badge-danger {
            background: #dc3545;
            color: white;
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
        
        .tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            border-bottom: 2px solid #dee2e6;
        }
        
        .tab-button {
            padding: 10px 15px;
            background: none;
            border: none;
            cursor: pointer;
            font-weight: bold;
            color: #666;
            border-bottom: 3px solid transparent;
            transition: all 0.3s;
        }
        
        .tab-button.active {
            color: #007bff;
            border-bottom-color: #007bff;
        }
        
        .tab-content {
            display: none;
        }
        
        .tab-content.active {
            display: block;
        }
        
        @media (max-width: 768px) {
            .management-container {
                grid-template-columns: 1fr;
            }
            
            .list-item {
                flex-direction: column;
                align-items: flex-start;
            }
            
            .list-item-actions {
                margin-left: 0;
                margin-top: 10px;
                width: 100%;
            }
            
            .list-item-actions button {
                flex: 1;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1><?php echo $page_title; ?></h1>
        
        <div id="alert-container"></div>
        
        <!-- TABS -->
        <div class="tabs">
            <button class="tab-button active" onclick="switchTab('master-groups')">Master Grupları</button>
            <button class="tab-button" onclick="switchTab('client-terminals')">Client Terminalleri</button>
            <button class="tab-button" onclick="switchTab('user-assignments')">Kullanıcı Atamaları</button>
        </div>
        
        <!-- MASTER GROUPS TAB -->
        <div id="master-groups" class="tab-content active">
            <div class="management-container">
                <!-- Master Grubu Oluştur -->
                <div class="management-section">
                    <h2>📁 Yeni Master Grubu</h2>
                    
                    <form class="token-form" id="master-group-form">
                        <div class="form-group">
                            <label>Grup Adı</label>
                            <input type="text" id="group_name" placeholder="Örn: Grup-1" required>
                        </div>
                        <div class="form-group">
                            <label>Açıklama</label>
                            <textarea id="group_description" placeholder="Grup açıklaması" rows="3"></textarea>
                        </div>
                        <div class="form-group">
                            <label>Max Client Sayısı</label>
                            <input type="number" id="group_max_clients" value="50" min="1">
                        </div>
                        <button type="button" class="btn btn-primary" onclick="createMasterGroup()">
                            Grup Oluştur
                        </button>
                    </form>
                </div>
                
                <!-- Master Grupları Listesi -->
                <div class="management-section">
                    <h2>📋 Master Grupları</h2>
                    <div class="list-container" id="master-groups-list">
                        <p style="text-align: center; color: #999;">Yükleniyor...</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- CLIENT TERMINALS TAB -->
        <div id="client-terminals" class="tab-content">
            <div class="management-container">
                <!-- Client Terminal Oluştur -->
                <div class="management-section">
                    <h2>🖥️ Yeni Client Terminal</h2>
                    
                    <form class="token-form" id="client-terminal-form">
                        <div class="form-group">
                            <label>Hesap Numarası</label>
                            <input type="number" id="client_account" placeholder="Örn: 987654321" required>
                        </div>
                        <div class="form-group">
                            <label>Hesap Adı</label>
                            <input type="text" id="client_account_name" placeholder="Örn: Client Account">
                        </div>
                        <div class="form-group">
                            <label>Master Grubu</label>
                            <select id="client_master_group">
                                <option value="">-- Master Grubu Seçiniz --</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Token Tipi</label>
                            <select id="client_token_type">
                                <option value="CLIENT_TOKEN">CLIENT_TOKEN</option>
                                <option value="TRADER_TOKEN">TRADER_TOKEN</option>
                            </select>
                        </div>
                        <button type="button" class="btn btn-primary" onclick="createClientTerminal()">
                            Terminal Oluştur
                        </button>
                    </form>
                </div>
                
                <!-- Client Terminalleri Listesi -->
                <div class="management-section">
                    <h2>📋 Client Terminalleri</h2>
                    <div class="list-container" id="client-terminals-list">
                        <p style="text-align: center; color: #999;">Yükleniyor...</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- USER ASSIGNMENTS TAB -->
        <div id="user-assignments" class="tab-content">
            <div class="management-container">
                <!-- Kullanıcı Ataması -->
                <div class="management-section">
                    <h2>👤 Kullanıcı Ata</h2>
                    
                    <form class="token-form" id="user-assignment-form">
                        <div class="form-group">
                            <label>Client Terminal</label>
                            <select id="assignment_client">
                                <option value="">-- Client Seçiniz --</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Kullanıcı</label>
                            <select id="assignment_user">
                                <option value="">-- Kullanıcı Seçiniz --</option>
                            </select>
                        </div>
                        <button type="button" class="btn btn-success" onclick="assignUserToClient()">
                            Kullanıcı Ata
                        </button>
                    </form>
                    
                    <hr style="margin: 20px 0;">
                    
                    <h3>Kullanıcı Token Ata</h3>
                    
                    <form class="token-form" id="user-token-form">
                        <div class="form-group">
                            <label>Client Terminal</label>
                            <select id="token_client">
                                <option value="">-- Client Seçiniz --</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Kullanıcı</label>
                            <select id="token_user">
                                <option value="">-- Kullanıcı Seçiniz --</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Token Tipi</label>
                            <select id="token_type">
                                <option value="CLIENT_TOKEN">CLIENT_TOKEN</option>
                                <option value="TRADER_TOKEN">TRADER_TOKEN</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Süresi Dol (İsteğe Bağlı)</label>
                            <input type="datetime-local" id="token_expires">
                        </div>
                        <button type="button" class="btn btn-primary" onclick="assignTokenToUser()">
                            Token Ata
                        </button>
                    </form>
                </div>
                
                <!-- Atamalar Listesi -->
                <div class="management-section">
                    <h2>📋 Kullanıcı Atamaları</h2>
                    <div class="list-container" id="user-assignments-list">
                        <p style="text-align: center; color: #999;">Yükleniyor...</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // TAB SWITCHING
        function switchTab(tabName) {
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Show selected tab
            document.getElementById(tabName).classList.add('active');
            event.target.classList.add('active');
            
            // Load data
            if (tabName === 'master-groups') {
                loadMasterGroups();
            } else if (tabName === 'client-terminals') {
                loadClientTerminals();
            } else if (tabName === 'user-assignments') {
                loadUserAssignments();
            }
        }
        
        // ============ MASTER GROUPS ============
        
        function loadMasterGroups() {
            fetch('admin/master-groups.php?action=list')
                .then(r => r.json())
                .then(data => {
                    if (data.success) {
                        let html = '';
                        if (data.data.length === 0) {
                            html = '<p style="text-align: center; color: #999;">Henüz master grubu yok</p>';
                        } else {
                            data.data.forEach(group => {
                                html += `
                                    <div class="list-item">
                                        <div class="list-item-info">
                                            <h4>${group.group_name}</h4>
                                            <p><strong>Açıklama:</strong> ${group.description || 'Yok'}</p>
                                            <p><strong>Max Client:</strong> ${group.max_clients}</p>
                                            <p><strong>Durum:</strong> <span class="badge badge-${group.status === 'active' ? 'success' : 'danger'}">${group.status.toUpperCase()}</span></p>
                                        </div>
                                        <div class="list-item-actions">
                                            <button class="btn btn-primary btn-sm" onclick="viewGroupMembers(${group.id})">Üyeler</button>
                                            <button class="btn btn-danger btn-sm" onclick="deleteGroup(${group.id})">Sil</button>
                                        </div>
                                    </div>
                                `;
                            });
                        }
                        document.getElementById('master-groups-list').innerHTML = html;
                    }
                })
                .catch(e => showAlert('Master gruplar yüklenemedi: ' + e, 'error'));
        }
        
        function createMasterGroup() {
            const formData = new FormData();
            formData.append('group_name', document.getElementById('group_name').value);
            formData.append('description', document.getElementById('group_description').value);
            formData.append('max_clients', document.getElementById('group_max_clients').value);
            
            fetch('admin/master-groups.php?action=create', {
                method: 'POST',
                body: formData
            })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    showAlert('Master grubu oluşturuldu', 'success');
                    document.getElementById('master-group-form').reset();
                    loadMasterGroups();
                    loadClientTerminals();
                } else {
                    showAlert(data.error, 'error');
                }
            })
            .catch(e => showAlert('Hata: ' + e, 'error'));
        }
        
        function deleteGroup(groupId) {
            if (!confirm('Grubu silmek istediğinize emin misiniz?')) return;
            
            const formData = new FormData();
            formData.append('id', groupId);
            
            fetch('admin/master-groups.php?action=delete', {
                method: 'POST',
                body: formData
            })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    showAlert('Grup silindi', 'success');
                    loadMasterGroups();
                } else {
                    showAlert(data.error, 'error');
                }
            })
            .catch(e => showAlert('Hata: ' + e, 'error'));
        }
        
        function viewGroupMembers(groupId) {
            fetch('admin/master-groups.php?action=list_members&group_id=' + groupId)
                .then(r => r.json())
                .then(data => {
                    if (data.success) {
                        let html = '<h3>Grup Üyeleri</h3>';
                        data.data.forEach(member => {
                            html += `<p>${member.username} (${member.email}) - ${member.role}</p>`;
                        });
                        alert(html);
                    }
                })
                .catch(e => showAlert('Üyeler yüklenemedi: ' + e, 'error'));
        }
        
        // ============ CLIENT TERMINALS ============
        
        function loadClientTerminals() {
            fetch('admin/client-management.php?action=list')
                .then(r => r.json())
                .then(data => {
                    if (data.success) {
                        let html = '';
                        if (data.data.length === 0) {
                            html = '<p style="text-align: center; color: #999;">Henüz client terminal yok</p>';
                        } else {
                            data.data.forEach(client => {
                                html += `
                                    <div class="list-item">
                                        <div class="list-item-info">
                                            <h4>Client - ${client.account_number}</h4>
                                            <p><strong>Hesap Adı:</strong> ${client.account_name}</p>
                                            <p><strong>Atanan Kullanıcı:</strong> ${client.assigned_user_name || 'Atanmamış'}</p>
                                            <p><strong>Durum:</strong> <span class="badge badge-${client.status === 'active' ? 'success' : 'danger'}">${client.status.toUpperCase()}</span></p>
                                        </div>
                                        <div class="list-item-actions">
                                            <button class="btn btn-primary btn-sm" onclick="viewClientDetails(${client.id})">Detay</button>
                                        </div>
                                    </div>
                                `;
                            });
                        }
                        document.getElementById('client-terminals-list').innerHTML = html;
                        
                        // Dropdown'ları doldur
                        let options = '<option value="">-- Client Seçiniz --</option>';
                        data.data.forEach(client => {
                            options += `<option value="${client.id}">${client.account_number} - ${client.account_name}</option>`;
                        });
                        document.getElementById('assignment_client').innerHTML = options;
                        document.getElementById('token_client').innerHTML = options;
                    }
                })
                .catch(e => showAlert('Client terminalleri yüklenemedi: ' + e, 'error'));
        }
        
        function createClientTerminal() {
            const formData = new FormData();
            formData.append('account_number', document.getElementById('client_account').value);
            formData.append('account_name', document.getElementById('client_account_name').value);
            formData.append('master_id', document.getElementById('client_master_group').value);
            formData.append('token_type', document.getElementById('client_token_type').value);
            
            fetch('admin/client-management.php?action=create', {
                method: 'POST',
                body: formData
            })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    showAlert('Client terminal oluşturuldu: ' + data.token, 'success');
                    document.getElementById('client-terminal-form').reset();
                    loadClientTerminals();
                } else {
                    showAlert(data.error, 'error');
                }
            })
            .catch(e => showAlert('Hata: ' + e, 'error'));
        }
        
        function viewClientDetails(clientId) {
            fetch('admin/client-management.php?action=get&id=' + clientId)
                .then(r => r.json())
                .then(data => {
                    if (data.success) {
                        const c = data.data;
                        alert(`
Hesap: ${c.account_number}
Adı: ${c.account_name}
Token: ${c.auth_token}
Durum: ${c.status}
Atanan Kullanıcı: ${c.assigned_user_name || 'Atanmamış'}
                        `);
                    }
                })
                .catch(e => showAlert('Detaylar yüklenemedi: ' + e, 'error'));
        }
        
        // ============ USER ASSIGNMENTS ============
        
        function loadUserAssignments() {
            loadClientTerminals();
            loadUsers();
        }
        
        function loadUsers() {
            // Kullanıcıları yükle (basit örnek)
            const users = [
                { id: 1, username: 'trader1' },
                { id: 2, username: 'trader2' },
                { id: 3, username: 'trader3' }
            ];
            
            let options = '<option value="">-- Kullanıcı Seçiniz --</option>';
            users.forEach(user => {
                options += `<option value="${user.id}">${user.username}</option>`;
            });
            document.getElementById('assignment_user').innerHTML = options;
            document.getElementById('token_user').innerHTML = options;
        }
        
        function assignUserToClient() {
            const clientId = document.getElementById('assignment_client').value;
            const userId = document.getElementById('assignment_user').value;
            
            if (!clientId || !userId) {
                showAlert('Client ve Kullanıcı seçiniz', 'error');
                return;
            }
            
            const formData = new FormData();
            formData.append('client_id', clientId);
            formData.append('user_id', userId);
            
            fetch('admin/client-management.php?action=assign_user', {
                method: 'POST',
                body: formData
            })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    showAlert('Kullanıcı atandı', 'success');
                    document.getElementById('user-assignment-form').reset();
                    loadClientTerminals();
                } else {
                    showAlert(data.error, 'error');
                }
            })
            .catch(e => showAlert('Hata: ' + e, 'error'));
        }
        
        function assignTokenToUser() {
            const clientId = document.getElementById('token_client').value;
            const userId = document.getElementById('token_user').value;
            const tokenType = document.getElementById('token_type').value;
            const expiresAt = document.getElementById('token_expires').value;
            
            if (!clientId || !userId) {
                showAlert('Client ve Kullanıcı seçiniz', 'error');
                return;
            }
            
            const formData = new FormData();
            formData.append('client_id', clientId);
            formData.append('user_id', userId);
            formData.append('token_type', tokenType);
            if (expiresAt) formData.append('expires_at', expiresAt);
            
            fetch('admin/client-management.php?action=assign_token', {
                method: 'POST',
                body: formData
            })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    showAlert('Token atandı: ' + data.token, 'success');
                    document.getElementById('user-token-form').reset();
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
            loadMasterGroups();
        });
    </script>
</body>
</html>
