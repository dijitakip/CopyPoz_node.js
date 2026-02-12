<?php
/**
 * CopyPoz V5 - User Registration API
 * Kullanıcı kaydı, email doğrulama, şifre güvenliği
 */

require_once '../config/db.php';

$action = $_GET['action'] ?? 'register';

// ============ ŞİFRE GÜVENLİĞİ KONTROL ============

function checkPasswordStrength($password) {
    $strength = 0;
    $feedback = [];
    
    // Uzunluk kontrolü
    if (strlen($password) >= 8) {
        $strength += 20;
    } else {
        $feedback[] = "Şifre en az 8 karakter olmalı";
    }
    
    if (strlen($password) >= 12) {
        $strength += 10;
    }
    
    // Büyük harf
    if (preg_match('/[A-Z]/', $password)) {
        $strength += 20;
    } else {
        $feedback[] = "Şifre en az bir büyük harf içermeli";
    }
    
    // Küçük harf
    if (preg_match('/[a-z]/', $password)) {
        $strength += 20;
    } else {
        $feedback[] = "Şifre en az bir küçük harf içermeli";
    }
    
    // Rakam
    if (preg_match('/[0-9]/', $password)) {
        $strength += 15;
    } else {
        $feedback[] = "Şifre en az bir rakam içermeli";
    }
    
    // Özel karakter
    if (preg_match('/[!@#$%^&*()_+\-=\[\]{};:\'",.<>?\/\\|`~]/', $password)) {
        $strength += 15;
    } else {
        $feedback[] = "Şifre en az bir özel karakter içermeli (!@#$%^&* vb.)";
    }
    
    return [
        'strength' => min($strength, 100),
        'level' => $strength >= 80 ? 'strong' : ($strength >= 60 ? 'medium' : 'weak'),
        'feedback' => $feedback
    ];
}

// ============ KAYIT ============

if ($action === 'register') {
    $username = sanitizeInput($_POST['username'] ?? '');
    $email = sanitizeInput($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $password_confirm = $_POST['password_confirm'] ?? '';
    $first_name = sanitizeInput($_POST['first_name'] ?? '');
    $last_name = sanitizeInput($_POST['last_name'] ?? '');
    $phone = sanitizeInput($_POST['phone'] ?? '');
    $country = sanitizeInput($_POST['country'] ?? '');
    $security_question_id = intval($_POST['security_question_id'] ?? 0);
    $security_answer = sanitizeInput($_POST['security_answer'] ?? '');
    
    $ip_address = $_SERVER['REMOTE_ADDR'] ?? '';
    $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
    
    // Validasyon
    if (!$username || !$email || !$password || !$first_name || !$last_name) {
        jsonResponse(['error' => 'Tüm alanlar gerekli'], 400);
    }
    
    // Email formatı
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonResponse(['error' => 'Geçersiz email adresi'], 400);
    }
    
    // Şifre eşleşme
    if ($password !== $password_confirm) {
        jsonResponse(['error' => 'Şifreler eşleşmiyor'], 400);
    }
    
    // Şifre güvenliği
    $password_check = checkPasswordStrength($password);
    if ($password_check['strength'] < 60) {
        jsonResponse([
            'error' => 'Şifre çok zayıf',
            'feedback' => $password_check['feedback'],
            'strength' => $password_check['strength']
        ], 400);
    }
    
    // Email zaten var mı?
    $query = "SELECT id FROM users WHERE email = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('s', $email);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        logRegistration(null, $email, 'REGISTER_FAILED', 'email_exists', $ip_address, $user_agent);
        jsonResponse(['error' => 'Bu email adresi zaten kayıtlı'], 400);
    }
    
    // Username zaten var mı?
    $query = "SELECT id FROM users WHERE username = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('s', $username);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        logRegistration(null, $email, 'REGISTER_FAILED', 'username_exists', $ip_address, $user_agent);
        jsonResponse(['error' => 'Bu kullanıcı adı zaten kayıtlı'], 400);
    }
    
    // Kullanıcı oluştur
    $password_hash = password_hash($password, PASSWORD_BCRYPT);
    $query = "INSERT INTO users (username, email, password_hash, role, status, email_verified, password_strength)
              VALUES (?, ?, ?, 'trader', 'active', FALSE, ?)";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('sssi', $username, $email, $password_hash, $password_check['strength']);
    
    if (!$stmt->execute()) {
        logRegistration(null, $email, 'REGISTER_FAILED', 'db_error', $ip_address, $user_agent);
        jsonResponse(['error' => 'Kayıt başarısız'], 500);
    }
    
    $user_id = $conn->insert_id;
    
    // Güvenlik sorusu cevabı kaydet
    if ($security_question_id && $security_answer) {
        $answer_hash = password_hash(strtolower($security_answer), PASSWORD_BCRYPT);
        $query = "INSERT INTO user_security_answers (user_id, question_id, answer_hash)
                  VALUES (?, ?, ?)";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('iis', $user_id, $security_question_id, $answer_hash);
        $stmt->execute();
    }
    
    // Email doğrulama token'ı oluştur
    $verification_token = bin2hex(random_bytes(32));
    $expires_at = date('Y-m-d H:i:s', strtotime('+24 hours'));
    
    $query = "INSERT INTO email_verification_tokens (user_id, token, email, expires_at)
              VALUES (?, ?, ?, ?)";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('isss', $user_id, $verification_token, $email, $expires_at);
    $stmt->execute();
    
    // Email gönder
    $verification_link = "https://fx.haziroglu.com/Dashboard/verify-email.php?token=" . $verification_token;
    $email_body = "
    <h2>CopyPoz V5 - Email Doğrulama</h2>
    <p>Merhaba $first_name,</p>
    <p>Hesabınızı doğrulamak için aşağıdaki linke tıklayınız:</p>
    <p><a href='$verification_link'>Email'i Doğrula</a></p>
    <p>Bu link 24 saat geçerlidir.</p>
    <p>Eğer bu kaydı siz yapmadıysanız, bu emaili görmezden geliniz.</p>
    ";
    
    sendEmail($email, "CopyPoz V5 - Email Doğrulama", $email_body, true);
    
    logRegistration($user_id, $email, 'REGISTER_SUCCESS', 'pending_verification', $ip_address, $user_agent);
    
    jsonResponse([
        'success' => true,
        'message' => 'Kayıt başarılı. Email doğrulama linki gönderildi.',
        'user_id' => $user_id,
        'next_step' => 'verify_email'
    ]);
}

// ============ EMAIL DOĞRULAMA ============

elseif ($action === 'verify_email') {
    $token = sanitizeInput($_GET['token'] ?? '');
    
    if (!$token) {
        jsonResponse(['error' => 'Token gerekli'], 400);
    }
    
    // Token kontrol et
    $query = "SELECT id, user_id, email, expires_at FROM email_verification_tokens
              WHERE token = ? AND verified_at IS NULL";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('s', $token);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        jsonResponse(['error' => 'Geçersiz veya süresi dolmuş token'], 400);
    }
    
    $token_data = $result->fetch_assoc();
    
    // Token süresi kontrol et
    if (strtotime($token_data['expires_at']) < time()) {
        jsonResponse(['error' => 'Token süresi dolmuş'], 400);
    }
    
    // Email doğrula
    $query = "UPDATE users SET email_verified = TRUE, email_verified_at = NOW() WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('i', $token_data['user_id']);
    $stmt->execute();
    
    // Token'ı işaretle
    $query = "UPDATE email_verification_tokens SET verified_at = NOW() WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('i', $token_data['id']);
    $stmt->execute();
    
    logRegistration($token_data['user_id'], $token_data['email'], 'EMAIL_VERIFIED', 'success', 
                   $_SERVER['REMOTE_ADDR'] ?? '', $_SERVER['HTTP_USER_AGENT'] ?? '');
    
    jsonResponse([
        'success' => true,
        'message' => 'Email doğrulandı. Şimdi MetaTrader hesabınızı kaydedebilirsiniz.',
        'user_id' => $token_data['user_id'],
        'next_step' => 'register_metatrader'
    ]);
}

// ============ METATRADER HESAP KAYDI ============

elseif ($action === 'register_metatrader') {
    $user_id = intval($_POST['user_id'] ?? 0);
    $account_number = intval($_POST['account_number'] ?? 0);
    $account_name = sanitizeInput($_POST['account_name'] ?? '');
    $account_type = $_POST['account_type'] ?? 'live';
    $broker = sanitizeInput($_POST['broker'] ?? '');
    $currency = sanitizeInput($_POST['currency'] ?? 'USD');
    $leverage = intval($_POST['leverage'] ?? 100);
    
    // Kullanıcı kontrol et
    $query = "SELECT id, email_verified FROM users WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        jsonResponse(['error' => 'Kullanıcı bulunamadı'], 404);
    }
    
    $user = $result->fetch_assoc();
    
    if (!$user['email_verified']) {
        jsonResponse(['error' => 'Email doğrulanmamış'], 400);
    }
    
    // Validasyon
    if (!$account_number || !$account_name) {
        jsonResponse(['error' => 'Hesap numarası ve adı gerekli'], 400);
    }
    
    // Hesap zaten var mı?
    $query = "SELECT id FROM metatrader_accounts WHERE account_number = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('i', $account_number);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        jsonResponse(['error' => 'Bu hesap numarası zaten kayıtlı'], 400);
    }
    
    // MetaTrader hesabı oluştur
    $query = "INSERT INTO metatrader_accounts (user_id, account_number, account_name, account_type, broker, currency, leverage, status)
              VALUES (?, ?, ?, ?, ?, ?, ?, 'active')";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('iissssi', $user_id, $account_number, $account_name, $account_type, $broker, $currency, $leverage);
    
    if (!$stmt->execute()) {
        jsonResponse(['error' => 'Hesap kaydı başarısız'], 500);
    }
    
    $account_id = $conn->insert_id;
    
    // Client Terminal oluştur
    $token = bin2hex(random_bytes(32));
    $query = "INSERT INTO clients (account_number, account_name, auth_token, token_type, owner_id, status)
              VALUES (?, ?, ?, 'CLIENT_TOKEN', ?, 'active')";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('issi', $account_number, $account_name, $token, $user_id);
    
    if (!$stmt->execute()) {
        jsonResponse(['error' => 'Client terminal oluşturulamadı'], 500);
    }
    
    $client_id = $conn->insert_id;
    
    // Kullanıcıya Client ata
    $query = "INSERT INTO user_client_assignments (user_id, client_id, assigned_by, status)
              VALUES (?, ?, ?, 'active')";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('iii', $user_id, $client_id, $user_id);
    $stmt->execute();
    
    // Kullanıcı Token oluştur
    $query = "INSERT INTO user_tokens (user_id, client_id, token_value, token_type, created_by, status)
              VALUES (?, ?, ?, 'CLIENT_TOKEN', ?, 'active')";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('iissi', $user_id, $client_id, $token, $user_id);
    $stmt->execute();
    
    logRegistration($user_id, '', 'METATRADER_REGISTERED', 'success', 
                   $_SERVER['REMOTE_ADDR'] ?? '', $_SERVER['HTTP_USER_AGENT'] ?? '');
    
    jsonResponse([
        'success' => true,
        'message' => 'MetaTrader hesabı kaydedildi ve Client Terminal oluşturuldu',
        'account_id' => $account_id,
        'client_id' => $client_id,
        'token' => $token,
        'next_step' => 'download_ea'
    ]);
}

// ============ ŞİFRE GÜVENLİĞİ KONTROL ============

elseif ($action === 'check_password_strength') {
    $password = $_POST['password'] ?? '';
    
    if (!$password) {
        jsonResponse(['error' => 'Şifre gerekli'], 400);
    }
    
    $check = checkPasswordStrength($password);
    
    jsonResponse([
        'success' => true,
        'strength' => $check['strength'],
        'level' => $check['level'],
        'feedback' => $check['feedback']
    ]);
}

// ============ GÜVENLİK SORULARI ============

elseif ($action === 'get_security_questions') {
    $language = sanitizeInput($_GET['language'] ?? 'TR');
    
    $query = "SELECT id, question_text FROM security_questions WHERE language = ? AND status = 'active'";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('s', $language);
    $stmt->execute();
    $result = $stmt->get_result();
    $questions = $result->fetch_all(MYSQLI_ASSOC);
    
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'data' => $questions,
        'count' => count($questions)
    ]);
    exit;
}

// ============ KAYIT GÜNLÜĞÜ ============

function logRegistration($user_id, $email, $action, $status, $ip_address, $user_agent) {
    global $conn;
    
    $query = "INSERT INTO registration_logs (user_id, email, action, status, ip_address, user_agent)
              VALUES (?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('isssss', $user_id, $email, $action, $status, $ip_address, $user_agent);
    $stmt->execute();
}

// Varsayılan yanıt
jsonResponse(['error' => 'Geçersiz istek'], 400);
?>
