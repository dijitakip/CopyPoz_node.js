<?php
/**
 * CopyPoz V5 - User Registration UI
 * Üyelik kaydı, email doğrulama, MetaTrader hesap kaydı
 */

session_start();

// Zaten giriş yapılmış mı?
if (isset($_SESSION['user_id'])) {
    header('Location: dashboard-v5.php');
    exit;
}

$page_title = 'Üyelik Kaydı';
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
        
        .registration-container {
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            max-width: 500px;
            width: 100%;
            padding: 40px;
            margin: 20px;
        }
        
        .registration-header {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .registration-header h1 {
            color: #333;
            margin: 0 0 10px 0;
            font-size: 28px;
        }
        
        .registration-header p {
            color: #666;
            margin: 0;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 600;
            font-size: 14px;
        }
        
        .form-group input,
        .form-group select,
        .form-group textarea {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 14px;
            box-sizing: border-box;
            transition: border-color 0.3s;
        }
        
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .password-strength {
            margin-top: 8px;
            padding: 10px;
            border-radius: 5px;
            font-size: 13px;
            display: none;
        }
        
        .password-strength.show {
            display: block;
        }
        
        .password-strength.weak {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .password-strength.medium {
            background: #fff3cd;
            color: #856404;
            border: 1px solid #ffeaa7;
        }
        
        .password-strength.strong {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .strength-bar {
            height: 4px;
            background: #ddd;
            border-radius: 2px;
            margin-bottom: 8px;
            overflow: hidden;
        }
        
        .strength-fill {
            height: 100%;
            width: 0%;
            transition: width 0.3s;
        }
        
        .strength-fill.weak {
            background: #dc3545;
            width: 33%;
        }
        
        .strength-fill.medium {
            background: #ffc107;
            width: 66%;
        }
        
        .strength-fill.strong {
            background: #28a745;
            width: 100%;
        }
        
        .feedback-list {
            list-style: none;
            padding: 0;
            margin: 8px 0 0 0;
        }
        
        .feedback-list li {
            padding: 4px 0;
            font-size: 12px;
        }
        
        .feedback-list li:before {
            content: "✗ ";
            margin-right: 5px;
        }
        
        .btn {
            width: 100%;
            padding: 12px;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
        }
        
        .btn-primary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }
        
        .alert {
            padding: 12px;
            border-radius: 5px;
            margin-bottom: 20px;
            display: none;
        }
        
        .alert.show {
            display: block;
        }
        
        .alert-success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .alert-error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .alert-info {
            background: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
        }
        
        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        
        .form-row .form-group {
            margin-bottom: 0;
        }
        
        .login-link {
            text-align: center;
            margin-top: 20px;
            color: #666;
        }
        
        .login-link a {
            color: #667eea;
            text-decoration: none;
            font-weight: 600;
        }
        
        .login-link a:hover {
            text-decoration: underline;
        }
        
        .step-indicator {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            position: relative;
        }
        
        .step-indicator::before {
            content: '';
            position: absolute;
            top: 20px;
            left: 0;
            right: 0;
            height: 2px;
            background: #ddd;
            z-index: 0;
        }
        
        .step {
            flex: 1;
            text-align: center;
            position: relative;
            z-index: 1;
        }
        
        .step-number {
            width: 40px;
            height: 40px;
            background: #ddd;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 10px;
            font-weight: 600;
            color: #666;
        }
        
        .step.active .step-number {
            background: #667eea;
            color: white;
        }
        
        .step.completed .step-number {
            background: #28a745;
            color: white;
        }
        
        .step-label {
            font-size: 12px;
            color: #666;
        }
        
        .step.active .step-label {
            color: #667eea;
            font-weight: 600;
        }
        
        .form-section {
            display: none;
        }
        
        .form-section.active {
            display: block;
        }
        
        @media (max-width: 600px) {
            .registration-container {
                padding: 20px;
            }
            
            .form-row {
                grid-template-columns: 1fr;
            }
            
            .step-indicator {
                margin-bottom: 20px;
            }
            
            .step-label {
                font-size: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="registration-container">
        <div class="registration-header">
            <h1>CopyPoz V5</h1>
            <p>Üyelik Kaydı</p>
        </div>
        
        <!-- Step Indicator -->
        <div class="step-indicator">
            <div class="step active" id="step-1">
                <div class="step-number">1</div>
                <div class="step-label">Kayıt</div>
            </div>
            <div class="step" id="step-2">
                <div class="step-number">2</div>
                <div class="step-label">Email Doğrulama</div>
            </div>
            <div class="step" id="step-3">
                <div class="step-number">3</div>
                <div class="step-label">MetaTrader</div>
            </div>
        </div>
        
        <div id="alert-container"></div>
        
        <!-- STEP 1: KAYIT FORMU -->
        <form id="registration-form" class="form-section active">
            <h3>Hesap Bilgileri</h3>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Ad</label>
                    <input type="text" id="first_name" placeholder="Adınız" required>
                </div>
                <div class="form-group">
                    <label>Soyadı</label>
                    <input type="text" id="last_name" placeholder="Soyadınız" required>
                </div>
            </div>
            
            <div class="form-group">
                <label>Kullanıcı Adı</label>
                <input type="text" id="username" placeholder="Kullanıcı adı" required>
            </div>
            
            <div class="form-group">
                <label>Email Adresi</label>
                <input type="email" id="email" placeholder="email@example.com" required>
            </div>
            
            <div class="form-group">
                <label>Telefon</label>
                <input type="tel" id="phone" placeholder="+90 5XX XXX XXXX">
            </div>
            
            <div class="form-group">
                <label>Ülke</label>
                <input type="text" id="country" placeholder="Türkiye">
            </div>
            
            <div class="form-group">
                <label>Şifre</label>
                <input type="password" id="password" placeholder="Güçlü bir şifre girin" required>
                <div id="password-strength" class="password-strength">
                    <div class="strength-bar">
                        <div class="strength-fill"></div>
                    </div>
                    <div id="strength-level"></div>
                    <ul class="feedback-list" id="feedback-list"></ul>
                </div>
            </div>
            
            <div class="form-group">
                <label>Şifre Tekrar</label>
                <input type="password" id="password_confirm" placeholder="Şifreyi tekrar girin" required>
            </div>
            
            <div class="form-group">
                <label>Güvenlik Sorusu</label>
                <select id="security_question_id" required>
                    <option value="">-- Güvenlik Sorusu Seçiniz --</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Güvenlik Sorusu Cevabı</label>
                <input type="text" id="security_answer" placeholder="Cevabınız" required>
            </div>
            
            <button type="button" class="btn btn-primary" onclick="submitRegistration()">
                Devam Et
            </button>
            
            <div class="login-link">
                Zaten hesabınız var mı? <a href="index.php">Giriş Yapın</a>
            </div>
        </form>
        
        <!-- STEP 2: EMAIL DOĞRULAMA -->
        <div id="email-verification" class="form-section">
            <h3>Email Doğrulama</h3>
            <p style="color: #666; margin-bottom: 20px;">
                Email adresinize bir doğrulama linki gönderildi. 
                Lütfen emailinizi kontrol edin ve linke tıklayın.
            </p>
            <p style="color: #999; font-size: 14px;">
                Email almadınız mı? <a href="#" onclick="resendVerificationEmail()" style="color: #667eea;">Tekrar Gönder</a>
            </p>
        </div>
        
        <!-- STEP 3: METATRADER HESAP KAYDI -->
        <form id="metatrader-form" class="form-section">
            <h3>MetaTrader Hesap Bilgileri</h3>
            
            <div class="form-group">
                <label>Hesap Numarası</label>
                <input type="number" id="account_number" placeholder="Örn: 123456789" required>
            </div>
            
            <div class="form-group">
                <label>Hesap Adı</label>
                <input type="text" id="account_name" placeholder="Örn: Live Account" required>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Hesap Tipi</label>
                    <select id="account_type" required>
                        <option value="live">Live</option>
                        <option value="demo">Demo</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Broker</label>
                    <input type="text" id="broker" placeholder="Broker adı">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Para Birimi</label>
                    <input type="text" id="currency" placeholder="USD" value="USD">
                </div>
                <div class="form-group">
                    <label>Kaldıraç</label>
                    <input type="number" id="leverage" placeholder="100" value="100">
                </div>
            </div>
            
            <button type="button" class="btn btn-primary" onclick="submitMetaTrader()">
                Hesabı Kaydet
            </button>
        </form>
    </div>
    
    <script>
        let currentStep = 1;
        let registrationData = {};
        
        // Güvenlik sorularını yükle
        function loadSecurityQuestions() {
            fetch('api/register.php?action=get_security_questions&language=TR')
                .then(r => r.json())
                .then(data => {
                    if (data.success) {
                        let html = '<option value="">-- Güvenlik Sorusu Seçiniz --</option>';
                        data.data.forEach(q => {
                            html += `<option value="${q.id}">${q.question_text}</option>`;
                        });
                        document.getElementById('security_question_id').innerHTML = html;
                    }
                })
                .catch(e => console.error('Sorular yüklenemedi:', e));
        }
        
        // Şifre güvenliği kontrol
        document.getElementById('password').addEventListener('input', function() {
            const password = this.value;
            
            if (!password) {
                document.getElementById('password-strength').classList.remove('show');
                return;
            }
            
            fetch('api/register.php?action=check_password_strength', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'password=' + encodeURIComponent(password)
            })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    const strengthDiv = document.getElementById('password-strength');
                    strengthDiv.classList.add('show');
                    strengthDiv.className = `password-strength show ${data.level}`;
                    
                    const fill = strengthDiv.querySelector('.strength-fill');
                    fill.className = `strength-fill ${data.level}`;
                    
                    let levelText = data.level === 'weak' ? 'Zayıf' : 
                                   data.level === 'medium' ? 'Orta' : 'Güçlü';
                    document.getElementById('strength-level').textContent = `Güç: ${levelText} (${data.strength}%)`;
                    
                    let feedbackHtml = '';
                    data.feedback.forEach(f => {
                        feedbackHtml += `<li>${f}</li>`;
                    });
                    document.getElementById('feedback-list').innerHTML = feedbackHtml;
                }
            })
            .catch(e => console.error('Hata:', e));
        });
        
        // Kayıt gönder
        function submitRegistration() {
            const formData = new FormData();
            formData.append('username', document.getElementById('username').value);
            formData.append('email', document.getElementById('email').value);
            formData.append('password', document.getElementById('password').value);
            formData.append('password_confirm', document.getElementById('password_confirm').value);
            formData.append('first_name', document.getElementById('first_name').value);
            formData.append('last_name', document.getElementById('last_name').value);
            formData.append('phone', document.getElementById('phone').value);
            formData.append('country', document.getElementById('country').value);
            formData.append('security_question_id', document.getElementById('security_question_id').value);
            formData.append('security_answer', document.getElementById('security_answer').value);
            
            fetch('api/register.php?action=register', {
                method: 'POST',
                body: formData
            })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    registrationData.user_id = data.user_id;
                    showAlert('Kayıt başarılı! Email doğrulama linki gönderildi.', 'success');
                    goToStep(2);
                } else {
                    showAlert(data.error || 'Kayıt başarısız', 'error');
                }
            })
            .catch(e => showAlert('Hata: ' + e, 'error'));
        }
        
        // MetaTrader hesabı gönder
        function submitMetaTrader() {
            const formData = new FormData();
            formData.append('user_id', registrationData.user_id);
            formData.append('account_number', document.getElementById('account_number').value);
            formData.append('account_name', document.getElementById('account_name').value);
            formData.append('account_type', document.getElementById('account_type').value);
            formData.append('broker', document.getElementById('broker').value);
            formData.append('currency', document.getElementById('currency').value);
            formData.append('leverage', document.getElementById('leverage').value);
            
            fetch('api/register.php?action=register_metatrader', {
                method: 'POST',
                body: formData
            })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    showAlert('MetaTrader hesabı kaydedildi! Token: ' + data.token, 'success');
                    registrationData.token = data.token;
                    registrationData.client_id = data.client_id;
                    
                    // Başarı sayfasına yönlendir
                    setTimeout(() => {
                        window.location.href = 'registration-success.php?token=' + data.token;
                    }, 2000);
                } else {
                    showAlert(data.error || 'Hesap kaydı başarısız', 'error');
                }
            })
            .catch(e => showAlert('Hata: ' + e, 'error'));
        }
        
        // Step değiştir
        function goToStep(step) {
            currentStep = step;
            
            // Tüm form bölümlerini gizle
            document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
            
            // Step göstergelerini güncelle
            document.querySelectorAll('.step').forEach((s, i) => {
                s.classList.remove('active', 'completed');
                if (i + 1 < step) s.classList.add('completed');
                if (i + 1 === step) s.classList.add('active');
            });
            
            // Uygun form bölümünü göster
            if (step === 1) {
                document.getElementById('registration-form').classList.add('active');
            } else if (step === 2) {
                document.getElementById('email-verification').classList.add('active');
            } else if (step === 3) {
                document.getElementById('metatrader-form').classList.add('active');
            }
        }
        
        // Alert göster
        function showAlert(message, type) {
            const alertDiv = document.createElement('div');
            alertDiv.className = `alert alert-${type} show`;
            alertDiv.textContent = message;
            document.getElementById('alert-container').appendChild(alertDiv);
            setTimeout(() => alertDiv.remove(), 5000);
        }
        
        // Sayfa yüklendiğinde
        document.addEventListener('DOMContentLoaded', () => {
            loadSecurityQuestions();
            
            // URL'den token kontrol et (email doğrulama)
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('verify');
            if (token) {
                verifyEmail(token);
            }
        });
        
        // Email doğrula
        function verifyEmail(token) {
            fetch('api/register.php?action=verify_email&token=' + token)
                .then(r => r.json())
                .then(data => {
                    if (data.success) {
                        registrationData.user_id = data.user_id;
                        showAlert('Email doğrulandı! Şimdi MetaTrader hesabınızı kaydedebilirsiniz.', 'success');
                        goToStep(3);
                    } else {
                        showAlert(data.error || 'Email doğrulama başarısız', 'error');
                    }
                })
                .catch(e => showAlert('Hata: ' + e, 'error'));
        }
    </script>
</body>
</html>
