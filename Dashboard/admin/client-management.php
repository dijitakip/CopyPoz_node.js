<?php
/**
 * CopyPoz V5 - Client Terminal Management API
 * Client terminallerini ve kullanıcı atamalarını yönet
 */

require_once '../config/db.php';

// Admin kontrolü
requireAdmin();

$action = $_GET['action'] ?? 'list';
$user_id = authenticateUser()['id'] ?? 0;

// ============ CLIENT TERMINAL LISTESI ============

if ($action === 'list') {
    $filter = $_GET['filter'] ?? 'all'; // all, assigned, unassigned
    
    if ($filter === 'assigned') {
        $query = "SELECT c.*, u.username as owner_name, au.username as assigned_user_name
                  FROM clients c
                  LEFT JOIN users u ON c.owner_id = u.id
                  LEFT JOIN users au ON c.assigned_to_user_id = au.id
                  WHERE c.assigned_to_user_id IS NOT NULL
                  ORDER BY c.created_at DESC";
    } elseif ($filter === 'unassigned') {
        $query = "SELECT c.*, u.username as owner_name
                  FROM clients c
                  LEFT JOIN users u ON c.owner_id = u.id
                  WHERE c.assigned_to_user_id IS NULL
                  ORDER BY c.created_at DESC";
    } else {
        $query = "SELECT c.*, u.username as owner_name, au.username as assigned_user_name
                  FROM clients c
                  LEFT JOIN users u ON c.owner_id = u.id
                  LEFT JOIN users au ON c.assigned_to_user_id = au.id
                  ORDER BY c.created_at DESC";
    }
    
    $result = $conn->query($query);
    $clients = $result->fetch_all(MYSQLI_ASSOC);
    
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'data' => $clients,
        'count' => count($clients)
    ]);
    exit;
}

// ============ CLIENT TERMINAL OLUŞTUR ============

elseif ($action === 'create') {
    $account_number = intval($_POST['account_number'] ?? 0);
    $account_name = sanitizeInput($_POST['account_name'] ?? '');
    $master_id = intval($_POST['master_id'] ?? 0);
    $token_type = $_POST['token_type'] ?? 'CLIENT_TOKEN';
    
    if (!$account_number) {
        jsonResponse(['error' => 'Hesap numarası gerekli'], 400);
    }
    
    // Token oluştur
    $token = bin2hex(random_bytes(32));
    
    $query = "INSERT INTO clients (account_number, account_name, auth_token, token_type, master_id, owner_id, status)
              VALUES (?, ?, ?, ?, ?, ?, 'active')";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('isssii', $account_number, $account_name, $token, $token_type, $master_id, $user_id);
    
    if ($stmt->execute()) {
        $client_id = $conn->insert_id;
        logAction('CLIENT_CREATE', "Account: $account_number, ID: $client_id", 'INFO');
        jsonResponse([
            'success' => true,
            'message' => 'Client terminal oluşturuldu',
            'client_id' => $client_id,
            'token' => $token
        ]);
    } else {
        jsonResponse(['error' => 'Client oluşturulamadı'], 500);
    }
}

// ============ CLIENT TERMINAL'E KULLANICI ATA ============

elseif ($action === 'assign_user') {
    $client_id = intval($_POST['client_id'] ?? 0);
    $assigned_user_id = intval($_POST['user_id'] ?? 0);
    
    // Yetki kontrolü
    $query = "SELECT owner_id FROM clients WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('i', $client_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $client = $result->fetch_assoc();
    
    if (!$client || $client['owner_id'] != $user_id) {
        jsonResponse(['error' => 'Yetkiniz yok'], 403);
    }
    
    // Atamayı kaydet
    $query = "INSERT INTO user_client_assignments (user_id, client_id, assigned_by, status)
              VALUES (?, ?, ?, 'active')
              ON DUPLICATE KEY UPDATE status = 'active'";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('iii', $assigned_user_id, $client_id, $user_id);
    
    if ($stmt->execute()) {
        // Client'ı güncelle
        $query = "UPDATE clients SET assigned_to_user_id = ? WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('ii', $assigned_user_id, $client_id);
        $stmt->execute();
        
        logAction('CLIENT_ASSIGN_USER', "Client: $client_id, User: $assigned_user_id", 'INFO');
        jsonResponse(['success' => true, 'message' => 'Kullanıcı atandı']);
    } else {
        jsonResponse(['error' => 'Kullanıcı atanamadı'], 500);
    }
}

// ============ CLIENT TERMINAL'DEN KULLANICI ÇIKAR ============

elseif ($action === 'unassign_user') {
    $client_id = intval($_POST['client_id'] ?? 0);
    
    // Yetki kontrolü
    $query = "SELECT owner_id FROM clients WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('i', $client_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $client = $result->fetch_assoc();
    
    if (!$client || $client['owner_id'] != $user_id) {
        jsonResponse(['error' => 'Yetkiniz yok'], 403);
    }
    
    $query = "UPDATE clients SET assigned_to_user_id = NULL WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('i', $client_id);
    
    if ($stmt->execute()) {
        logAction('CLIENT_UNASSIGN_USER', "Client: $client_id", 'INFO');
        jsonResponse(['success' => true, 'message' => 'Kullanıcı çıkarıldı']);
    } else {
        jsonResponse(['error' => 'Kullanıcı çıkarılamadı'], 500);
    }
}

// ============ KULLANICI İÇİN CLIENT TERMINAL LISTESI ============

elseif ($action === 'user_clients') {
    $target_user_id = intval($_GET['user_id'] ?? 0);
    
    $query = "SELECT c.* FROM clients c
              JOIN user_client_assignments uca ON c.id = uca.client_id
              WHERE uca.user_id = ? AND uca.status = 'active'
              ORDER BY c.created_at DESC";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('i', $target_user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $clients = $result->fetch_all(MYSQLI_ASSOC);
    
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'data' => $clients,
        'count' => count($clients)
    ]);
    exit;
}

// ============ CLIENT TERMINAL DETAYLARI ============

elseif ($action === 'get') {
    $client_id = intval($_GET['id'] ?? 0);
    
    $query = "SELECT c.*, u.username as owner_name, au.username as assigned_user_name
              FROM clients c
              LEFT JOIN users u ON c.owner_id = u.id
              LEFT JOIN users au ON c.assigned_to_user_id = au.id
              WHERE c.id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('i', $client_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $client = $result->fetch_assoc();
    
    if ($client) {
        jsonResponse(['success' => true, 'data' => $client]);
    } else {
        jsonResponse(['error' => 'Client bulunamadı'], 404);
    }
}

// ============ CLIENT TERMINAL'E TOKEN ATA (KULLANICI BAZLI) ============

elseif ($action === 'assign_token') {
    $client_id = intval($_POST['client_id'] ?? 0);
    $assigned_user_id = intval($_POST['user_id'] ?? 0);
    $token_type = $_POST['token_type'] ?? 'CLIENT_TOKEN';
    $expires_at = $_POST['expires_at'] ?? null;
    
    // Yetki kontrolü
    $query = "SELECT owner_id FROM clients WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('i', $client_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $client = $result->fetch_assoc();
    
    if (!$client || $client['owner_id'] != $user_id) {
        jsonResponse(['error' => 'Yetkiniz yok'], 403);
    }
    
    // Token oluştur
    $token = bin2hex(random_bytes(32));
    
    $query = "INSERT INTO user_tokens (user_id, client_id, token_value, token_type, created_by, expires_at, status)
              VALUES (?, ?, ?, ?, ?, ?, 'active')";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('iissss', $assigned_user_id, $client_id, $token, $token_type, $user_id, $expires_at);
    
    if ($stmt->execute()) {
        logAction('USER_TOKEN_CREATE', "User: $assigned_user_id, Client: $client_id, Token: $token", 'INFO');
        jsonResponse([
            'success' => true,
            'message' => 'Kullanıcı token atandı',
            'token' => $token,
            'token_id' => $conn->insert_id
        ]);
    } else {
        jsonResponse(['error' => 'Token atanamadı'], 500);
    }
}

// ============ KULLANICI TOKENLARINI LISTELE ============

elseif ($action === 'user_tokens') {
    $target_user_id = intval($_GET['user_id'] ?? 0);
    
    $query = "SELECT ut.*, c.account_number, c.account_name
              FROM user_tokens ut
              JOIN clients c ON ut.client_id = c.id
              WHERE ut.user_id = ? AND ut.status = 'active'
              ORDER BY ut.created_at DESC";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('i', $target_user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $tokens = $result->fetch_all(MYSQLI_ASSOC);
    
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'data' => $tokens,
        'count' => count($tokens)
    ]);
    exit;
}

// ============ KULLANICI TOKEN'I İPTAL ET ============

elseif ($action === 'revoke_token') {
    $token_id = intval($_POST['token_id'] ?? 0);
    
    // Yetki kontrolü
    $query = "SELECT ut.user_id, c.owner_id FROM user_tokens ut
              JOIN clients c ON ut.client_id = c.id
              WHERE ut.id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('i', $token_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $token = $result->fetch_assoc();
    
    if (!$token || $token['owner_id'] != $user_id) {
        jsonResponse(['error' => 'Yetkiniz yok'], 403);
    }
    
    $query = "UPDATE user_tokens SET status = 'inactive' WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('i', $token_id);
    
    if ($stmt->execute()) {
        logAction('USER_TOKEN_REVOKE', "Token ID: $token_id", 'INFO');
        jsonResponse(['success' => true, 'message' => 'Token iptal edildi']);
    } else {
        jsonResponse(['error' => 'Token iptal edilemedi'], 500);
    }
}

// Varsayılan yanıt
jsonResponse(['error' => 'Geçersiz istek'], 400);
?>
