<?php
@session_start();
require_once '../config/db.php';

// Client EA'dan komut alma (GET) veya Trader'den komut gönderme (POST)

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Client EA komut almak için çağırıyor
    $token = getBearerToken();
    
    if (!$token) {
        jsonResponse(['error' => 'Missing authorization token'], 401);
    }
    
    // Token'dan client_id'yi al
    $client_id = getClientIdFromToken($token);
    if (!$client_id) {
        jsonResponse(['error' => 'Invalid token'], 401);
    }
    
    try {
        // Bekleyen komut al (bu client için)
        $stmt = $pdo->prepare("
            SELECT id, command FROM command_queue 
            WHERE client_id = ? AND status = 'pending' 
            ORDER BY created_at ASC 
            LIMIT 1
        ");
        $stmt->execute([$client_id]);
        $command = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($command) {
            // Komutu executed olarak işaretle
            $updateStmt = $pdo->prepare("UPDATE command_queue SET status = 'executed', executed_at = NOW() WHERE id = ?");
            $updateStmt->execute([$command['id']]);
            
            logAction('CLIENT_COMMAND_RETRIEVED', "Client: $client_id, Command: {$command['command']}", 'INFO');
            jsonResponse(['command' => $command['command']]);
        } else {
            jsonResponse(['command' => null]);
        }
    } catch (Exception $e) {
        logAction('CLIENT_COMMAND_ERROR', $e->getMessage(), 'ERROR');
        jsonResponse(['error' => 'Database error'], 500);
    }
}
else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Trader client'a komut gönderiyor
    $user = requireTrader();
    
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!isset($data['client_id']) || !isset($data['command'])) {
        jsonResponse(['error' => 'Missing parameters'], 400);
    }
    
    $client_id = (int)$data['client_id'];
    $command = sanitizeInput($data['command']);
    
    $validCommands = ['PAUSE', 'RESUME', 'CLOSE_ALL_BUY', 'CLOSE_ALL_SELL', 'CLOSE_ALL'];
    if (!in_array($command, $validCommands)) {
        logAction('CLIENT_COMMAND_INVALID', "Invalid command: $command", 'WARNING');
        jsonResponse(['error' => 'Invalid command'], 400);
    }
    
    if (!canAccessClient($user['id'], $client_id)) {
        logAction('CLIENT_COMMAND_UNAUTHORIZED', "User: {$user['id']}, Client: $client_id", 'WARNING');
        jsonResponse(['error' => 'Unauthorized'], 403);
    }
    
    try {
        $stmt = $pdo->prepare("INSERT INTO command_queue (client_id, command, status) VALUES (?, ?, 'pending')");
        $stmt->execute([$client_id, $command]);
        logAction('CLIENT_COMMAND_SENT', "User: {$user['id']}, Client: $client_id, Command: $command", 'INFO');
        jsonResponse(['status' => 'success', 'message' => 'Command queued']);
    } catch (Exception $e) {
        logAction('CLIENT_COMMAND_ERROR', $e->getMessage(), 'ERROR');
        jsonResponse(['error' => 'Database error'], 500);
    }
}
else {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

function getBearerToken() {
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        $matches = [];
        if (preg_match('/Bearer\s+(\S+)/', $headers['Authorization'], $matches)) {
            return $matches[1];
        }
    }
    return null;
}

function getClientIdFromToken($token) {
    global $pdo;
    try {
        $stmt = $pdo->prepare("SELECT id FROM clients WHERE auth_token = ? LIMIT 1");
        $stmt->execute([$token]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ? $result['id'] : null;
    } catch (Exception $e) {
        return null;
    }
}

?>
