<?php
/**
 * CopyPoz V5 - Master Group Management API
 * Master gruplarını ve üyelerini yönet
 */

require_once '../config/db.php';

// Admin kontrolü
requireAdmin();

$action = $_GET['action'] ?? 'list';
$user_id = authenticateUser()['id'] ?? 0;

// ============ MASTER GROUP LISTESI ============

if ($action === 'list') {
    $role = $_GET['role'] ?? 'all'; // all, owner, member
    
    if ($role === 'owner') {
        // Kullanıcının sahip olduğu gruplar
        $query = "SELECT * FROM master_groups WHERE owner_id = ? ORDER BY created_at DESC";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('i', $user_id);
    } elseif ($role === 'member') {
        // Kullanıcının üye olduğu gruplar
        $query = "SELECT DISTINCT mg.* FROM master_groups mg
                  JOIN master_group_members mgm ON mg.id = mgm.group_id
                  WHERE mgm.user_id = ? ORDER BY mg.created_at DESC";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('i', $user_id);
    } else {
        // Tüm gruplar (admin için)
        $query = "SELECT * FROM master_groups ORDER BY created_at DESC";
        $stmt = $conn->prepare($query);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    $groups = $result->fetch_all(MYSQLI_ASSOC);
    
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'data' => $groups,
        'count' => count($groups)
    ]);
    exit;
}

// ============ MASTER GROUP OLUŞTUR ============

elseif ($action === 'create') {
    $group_name = sanitizeInput($_POST['group_name'] ?? '');
    $description = sanitizeInput($_POST['description'] ?? '');
    $max_clients = intval($_POST['max_clients'] ?? 50);
    
    if (!$group_name) {
        jsonResponse(['error' => 'Grup adı gerekli'], 400);
    }
    
    $query = "INSERT INTO master_groups (group_name, owner_id, description, max_clients, status)
              VALUES (?, ?, ?, ?, 'active')";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('sisi', $group_name, $user_id, $description, $max_clients);
    
    if ($stmt->execute()) {
        $group_id = $conn->insert_id;
        
        // Sahibi grup üyesi olarak ekle
        $query = "INSERT INTO master_group_members (group_id, user_id, role, added_by)
                  VALUES (?, ?, 'owner', ?)";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('iii', $group_id, $user_id, $user_id);
        $stmt->execute();
        
        logAction('MASTER_GROUP_CREATE', "Group: $group_name, ID: $group_id", 'INFO');
        jsonResponse([
            'success' => true,
            'message' => 'Master grubu oluşturuldu',
            'group_id' => $group_id
        ]);
    } else {
        jsonResponse(['error' => 'Grup oluşturulamadı'], 500);
    }
}

// ============ MASTER GROUP GÜNCELLE ============

elseif ($action === 'update') {
    $group_id = intval($_POST['id'] ?? 0);
    $group_name = sanitizeInput($_POST['group_name'] ?? '');
    $description = sanitizeInput($_POST['description'] ?? '');
    $max_clients = intval($_POST['max_clients'] ?? 50);
    
    // Yetki kontrolü
    $query = "SELECT owner_id FROM master_groups WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('i', $group_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $group = $result->fetch_assoc();
    
    if (!$group || $group['owner_id'] != $user_id) {
        jsonResponse(['error' => 'Yetkiniz yok'], 403);
    }
    
    $query = "UPDATE master_groups SET group_name = ?, description = ?, max_clients = ? WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('ssii', $group_name, $description, $max_clients, $group_id);
    
    if ($stmt->execute()) {
        logAction('MASTER_GROUP_UPDATE', "Group ID: $group_id", 'INFO');
        jsonResponse(['success' => true, 'message' => 'Grup güncellendi']);
    } else {
        jsonResponse(['error' => 'Grup güncellenemedi'], 500);
    }
}

// ============ MASTER GROUP SİL ============

elseif ($action === 'delete') {
    $group_id = intval($_POST['id'] ?? 0);
    
    // Yetki kontrolü
    $query = "SELECT owner_id FROM master_groups WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('i', $group_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $group = $result->fetch_assoc();
    
    if (!$group || $group['owner_id'] != $user_id) {
        jsonResponse(['error' => 'Yetkiniz yok'], 403);
    }
    
    $query = "DELETE FROM master_groups WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('i', $group_id);
    
    if ($stmt->execute()) {
        logAction('MASTER_GROUP_DELETE', "Group ID: $group_id", 'INFO');
        jsonResponse(['success' => true, 'message' => 'Grup silindi']);
    } else {
        jsonResponse(['error' => 'Grup silinemedi'], 500);
    }
}

// ============ GRUP ÜYESİ EKLE ============

elseif ($action === 'add_member') {
    $group_id = intval($_POST['group_id'] ?? 0);
    $member_user_id = intval($_POST['user_id'] ?? 0);
    $role = $_POST['role'] ?? 'viewer';
    
    // Yetki kontrolü
    $query = "SELECT owner_id FROM master_groups WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('i', $group_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $group = $result->fetch_assoc();
    
    if (!$group || $group['owner_id'] != $user_id) {
        jsonResponse(['error' => 'Yetkiniz yok'], 403);
    }
    
    $query = "INSERT INTO master_group_members (group_id, user_id, role, added_by)
              VALUES (?, ?, ?, ?)";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('iisi', $group_id, $member_user_id, $role, $user_id);
    
    if ($stmt->execute()) {
        logAction('MASTER_GROUP_ADD_MEMBER', "Group: $group_id, User: $member_user_id, Role: $role", 'INFO');
        jsonResponse(['success' => true, 'message' => 'Üye eklendi']);
    } else {
        jsonResponse(['error' => 'Üye eklenemedi'], 500);
    }
}

// ============ GRUP ÜYESİ ÇIKAR ============

elseif ($action === 'remove_member') {
    $group_id = intval($_POST['group_id'] ?? 0);
    $member_user_id = intval($_POST['user_id'] ?? 0);
    
    // Yetki kontrolü
    $query = "SELECT owner_id FROM master_groups WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('i', $group_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $group = $result->fetch_assoc();
    
    if (!$group || $group['owner_id'] != $user_id) {
        jsonResponse(['error' => 'Yetkiniz yok'], 403);
    }
    
    $query = "DELETE FROM master_group_members WHERE group_id = ? AND user_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('ii', $group_id, $member_user_id);
    
    if ($stmt->execute()) {
        logAction('MASTER_GROUP_REMOVE_MEMBER', "Group: $group_id, User: $member_user_id", 'INFO');
        jsonResponse(['success' => true, 'message' => 'Üye çıkarıldı']);
    } else {
        jsonResponse(['error' => 'Üye çıkarılamadı'], 500);
    }
}

// ============ GRUP ÜYELERİ LİSTESİ ============

elseif ($action === 'list_members') {
    $group_id = intval($_GET['group_id'] ?? 0);
    
    $query = "SELECT u.id, u.username, u.email, mgm.role, mgm.added_at
              FROM master_group_members mgm
              JOIN users u ON mgm.user_id = u.id
              WHERE mgm.group_id = ?
              ORDER BY mgm.added_at DESC";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('i', $group_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $members = $result->fetch_all(MYSQLI_ASSOC);
    
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'data' => $members,
        'count' => count($members)
    ]);
    exit;
}

// Varsayılan yanıt
jsonResponse(['error' => 'Geçersiz istek'], 400);
?>
