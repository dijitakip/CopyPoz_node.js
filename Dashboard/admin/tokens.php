<?php
/**
 * CopyPoz V5 - Token Management
 * Master ve Client tokenlarını yönet
 */

require_once '../config/db.php';

// Admin kontrolü
requireAdmin();

$action = $_GET['action'] ?? 'list';
$type = $_GET['type'] ?? 'master'; // master veya client

// ============ MASTER TOKEN YÖNETİMİ ============

if ($type === 'master') {
    if ($action === 'list') {
        // Tüm master tokenlarını listele
        $query = "SELECT * FROM masters ORDER BY created_at DESC";
        $result = $conn->query($query);
        $masters = $result->fetch_all(MYSQLI_ASSOC);
        
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'data' => $masters,
            'count' => count($masters)
        ]);
        exit;
    }
    
    elseif ($action === 'create') {
        // Yeni master token oluştur
        $master_name = sanitizeInput($_POST['master_name'] ?? '');
        $account_number = intval($_POST['account_number'] ?? 0);
        $account_name = sanitizeInput($_POST['account_name'] ?? '');
        $token_type = $_POST['token_type'] ?? 'MASTER_TOKEN';
        
        if (!$master_name || !$account_number) {
            jsonResponse(['error' => 'Master adı ve hesap numarası gerekli'], 400);
        }
        
        // Token oluştur
        $token = bin2hex(random_bytes(32));
        
        $query = "INSERT INTO masters (master_name, account_number, account_name, token, token_type, status) 
                  VALUES (?, ?, ?, ?, ?, 'active')";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('sisss', $master_name, $account_number, $account_name, $token, $token_type);
        
        if ($stmt->execute()) {
            logAction('TOKEN_CREATE', "Master: $master_name, Token: $token", 'INFO');
            jsonResponse([
                'success' => true,
                'message' => 'Master token oluşturuldu',
                'token' => $token,
                'master_id' => $conn->insert_id
            ]);
        } else {
            jsonResponse(['error' => 'Token oluşturulamadı: ' . $conn->error], 500);
        }
    }
    
    elseif ($action === 'get') {
        // Belirli master tokenını getir
        $master_id = intval($_GET['id'] ?? 0);
        
        $query = "SELECT * FROM masters WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('i', $master_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $master = $result->fetch_assoc();
        
        if ($master) {
            jsonResponse(['success' => true, 'data' => $master]);
        } else {
            jsonResponse(['error' => 'Master bulunamadı'], 404);
        }
    }
    
    elseif ($action === 'regenerate') {
        // Token yenile
        $master_id = intval($_POST['id'] ?? 0);
        $new_token = bin2hex(random_bytes(32));
        
        $query = "UPDATE masters SET token = ? WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('si', $new_token, $master_id);
        
        if ($stmt->execute()) {
            logAction('TOKEN_REGENERATE', "Master ID: $master_id, New Token: $new_token", 'INFO');
            jsonResponse([
                'success' => true,
                'message' => 'Token yenilendi',
                'token' => $new_token
            ]);
        } else {
            jsonResponse(['error' => 'Token yenilenemedi'], 500);
        }
    }
    
    elseif ($action === 'delete') {
        // Master tokenını sil
        $master_id = intval($_POST['id'] ?? 0);
        
        $query = "DELETE FROM masters WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('i', $master_id);
        
        if ($stmt->execute()) {
            logAction('TOKEN_DELETE', "Master ID: $master_id", 'INFO');
            jsonResponse(['success' => true, 'message' => 'Master token silindi']);
        } else {
            jsonResponse(['error' => 'Token silinemedi'], 500);
        }
    }
}

// ============ CLIENT TOKEN YÖNETİMİ ============

elseif ($type === 'client') {
    if ($action === 'list') {
        // Tüm client tokenlarını listele
        $query = "SELECT c.*, m.master_name FROM clients c 
                  LEFT JOIN masters m ON c.master_id = m.id 
                  ORDER BY c.created_at DESC";
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
    
    elseif ($action === 'create') {
        // Yeni client token oluştur
        $account_number = intval($_POST['account_number'] ?? 0);
        $account_name = sanitizeInput($_POST['account_name'] ?? '');
        $master_id = intval($_POST['master_id'] ?? 0);
        $token_type = $_POST['token_type'] ?? 'CLIENT_TOKEN';
        
        if (!$account_number) {
            jsonResponse(['error' => 'Hesap numarası gerekli'], 400);
        }
        
        // Token oluştur
        $token = bin2hex(random_bytes(32));
        
        $query = "INSERT INTO clients (account_number, account_name, auth_token, token_type, master_id, status) 
                  VALUES (?, ?, ?, ?, ?, 'active')";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('isssi', $account_number, $account_name, $token, $token_type, $master_id);
        
        if ($stmt->execute()) {
            logAction('CLIENT_TOKEN_CREATE', "Account: $account_number, Token: $token", 'INFO');
            jsonResponse([
                'success' => true,
                'message' => 'Client token oluşturuldu',
                'token' => $token,
                'client_id' => $conn->insert_id
            ]);
        } else {
            jsonResponse(['error' => 'Client token oluşturulamadı'], 500);
        }
    }
    
    elseif ($action === 'regenerate') {
        // Client token yenile
        $client_id = intval($_POST['id'] ?? 0);
        $new_token = bin2hex(random_bytes(32));
        
        $query = "UPDATE clients SET auth_token = ? WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('si', $new_token, $client_id);
        
        if ($stmt->execute()) {
            logAction('CLIENT_TOKEN_REGENERATE', "Client ID: $client_id", 'INFO');
            jsonResponse([
                'success' => true,
                'message' => 'Client token yenilendi',
                'token' => $new_token
            ]);
        } else {
            jsonResponse(['error' => 'Token yenilenemedi'], 500);
        }
    }
}

// Varsayılan yanıt
jsonResponse(['error' => 'Geçersiz istek'], 400);
?>
