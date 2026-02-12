<?php
/**
 * CopyPoz V5 - Registration Success Page
 * Kayıt başarılı, token göster, EA indirme linki
 */

$token = sanitizeInput($_GET['token'] ?? '');

if (!$token) {
    header('Location: register.php');
    exit;
}

$page_title = 'Kayıt Başarılı';
?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $page_title; ?> - CopyPoz V5</title>
    <link rel="stylesheet" href="assets/style.css">
    <style>
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        .success-container {
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            max-width: 600px;
            width: 100%;
            padding: 40px;
            margin: 20px;
            text-align: center;
        }
        
        .success-icon {
            width: 80px;
            height: 80px;
            background: #28a745;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            font-size: 40px;
        }
        
        .success-container h1 {
            color: #333;
            margin: 0 0 10px 0;
            font-size: 28px;
        }
        
        .success-container p {
            color: #666;
            margin: 10px 0;
            line-height: 1.6;
        }
        
        .token-box {
            background: #f8f9fa;
            border: 2px solid #667eea;
            border-radius: 5px;
            padding: 20px;
            margin: 20px 0;
            text-align: left;
        }
        
        .token-label {
            font-size: 12px;
            color: #999;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        
        .token-value {
            background: white;
            padding: 12px;
            border-radius: 3px;
            font-family: monospace;
            font-size: 14px;
            word-break: break-all;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .copy-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
        }
        
        .copy-btn:hover {
            background: #764ba2;
        }
        
        .steps {
            background: #f8f9fa;
            border-radius: 5px;
            padding: 20px;
            margin: 20px 0;
            text-align: left;
        }
        
        .steps h3 {
            margin-top: 0;
            color: #333;
        }
        
        .steps ol {
            margin: 0;
            padding-left: 20px;
        }
        
        .steps li {
            margin: 10px 0;
            color: #666;
        }
        
        .btn {
            display: inline-block;
            padding: 12px 30px;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            margin: 10px 5px;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
        }
        
        .btn-secondary {
            background: #6c757d;
            color: white;
        }
        
        .btn-secondary:hover {
            background: #5a6268;
        }
        
        .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            font-size: 14px;
        }
        
        @media (max-width: 600px) {
            .success-container {
                padding: 20px;
            }
            
            .btn {
                display: block;
                width: 100%;
                margin: 10px 0;
            }
        }
    </style>
</head>
<body>
    <div class="success-container">
        <div class="success-icon">✓</div>
        
        <h1>Kayıt Başarılı!</h1>
        <p>Hesabınız başarıyla oluşturuldu ve MetaTrader hesabınız kaydedildi.</p>
        
        <div class="token-box">
            <div class="token-label">Client Terminal Token</div>
            <div class="token-value">
                <span id="token-text"><?php echo htmlspecialchars($token); ?></span>
                <button class="copy-btn" onclick="copyToken()">Kopyala</button>
            </div>
        </div>
        
        <div class="warning">
            <strong>⚠️ Önemli:</strong> Bu token'ı güvenli bir yerde saklayın. 
            Client EA'nızda bu token'ı kullanacaksınız.
        </div>
        
        <div class="steps">
            <h3>Sonraki Adımlar:</h3>
            <ol>
                <li><strong>Client EA'yı İndir:</strong> CopyPoz_Client_V5.mq5 dosyasını indirin</li>
                <li><strong>MetaTrader'e Kopyala:</strong> EA dosyasını MetaTrader Experts klasörüne kopyalayın</li>
                <li><strong>Derle:</strong> MetaEditor'de EA'yı derleyin</li>
                <li><strong>Chart'a Ekle:</strong> EA'yı chart'a ekleyin</li>
                <li><strong>Parametreleri Ayarla:</strong>
                    <ul>
                        <li>ClientToken: <code><?php echo htmlspecialchars($token); ?></code></li>
                        <li>MasterAddress: Master EA'nın IP:Port'u</li>
                        <li>AutoFetchToken: true</li>
                    </ul>
                </li>
                <li><strong>Başlat:</strong> EA'yı başlatın</li>
            </ol>
        </div>
        
        <div>
            <a href="index.php" class="btn btn-primary">Dashboard'a Git</a>
            <a href="CopyPoz_V5/Client/CopyPoz_Client_V5.mq5" class="btn btn-secondary">Client EA İndir</a>
        </div>
    </div>
    
    <script>
        function copyToken() {
            const tokenText = document.getElementById('token-text').textContent;
            navigator.clipboard.writeText(tokenText).then(() => {
                alert('Token kopyalandı!');
            }).catch(err => {
                console.error('Kopyalama başarısız:', err);
            });
        }
    </script>
</body>
</html>
