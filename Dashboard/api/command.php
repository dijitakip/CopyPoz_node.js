<?php
@session_start();
require_once '../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$user = requireTrader();

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!isset($data['client_id']) || !isset($data['command'])) {
    jsonResponse(['error' => 'Missing parameters'], 400);
}

$clientId = (int)$data['client_id'];
$command = sanitizeInput($data['command']);

$validCommands = ['PAUSE', 'RESUME', 'CLOSE_ALL_BUY', 'CLOSE_ALL_SELL', 'CLOSE_ALL'];
if (!in_array($command, $validCommands)) {
    logAction('COMMAND_INVALID', "Invalid command: $command", 'WARNING');
    jsonResponse(['error' => 'Invalid command'], 400);
}

if (!canAccessClient($user['id'], $clientId)) {
    logAction('COMMAND_UNAUTHORIZED', "User: {$user['id']}, Client: $clientId", 'WARNING');
    jsonResponse(['error' => 'Unauthorized'], 403);
}

try {
    $stmt = $pdo->prepare("INSERT INTO command_queue (client_id, command, status) VALUES (?, ?, 'pending')");
    $stmt->execute([$clientId, $command]);
    logAction('COMMAND_SENT', "User: {$user['id']}, Client: $clientId, Command: $command", 'INFO');
    jsonResponse(['status' => 'success', 'message' => 'Command queued']);
} catch (Exception $e) {
    logAction('COMMAND_ERROR', $e->getMessage(), 'ERROR');
    jsonResponse(['error' => 'Database error'], 500);
}
?>
