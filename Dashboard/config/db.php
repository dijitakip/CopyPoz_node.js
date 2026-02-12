<?php
// ============================================
// SIMPLE DATABASE CONFIG
// ============================================

// Error handling
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
ini_set('log_errors', 1);

// Log directory
$logDir = __DIR__ . '/../logs';
if (!is_dir($logDir)) {
    @mkdir($logDir, 0755, true);
}
ini_set('error_log', $logDir . '/php_errors.log');

// ============================================
// DATABASE CONFIGURATION
// ============================================
define('DB_HOST', 'tarikhaziroglu.ipowermysql.com');
define('DB_NAME', 'fx_sql_db_fx');
define('DB_USER', 'fxdbusr');
define('DB_PASS', 'Tar2024Fik.Sql');

// ============================================
// SECURITY CONSTANTS
// ============================================
define('MASTER_TOKEN', 'MASTER_SECRET_TOKEN_123');
define('JWT_SECRET', 'ADGrkleBk47UZQ4ZHLC1FY7w5IyGdaGuYa9+HSec4+k=');
define('COOKIE_LIFETIME', 30 * 24 * 60 * 60);
define('TOKEN_LENGTH', 32);
define('MAX_LOGIN_ATTEMPTS', 5);
define('LOGIN_ATTEMPT_WINDOW', 15 * 60);

// ============================================
// DATABASE CONNECTION
// ============================================
try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );
} catch(PDOException $e) {
    http_response_code(500);
    error_log("Database Error: " . $e->getMessage());
    die(json_encode(['error' => 'Database connection failed']));
}

// ============================================
// SECURITY HEADERS
// ============================================
@header('X-Content-Type-Options: nosniff');
@header('X-Frame-Options: SAMEORIGIN');
@header('X-XSS-Protection: 1; mode=block');
@header('Referrer-Policy: strict-origin-when-cross-origin');
@header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
@header('Pragma: no-cache');
@header('Expires: 0');

// ============================================
// HELPER FUNCTIONS
// ============================================

function jsonResponse($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function sanitizeInput($input) {
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

function escapeHtml($string) {
    return htmlspecialchars($string, ENT_QUOTES, 'UTF-8');
}

function setSecureCookie($name, $value, $lifetime = COOKIE_LIFETIME) {
    $options = [
        'expires' => time() + $lifetime,
        'path' => '/',
        'domain' => '',
        'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on',
        'httponly' => true,
        'samesite' => 'Strict'
    ];
    setcookie($name, $value, $options);
}

function deleteSecureCookie($name) {
    setcookie($name, '', [
        'expires' => time() - 3600,
        'path' => '/',
        'httponly' => true,
        'samesite' => 'Strict'
    ]);
    unset($_COOKIE[$name]);
}

function authenticateUser() {
    if (!isset($_COOKIE['user_token'])) {
        return null;
    }
    
    global $pdo;
    $token = $_COOKIE['user_token'];
    
    try {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE auth_token = ? AND auth_token_expires > NOW()");
        $stmt->execute([$token]);
        $user = $stmt->fetch();
        
        if (!$user) {
            deleteSecureCookie('user_token');
            return null;
        }
        
        return $user;
    } catch (Exception $e) {
        error_log("Auth Error: " . $e->getMessage());
        return null;
    }
}

function requireAdmin() {
    $user = authenticateUser();
    if (!$user || $user['role'] !== 'admin') {
        http_response_code(403);
        jsonResponse(['error' => 'Unauthorized']);
    }
    return $user;
}

function requireTrader() {
    $user = authenticateUser();
    if (!$user || !in_array($user['role'], ['admin', 'trader'])) {
        http_response_code(403);
        jsonResponse(['error' => 'Unauthorized']);
    }
    return $user;
}

function canAccessClient($userId, $clientId) {
    global $pdo;
    
    $user = authenticateUser();
    if ($user && $user['role'] === 'admin') {
        return true;
    }
    
    try {
        $stmt = $pdo->prepare("SELECT 1 FROM trader_clients WHERE trader_id = ? AND client_id = ?");
        $stmt->execute([$userId, $clientId]);
        return $stmt->fetch() !== false;
    } catch (Exception $e) {
        return false;
    }
}

function checkRateLimit($identifier, $max_attempts = MAX_LOGIN_ATTEMPTS, $window = LOGIN_ATTEMPT_WINDOW) {
    if (!isset($_SESSION)) {
        @session_start();
    }
    
    $key = "ratelimit_" . md5($identifier);
    $now = time();
    
    if (!isset($_SESSION[$key])) {
        $_SESSION[$key] = [];
    }
    
    $_SESSION[$key] = array_filter($_SESSION[$key], function($time) use ($now, $window) {
        return $time > ($now - $window);
    });
    
    if (count($_SESSION[$key]) >= $max_attempts) {
        return false;
    }
    
    $_SESSION[$key][] = $now;
    return true;
}

function logAction($action, $details = '', $level = 'INFO') {
    $importantActions = ['LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'COMMAND_SENT', 'CLIENT_REGISTERED', 'API_UNAUTHORIZED', 'API_ERROR', 'COMMAND_ERROR', 'CLIENT_ERROR'];
    
    if ($level !== 'INFO' || in_array($action, $importantActions)) {
        $logFile = __DIR__ . '/../logs/actions.log';
        
        if (file_exists($logFile) && filesize($logFile) > 5 * 1024 * 1024) {
            @unlink($logFile);
        }
        
        $timestamp = date('Y-m-d H:i:s');
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'CLI';
        $logEntry = "[$timestamp] [$level] [$ip] $action - $details\n";
        
        @file_put_contents($logFile, $logEntry, FILE_APPEND);
    }
}

function sendEmail($to, $subject, $body, $isHtml = true) {
    // Sunucunun sendmail path'i
    $sendmailPath = ini_get('sendmail_path');
    
    if (empty($sendmailPath)) {
        // Sendmail yok, alternatif yöntem
        error_log("Sendmail not configured. Trying mail() function.");
    }
    
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-type: " . ($isHtml ? "text/html" : "text/plain") . "; charset=UTF-8\r\n";
    $headers .= "From: noreply@fx.haziroglu.com\r\n";
    $headers .= "Reply-To: support@fx.haziroglu.com\r\n";
    $headers .= "Return-Path: noreply@fx.haziroglu.com\r\n";
    $headers .= "X-Mailer: CopyPoz Dashboard\r\n";
    $headers .= "X-Priority: 3\r\n";
    $headers .= "X-MSMail-Priority: Normal\r\n";
    $headers .= "Importance: Normal\r\n";
    $headers .= "List-Unsubscribe: <mailto:support@fx.haziroglu.com>\r\n";
    
    $result = @mail($to, $subject, $body, $headers);
    
    if ($result) {
        error_log("Email sent to: $to");
    } else {
        error_log("Email failed to: $to");
    }
    
    return $result;
}

function generatePasswordResetToken($userId) {
    global $pdo;
    
    $token = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', time() + 24 * 60 * 60); // 24 saat
    
    try {
        $stmt = $pdo->prepare("INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)");
        $stmt->execute([$userId, $token, $expiresAt]);
        return $token;
    } catch (Exception $e) {
        return null;
    }
}

function sendWelcomeEmail($email, $username, $resetToken) {
    $resetLink = "https://fx.haziroglu.com/reset-password.php?token=" . $resetToken;
    
    $subject = "CopyPoz Dashboard - Hesabınız Oluşturuldu";
    
    $body = "
    <html>
    <head>
        <meta charset='UTF-8'>
        <style>
            body { font-family: Arial, sans-serif; background-color: #f8f9fa; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 20px auto; background-color: white; padding: 0; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: bold; }
            .header p { margin: 5px 0 0 0; font-size: 14px; opacity: 0.9; }
            .content { padding: 30px 20px; color: #333; line-height: 1.6; }
            .content p { margin: 0 0 15px 0; }
            .info-box { background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #667eea; }
            .info-box strong { color: #667eea; }
            .button-container { text-align: center; margin: 30px 0; }
            .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 40px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; }
            .button:hover { opacity: 0.9; }
            .link-box { background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0; word-break: break-all; font-size: 12px; font-family: monospace; }
            .footer { border-top: 1px solid #e0e0e0; padding: 20px; background-color: #f8f9fa; font-size: 12px; color: #999; text-align: center; }
            .footer p { margin: 5px 0; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>🎉 CopyPoz Dashboard</h1>
                <p>Hesabınız Oluşturuldu</p>
            </div>
            
            <div class='content'>
                <p>Merhaba <strong>" . escapeHtml($username) . "</strong>,</p>
                
                <p>CopyPoz FX Trading Dashboard'a hoş geldiniz! Hesabınız başarıyla oluşturulmuştur.</p>
                
                <div class='info-box'>
                    <p><strong>📧 Email:</strong> " . escapeHtml($email) . "</p>
                    <p><strong>👤 Kullanıcı Adı:</strong> " . escapeHtml($username) . "</p>
                </div>
                
                <p>Hesabınıza erişmek için şifrenizi oluşturmanız gerekiyor. Aşağıdaki butona tıklayın:</p>
                
                <div class='button-container'>
                    <a href='" . $resetLink . "' class='button'>Şifre Oluştur</a>
                </div>
                
                <p><strong>Veya bu linki tarayıcınıza yapıştırın:</strong></p>
                <div class='link-box'>" . $resetLink . "</div>
                
                <p style='color: #999; font-size: 12px;'><strong>⏰ Önemli:</strong> Bu link 24 saat geçerlidir. Eğer linkin süresi dolmuşsa, yöneticiye başvurun.</p>
                
                <p>Sorularınız varsa, lütfen bizimle iletişime geçin.</p>
                
                <p>Saygılarımızla,<br><strong>CopyPoz Team</strong></p>
            </div>
            
            <div class='footer'>
                <p>Bu email otomatik olarak gönderilmiştir. Lütfen yanıt vermeyin.</p>
                <p>&copy; 2026 CopyPoz. Tüm hakları saklıdır.</p>
                <p>fx.haziroglu.com</p>
            </div>
        </div>
    </body>
    </html>
    ";
    
    return sendEmail($email, $subject, $body, true);
}

function sendPasswordResetEmail($email, $username, $resetToken) {
    $resetLink = "https://fx.haziroglu.com/reset-password.php?token=" . $resetToken;
    
    $subject = "CopyPoz Dashboard - Şifre Sıfırlama";
    
    $body = "
    <html>
    <head>
        <meta charset='UTF-8'>
        <style>
            body { font-family: Arial, sans-serif; background-color: #f8f9fa; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 20px auto; background-color: white; padding: 0; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: bold; }
            .header p { margin: 5px 0 0 0; font-size: 14px; opacity: 0.9; }
            .content { padding: 30px 20px; color: #333; line-height: 1.6; }
            .content p { margin: 0 0 15px 0; }
            .warning-box { background-color: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107; }
            .warning-box strong { color: #856404; }
            .button-container { text-align: center; margin: 30px 0; }
            .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 40px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; }
            .button:hover { opacity: 0.9; }
            .link-box { background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0; word-break: break-all; font-size: 12px; font-family: monospace; }
            .footer { border-top: 1px solid #e0e0e0; padding: 20px; background-color: #f8f9fa; font-size: 12px; color: #999; text-align: center; }
            .footer p { margin: 5px 0; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>🔐 CopyPoz Dashboard</h1>
                <p>Şifre Sıfırlama</p>
            </div>
            
            <div class='content'>
                <p>Merhaba <strong>" . escapeHtml($username) . "</strong>,</p>
                
                <p>Hesabınız için şifre sıfırlama talebinde bulunulmuştur.</p>
                
                <div class='warning-box'>
                    <p><strong>⚠️ Önemli:</strong> Eğer bu talebini siz yapmadıysanız, bu emaili görmezden gelebilirsiniz.</p>
                </div>
                
                <p>Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:</p>
                
                <div class='button-container'>
                    <a href='" . $resetLink . "' class='button'>Şifre Sıfırla</a>
                </div>
                
                <p><strong>Veya bu linki tarayıcınıza yapıştırın:</strong></p>
                <div class='link-box'>" . $resetLink . "</div>
                
                <p style='color: #999; font-size: 12px;'><strong>⏰ Önemli:</strong> Bu link 24 saat geçerlidir. Linkin süresi dolduktan sonra yeni bir sıfırlama talebinde bulunmanız gerekecektir.</p>
                
                <p>Sorularınız varsa, lütfen bizimle iletişime geçin.</p>
                
                <p>Saygılarımızla,<br><strong>CopyPoz Team</strong></p>
            </div>
            
            <div class='footer'>
                <p>Bu email otomatik olarak gönderilmiştir. Lütfen yanıt vermeyin.</p>
                <p>&copy; 2026 CopyPoz. Tüm hakları saklıdır.</p>
                <p>fx.haziroglu.com</p>
            </div>
        </div>
    </body>
    </html>
    ";
    
    return sendEmail($email, $subject, $body, true);
}

?>
