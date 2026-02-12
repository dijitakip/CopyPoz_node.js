<?php
@session_start();
require_once '../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';

if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches) || $matches[1] !== MASTER_TOKEN) {
    logAction('API_UNAUTHORIZED', 'signal.php - Invalid token', 'WARNING');
    jsonResponse(['error' => 'Unauthorized'], 401);
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || !isset($data['positions']) || !is_array($data['positions'])) {
    logAction('API_ERROR', 'signal.php - Invalid data', 'WARNING');
    jsonResponse(['error' => 'Invalid data'], 400);
}

try {
    $stmt = $pdo->prepare("INSERT INTO master_state (id, total_positions, positions_json) VALUES (1, ?, ?) ON DUPLICATE KEY UPDATE total_positions = VALUES(total_positions), positions_json = VALUES(positions_json), updated_at = NOW()");
    $totalPositions = count($data['positions']);
    $jsonContent = json_encode($data, JSON_UNESCAPED_UNICODE);
    $stmt->execute([$totalPositions, $jsonContent]);
    jsonResponse(['status' => 'success', 'positions' => $totalPositions]);
} catch (Exception $e) {
    logAction('API_ERROR', 'signal.php - ' . $e->getMessage(), 'ERROR');
    jsonResponse(['error' => 'Database error'], 500);
}
?>
