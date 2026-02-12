<?php
@session_start();
require_once '../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!isset($data['account_number'])) {
    jsonResponse(['error' => 'Account number required'], 400);
}

$accountNumber = (int)$data['account_number'];
$accountName = sanitizeInput($data['account_name'] ?? 'Unknown');
$balance = (float)($data['balance'] ?? 0);
$equity = (float)($data['equity'] ?? 0);
$positions = (int)($data['positions'] ?? 0);
$clientToken = $data['auth_token'] ?? '';
$registrationToken = $data['registration_token'] ?? '';

if ($accountNumber <= 0) {
    jsonResponse(['error' => 'Invalid account number'], 400);
}

try {
    $stmt = $pdo->prepare("SELECT * FROM clients WHERE account_number = ?");
    $stmt->execute([$accountNumber]);
    $client = $stmt->fetch();
    
    $token = '';
    
    if (!$client) {
        // Yeni client - registration token doğrula
        if ($registrationToken !== MASTER_TOKEN) {
            logAction('CLIENT_UNAUTHORIZED', "Account: $accountNumber - Invalid registration token", 'WARNING');
            jsonResponse(['error' => 'Unauthorized - Invalid registration token'], 401);
        }
        
        // Token oluştur
        $token = bin2hex(random_bytes(TOKEN_LENGTH));
        $insert = $pdo->prepare("INSERT INTO clients (account_number, account_name, auth_token, last_seen, balance, equity, open_positions) VALUES (?, ?, ?, NOW(), ?, ?, ?)");
        $insert->execute([$accountNumber, $accountName, $token, $balance, $equity, $positions]);
        $clientId = $pdo->lastInsertId();
        logAction('CLIENT_REGISTERED', "Account: $accountNumber", 'INFO');
    } else {
        // Mevcut client - token doğrula
        if ($client['auth_token'] !== $clientToken) {
            logAction('CLIENT_UNAUTHORIZED', "Account: $accountNumber - Invalid token", 'WARNING');
            jsonResponse(['error' => 'Unauthorized - Invalid token'], 401);
        }
        
        $token = $client['auth_token'];
        $clientId = $client['id'];
        $update = $pdo->prepare("UPDATE clients SET last_seen = NOW(), balance = ?, equity = ?, open_positions = ?, account_name = ? WHERE id = ?");
        $update->execute([$balance, $equity, $positions, $accountName, $clientId]);
    }
    
    $cmdStmt = $pdo->prepare("SELECT * FROM command_queue WHERE client_id = ? AND status = 'pending' ORDER BY created_at ASC LIMIT 1");
    $cmdStmt->execute([$clientId]);
    $command = $cmdStmt->fetch();
    
    $response = ['status' => 'success', 'auth_token' => $token, 'server_time' => time()];
    
    if ($command) {
        $response['command'] = $command['command'];
        $response['command_id'] = $command['id'];
        $updateCmd = $pdo->prepare("UPDATE command_queue SET status = 'executed', executed_at = NOW() WHERE id = ?");
        $updateCmd->execute([$command['id']]);
    }
    
    jsonResponse($response);
} catch (Exception $e) {
    logAction('CLIENT_ERROR', $e->getMessage(), 'ERROR');
    jsonResponse(['error' => 'Database error'], 500);
}
?>
