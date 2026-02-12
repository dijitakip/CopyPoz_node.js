<?php
@session_start();
require_once 'config/db.php';

if (isset($_COOKIE['user_token'])) {
    $token = $_COOKIE['user_token'];
    $stmt = $pdo->prepare("UPDATE users SET auth_token = NULL WHERE auth_token = ?");
    $stmt->execute([$token]);
    logAction('LOGOUT', 'User logged out', 'INFO');
}

deleteSecureCookie('user_token');
header("Location: index.php");
exit;
?>
