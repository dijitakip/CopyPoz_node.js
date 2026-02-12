<?php
@session_start();
require_once 'config/db.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    header('Location: index.php');
    exit;
}

$user_id = $_SESSION['user_id'];
$user_role = $_SESSION['role'] ?? 'trader';

// Get user info
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
$stmt->execute([$user_id]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

// Get master state
$stmt = $pdo->prepare("SELECT * FROM master_state WHERE id = 1");
$stmt->execute();
$master_state = $stmt->fetch(PDO::FETCH_ASSOC);

// Get clients
$stmt = $pdo->prepare("SELECT * FROM clients ORDER BY last_seen DESC");
$stmt->execute();
$clients = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Get command queue
$stmt = $pdo->prepare("SELECT * FROM command_queue WHERE status = 'pending' ORDER BY created_at DESC LIMIT 10");
$stmt->execute();
$pending_commands = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CopyPoz V5 Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f5f5;
            color: #333;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        
        header {
            background: #2c3e50;
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        header h1 {
            font-size: 28px;
        }
        
        header .user-info {
            text-align: right;
        }
        
        header .user-info p {
            margin: 5px 0;
            font-size: 14px;
        }
        
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .card h2 {
            font-size: 18px;
            margin-bottom: 15px;
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }
        
        .stat {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #ecf0f1;
        }
        
        .stat:last-child {
            border-bottom: none;
        }
        
        .stat-label {
            font-weight: 600;
            color: #555;
        }
        
        .stat-value {
            color: #3498db;
            font-weight: bold;
        }
        
        .status-badge {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 20px;
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
        
        .status-paused {
            background: #fff3cd;
            color: #856404;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        
        table th {
            background: #ecf0f1;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            color: #2c3e50;
            border-bottom: 2px solid #bdc3c7;
        }
        
        table td {
            padding: 12px;
            border-bottom: 1px solid #ecf0f1;
        }
        
        table tr:hover {
            background: #f9f9f9;
        }
        
        .button-group {
            display: flex;
            gap: 10px;
            margin-top: 15px;
            flex-wrap: wrap;
        }
        
        button {
            padding: 10px 15px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s;
        }
        
        .btn-primary {
            background: #3498db;
            color: white;
        }
        
        .btn-primary:hover {
            background: #2980b9;
        }
        
        .btn-danger {
            background: #e74c3c;
            color: white;
        }
        
        .btn-danger:hover {
            background: #c0392b;
        }
        
        .btn-warning {
            background: #f39c12;
            color: white;
        }
        
        .btn-warning:hover {
            background: #d68910;
        }
        
        .btn-success {
            background: #27ae60;
            color: white;
        }
        
        .btn-success:hover {
            background: #229954;
        }
        
        .full-width {
            grid-column: 1 / -1;
        }
        
        .positions-table {
            font-size: 13px;
        }
        
        .positions-table td {
            padding: 8px;
        }
        
        .refresh-info {
            font-size: 12px;
            color: #7f8c8d;
            margin-top: 10px;
        }
        
        .alert {
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        
        .alert-info {
            background: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
        }
        
        .alert-success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .alert-danger {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        @media (max-width: 768px) {
            .grid {
                grid-template-columns: 1fr;
            }
            
            header {
                flex-direction: column;
                text-align: center;
            }
            
            header .user-info {
                text-align: center;
                margin-top: 10px;
            }
            
            table {
                font-size: 12px;
            }
            
            table th, table td {
                padding: 8px;
            }
            
            .button-group {
                flex-direction: column;
            }
            
            button {
                width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div>
                <h1>🚀 CopyPoz V5 Dashboard</h1>
                <p>Hybrid Master-Client Trading System</p>
            </div>
            <div class="user-info">
                <p><strong><?php echo htmlspecialchars($user['name']); ?></strong></p>
                <p><?php echo ucfirst($user_role); ?></p>
                <p><a href="logout.php" style="color: #3498db; text-decoration: none;">Çıkış</a></p>
            </div>
        </header>
        
        <?php if (isset($_GET['msg'])): ?>
            <div class="alert alert-success">
                <?php echo htmlspecialchars($_GET['msg']); ?>
            </div>
        <?php endif; ?>
        
        <div class="grid">
            <!-- Master Status -->
            <div class="card">
                <h2>📊 Master Status</h2>
                <div class="stat">
                    <span class="stat-label">Status:</span>
                    <span class="stat-value">
                        <?php 
                        $status = $master_state ? 'Active' : 'Inactive';
                        $class = $master_state ? 'status-active' : 'status-inactive';
                        echo "<span class='status-badge $class'>$status</span>";
                        ?>
                    </span>
                </div>
                <div class="stat">
                    <span class="stat-label">Connected Clients:</span>
                    <span class="stat-value"><?php echo count($clients); ?></span>
                </div>
                <div class="stat">
                    <span class="stat-label">Total Positions:</span>
                    <span class="stat-value"><?php echo $master_state ? count(json_decode($master_state['positions'], true) ?? []) : 0; ?></span>
                </div>
                <div class="stat">
                    <span class="stat-label">Last Update:</span>
                    <span class="stat-value"><?php echo $master_state ? date('H:i:s', strtotime($master_state['updated_at'])) : 'N/A'; ?></span>
                </div>
                
                <?php if ($user_role === 'admin'): ?>
                <div class="button-group">
                    <button class="btn-warning" onclick="sendMasterCommand('PAUSE')">⏸ PAUSE</button>
                    <button class="btn-success" onclick="sendMasterCommand('RESUME')">▶ RESUME</button>
                    <button class="btn-danger" onclick="sendMasterCommand('CLOSE_ALL')">🔴 CLOSE ALL</button>
                </div>
                <?php endif; ?>
            </div>
            
            <!-- Statistics -->
            <div class="card">
                <h2>📈 Statistics</h2>
                <div class="stat">
                    <span class="stat-label">Active Clients:</span>
                    <span class="stat-value"><?php echo count(array_filter($clients, fn($c) => $c['status'] === 'active')); ?></span>
                </div>
                <div class="stat">
                    <span class="stat-label">Paused Clients:</span>
                    <span class="stat-value"><?php echo count(array_filter($clients, fn($c) => $c['status'] === 'paused')); ?></span>
                </div>
                <div class="stat">
                    <span class="stat-label">Total Balance:</span>
                    <span class="stat-value">$<?php echo number_format(array_sum(array_column($clients, 'balance')), 2); ?></span>
                </div>
                <div class="stat">
                    <span class="stat-label">Total Equity:</span>
                    <span class="stat-value">$<?php echo number_format(array_sum(array_column($clients, 'equity')), 2); ?></span>
                </div>
            </div>
            
            <!-- Pending Commands -->
            <div class="card">
                <h2>⚙️ Pending Commands</h2>
                <?php if (count($pending_commands) > 0): ?>
                    <table>
                        <thead>
                            <tr>
                                <th>Target</th>
                                <th>Command</th>
                                <th>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($pending_commands as $cmd): ?>
                            <tr>
                                <td><?php echo $cmd['client_id'] == 0 ? 'Master' : 'Client #' . $cmd['client_id']; ?></td>
                                <td><strong><?php echo htmlspecialchars($cmd['command']); ?></strong></td>
                                <td><?php echo date('H:i:s', strtotime($cmd['created_at'])); ?></td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                <?php else: ?>
                    <p style="color: #7f8c8d;">No pending commands</p>
                <?php endif; ?>
            </div>
        </div>
        
        <!-- Master Positions -->
        <div class="card full-width">
            <h2>📍 Master Positions</h2>
            <?php 
            $positions = $master_state ? json_decode($master_state['positions'], true) : [];
            if (count($positions) > 0):
            ?>
                <table class="positions-table">
                    <thead>
                        <tr>
                            <th>Ticket</th>
                            <th>Symbol</th>
                            <th>Type</th>
                            <th>Volume</th>
                            <th>Price</th>
                            <th>SL</th>
                            <th>TP</th>
                            <th>Profit</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($positions as $pos): ?>
                        <tr>
                            <td><?php echo $pos['ticket']; ?></td>
                            <td><strong><?php echo $pos['symbol']; ?></strong></td>
                            <td><?php echo $pos['type'] == 0 ? '🟢 BUY' : '🔴 SELL'; ?></td>
                            <td><?php echo $pos['volume']; ?></td>
                            <td><?php echo number_format($pos['price'], 5); ?></td>
                            <td><?php echo number_format($pos['sl'], 5); ?></td>
                            <td><?php echo number_format($pos['tp'], 5); ?></td>
                            <td style="color: <?php echo $pos['profit'] >= 0 ? 'green' : 'red'; ?>">
                                $<?php echo number_format($pos['profit'], 2); ?>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
                <div class="refresh-info">
                    Last update: <?php echo date('Y-m-d H:i:s', strtotime($master_state['updated_at'])); ?>
                </div>
            <?php else: ?>
                <p style="color: #7f8c8d;">No open positions</p>
            <?php endif; ?>
        </div>
        
        <!-- Clients List -->
        <div class="card full-width">
            <h2>👥 Connected Clients</h2>
            <?php if (count($clients) > 0): ?>
                <table>
                    <thead>
                        <tr>
                            <th>Account</th>
                            <th>Name</th>
                            <th>Status</th>
                            <th>Balance</th>
                            <th>Equity</th>
                            <th>Positions</th>
                            <th>Last Seen</th>
                            <?php if ($user_role === 'admin'): ?>
                            <th>Actions</th>
                            <?php endif; ?>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($clients as $client): ?>
                        <tr>
                            <td><?php echo $client['account_number']; ?></td>
                            <td><?php echo htmlspecialchars($client['name']); ?></td>
                            <td>
                                <span class="status-badge status-<?php echo $client['status']; ?>">
                                    <?php echo ucfirst($client['status']); ?>
                                </span>
                            </td>
                            <td>$<?php echo number_format($client['balance'], 2); ?></td>
                            <td>$<?php echo number_format($client['equity'], 2); ?></td>
                            <td><?php echo $client['positions_count']; ?></td>
                            <td><?php echo date('H:i:s', strtotime($client['last_seen'])); ?></td>
                            <?php if ($user_role === 'admin'): ?>
                            <td>
                                <button class="btn-primary" onclick="sendClientCommand(<?php echo $client['id']; ?>, 'PAUSE')" style="padding: 5px 10px; font-size: 12px;">Pause</button>
                                <button class="btn-danger" onclick="sendClientCommand(<?php echo $client['id']; ?>, 'CLOSE_ALL')" style="padding: 5px 10px; font-size: 12px;">Close</button>
                            </td>
                            <?php endif; ?>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php else: ?>
                <p style="color: #7f8c8d;">No connected clients</p>
            <?php endif; ?>
        </div>
    </div>
    
    <script>
        function sendMasterCommand(command) {
            if (confirm('Send command: ' + command + ' to Master?')) {
                fetch('api/master-command.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer <?php echo getenv('MASTER_TOKEN'); ?>'
                    },
                    body: JSON.stringify({command: command})
                })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        alert('Command sent successfully');
                        location.reload();
                    } else {
                        alert('Error: ' + (data.error || 'Unknown error'));
                    }
                })
                .catch(error => alert('Error: ' + error));
            }
        }
        
        function sendClientCommand(clientId, command) {
            if (confirm('Send command: ' + command + ' to Client #' + clientId + '?')) {
                fetch('api/client-command.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer <?php echo getenv('TRADER_TOKEN'); ?>'
                    },
                    body: JSON.stringify({client_id: clientId, command: command})
                })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        alert('Command sent successfully');
                        location.reload();
                    } else {
                        alert('Error: ' + (data.error || 'Unknown error'));
                    }
                })
                .catch(error => alert('Error: ' + error));
            }
        }
        
        // Auto-refresh every 5 seconds
        setInterval(function() {
            location.reload();
        }, 5000);
    </script>
</body>
</html>
