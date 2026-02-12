<?php
@session_start();
require_once '../config/db.php';

// POST isteği kontrolü
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

// Authorization header kontrolü
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';

if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches) || $matches[1] !== MASTER_TOKEN) {
    logAction('LICENSE_UNAUTHORIZED', 'Invalid token', 'WARNING');
    jsonResponse(['error' => 'Unauthorized'], 401);
}

// JSON input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!isset($data['license_key'])) {
    jsonResponse(['error' => 'License key required'], 400);
}

$licenseKey = sanitizeInput($data['license_key']);
$terminalId = sanitizeInput($data['terminal_id'] ?? '');

try {
    // Lisans bilgisini veritabanından al
    $stmt = $pdo->prepare("SELECT * FROM licenses WHERE license_key = ?");
    $stmt->execute([$licenseKey]);
    $license = $stmt->fetch();
    
    // Demo lisans
    if ($licenseKey === 'DEMO') {
        $response = [
            'status' => 'valid',
            'type' => 'TRIAL',
            'days_left' => 30,
            'max_clients' => 5,
            'message' => 'Demo license valid for 30 days'
        ];
        logAction('LICENSE_CHECK', "Demo license checked", 'INFO');
        jsonResponse($response, 200);
    }
    
    // Lisans bulunamadı
    if (!$license) {
        logAction('LICENSE_INVALID', "License key: $licenseKey", 'WARNING');
        jsonResponse(['error' => 'Invalid license key'], 401);
    }
    
    // Lisans süresi dolmuş mı kontrol et
    $expiryDate = strtotime($license['expiry_date']);
    $currentTime = time();
    
    if ($currentTime > $expiryDate) {
        logAction('LICENSE_EXPIRED', "License key: $licenseKey", 'WARNING');
        jsonResponse(['error' => 'License expired'], 403);
    }
    
    // Lisans geçerli
    $daysLeft = (int)(($expiryDate - $currentTime) / 86400);
    
    // Lisans türüne göre max client sayısı
    $maxClients = 5;
    if ($license['type'] === 'PRO') {
        $maxClients = 50;
    } elseif ($license['type'] === 'ENTERPRISE') {
        $maxClients = 1000;
    }
    
    // Terminal ID'yi kaydet (lisans takibi için)
    if ($terminalId) {
        $updateStmt = $pdo->prepare("UPDATE licenses SET last_terminal_id = ?, last_check_date = NOW() WHERE id = ?");
        $updateStmt->execute([$terminalId, $license['id']]);
    }
    
    $response = [
        'status' => 'valid',
        'type' => $license['type'],
        'days_left' => $daysLeft,
        'max_clients' => $maxClients,
        'expiry_date' => $license['expiry_date'],
        'message' => 'License valid'
    ];
    
    logAction('LICENSE_VALID', "License key: $licenseKey, Type: {$license['type']}, Days left: $daysLeft", 'INFO');
    jsonResponse($response, 200);
    
} catch (Exception $e) {
    logAction('LICENSE_ERROR', $e->getMessage(), 'ERROR');
    jsonResponse(['error' => 'Database error'], 500);
}
?>
