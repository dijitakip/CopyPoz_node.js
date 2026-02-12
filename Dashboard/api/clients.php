<?php
@session_start();
require_once '../config/db.php';

// GET /api/clients.php - Tüm client'ları al

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$token = getBearerToken();

if (!$token || $token !== getenv('MASTER_TOKEN')) {
    jsonResponse(['error' => 'Unauthorized'], 401);
}

try {
    // Tüm client'ları al
    $stmt = $pdo->prepare("
        SELECT 
            id,
            account_number,
            name,
            status,
            balance,
            equity,
            positions_count,
            last_seen
        FROM clients 
        ORDER BY last_seen DESC
    ");
    $stmt->execute();
    $clients = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    logAction('CLIENTS_RETRIEVED', "Count: " . count($clients), 'INFO');
    jsonResponse(['clients' => $clients]);
} catch (Exception $e) {
    logAction('CLIENTS_ERROR', $e->getMessage(), 'ERROR');
    jsonResponse(['error' => 'Database error'], 500);
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
