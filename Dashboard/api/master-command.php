<?php
@session_start();
require_once '../config/db.php';

// Master EA'dan komut alma (GET) veya Admin'den komut gönderme (POST)

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Master EA komut almak için çağırıyor
    $token = getBearerToken();
    
    if (!$token || $token !== getenv('MASTER_TOKEN')) {
        jsonResponse(['error' => 'Unauthorized'], 401);
    }
    
    try {
        // Bekleyen komut al (client_id = 0 = Master)
        $stmt = $pdo->prepare("
            SELECT id, command FROM command_queue 
            WHERE client_id = 0 AND status = 'pending' 
            ORDER BY created_at ASC 
            LIMIT 1
        ");
        $stmt->execute();
        $command = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($command) {
            // Komutu executed olarak işaretle
            $updateStmt = $pdo->prepare("UPDATE command_queue SET status = 'executed', executed_at = NOW() WHERE id = ?");
            $updateStmt->execute([$command['id']]);
            
            logAction('MASTER_COMMAND_RETRIEVED', "Command: {$command['command']}", 'INFO');
            jsonResponse(['command' => $command['command']]);
        } else {
            jsonResponse(['command' => null]);
        }
    } catch (Exception $e) {
        logAction('MASTER_COMMAND_ERROR', $e->getMessage(), 'ERROR');
        jsonResponse(['error' => 'Database error'], 500);
    }
}
else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Admin Master'a komut gönderiyor
    $user = requireAdmin();
    
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!isset($data['command'])) {
        jsonResponse(['error' => 'Missing command parameter'], 400);
    }
    
    $command = sanitizeInput($data['command']);
    
    $validCommands = ['PAUSE', 'RESUME', 'CLOSE_ALL_BUY', 'CLOSE_ALL_SELL', 'CLOSE_ALL'];
    if (!in_array($command, $validCommands)) {
        logAction('MASTER_COMMAND_INVALID', "Invalid command: $command", 'WARNING');
        jsonResponse(['error' => 'Invalid command'], 400);
    }
    
    try {
        $stmt = $pdo->prepare("INSERT INTO command_queue (client_id, command, status) VALUES (0, ?, 'pending')");
        $stmt->execute([$command]);
        logAction('MASTER_COMMAND_SENT', "Admin: {$user['id']}, Command: $command", 'INFO');
        jsonResponse(['status' => 'success', 'message' => 'Command queued for Master']);
    } catch (Exception $e) {
        logAction('MASTER_COMMAND_ERROR', $e->getMessage(), 'ERROR');
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

?>
