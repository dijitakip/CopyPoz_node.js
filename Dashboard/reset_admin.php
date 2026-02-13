<?php
// reset_admin.php
// Bu dosya admin şifresini sıfırlamak için kullanılır.
// Güvenlik için işlemi yaptıktan sonra bu dosyayı silin.

require_once 'config/db.php';

// Ayarlar
$username = 'admin';
$new_password = 'admin123';

echo "<h1>Admin Şifre Sıfırlama Aracı</h1>";

try {
    // 1. Kullanıcı var mı kontrol et
    $stmt = $pdo->prepare("SELECT id, role FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    $hash = password_hash($new_password, PASSWORD_DEFAULT);

    if ($user) {
        // Kullanıcı var, şifresini güncelle
        echo "Kullanıcı bulundu (ID: " . $user['id'] . ", Rol: " . $user['role'] . ").<br>";
        
        $updateStmt = $pdo->prepare("UPDATE users SET password_hash = ?, status = 'active' WHERE id = ?");
        $updateStmt->execute([$hash, $user['id']]);
        
        echo "<p style='color:green'><strong>BAŞARILI:</strong> '$username' kullanıcısının şifresi güncellendi.</p>";
    } else {
        // Kullanıcı yok, oluştur
        echo "Kullanıcı bulunamadı. Yeni admin kullanıcısı oluşturuluyor...<br>";
        
        $insertStmt = $pdo->prepare("INSERT INTO users (username, email, password_hash, role, status) VALUES (?, ?, ?, 'admin', 'active')");
        // Email çakışmasını önlemek için rastgele bir ek ekleyelim veya varsayılanı kullanalım
        // Eğer email unique ise ve admin@copypoz.local zaten varsa ama username farklıysa hata verebilir.
        // Basitlik için standart email kullanıyoruz.
        $email = 'admin@copypoz.local';
        
        try {
            $insertStmt->execute([$username, $email, $hash]);
            echo "<p style='color:green'><strong>BAŞARILI:</strong> Yeni '$username' kullanıcısı oluşturuldu.</p>";
        } catch (PDOException $e) {
            echo "<p style='color:red'><strong>HATA:</strong> Kullanıcı oluşturulurken hata: " . $e->getMessage() . "</p>";
            echo "Muhtemelen email adresi ($email) başka bir kullanıcıda kayıtlı.";
        }
    }

    echo "<hr>";
    echo "<h3>Giriş Bilgileri:</h3>";
    echo "Kullanıcı Adı: <strong>$username</strong><br>";
    echo "Şifre: <strong>$new_password</strong><br>";
    echo "<br>";
    echo "<a href='index.php'>Giriş Sayfasına Git</a>";

} catch (PDOException $e) {
    echo "<p style='color:red'><strong>VERİTABANI HATASI:</strong> " . $e->getMessage() . "</p>";
    echo "Lütfen config/db.php dosyasındaki veritabanı ayarlarını kontrol edin.";
}
?>
