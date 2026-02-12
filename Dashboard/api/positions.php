<?php
@session_start();
require_once '../config/db.php';

// GET /api/positions.php - Master pozisyonlarını al

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$token = getBearerToken();

if (!$token || $token !== getenv('MASTER_TOKEN')) {
    jsonResponse(['error' => 'Unauthorized'], 401);
}

try {
    // Master state'den pozisyonları al
    $stmt = $pdo->prepare("
        SELECT positions FROM master_state 
        WHERE id = 1 
        LIMIT 1
    ");
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($result && $result['positions']) {
        $positions = json_decode($result['positions'], true);
        logAction('POSITIONS_RETRIEVED', "Count: " . count($positions), 'INFO');
        jsonResponse(['positions' => $positions]);
    } else {
        jsonResponse(['positions' => []]);
    }
} catch (Exception $e) {
    logAction('POSITIONS_ERROR', $e->getMessage(), 'ERROR');
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
