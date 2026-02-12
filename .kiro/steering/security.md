---
inclusion: auto
---

# CopyPoz Security Guidelines

## Güvenlik Standartları

### 1. Input Validation & Sanitization
- Tüm user input'lar `sanitizeInput()` ile temizlenecek
- Email validation: `filter_var($email, FILTER_VALIDATE_EMAIL)`
- Numeric validation: `(int)` veya `(float)` casting
- Array validation: `is_array()` ve `count()` kontrolleri

### 2. SQL Injection Prevention
- Tüm database queries prepared statements kullanacak
- Hiçbir zaman string concatenation yapılmayacak
- PDO ile parameterized queries zorunlu

### 3. Authentication & Authorization
- Cookie-based authentication (HttpOnly, Secure, SameSite)
- Token expiration: 30 gün
- Rate limiting: 5 deneme / 15 dakika
- Role-based access control (RBAC)

### 4. CSRF Protection
- CSRF token validation tüm POST işlemleri için
- Token regeneration her login'de
- SameSite=Strict cookie policy

### 5. Password Security
- Minimum 6 karakter
- PASSWORD_BCRYPT hashing
- Şifre değişikliği: email doğrulama gerekli

### 6. API Security
- Bearer token authentication
- Rate limiting: 100 requests/minute
- CORS headers kontrol
- Content-Type validation

### 7. Logging & Monitoring
- Tüm login/logout olayları loglanacak
- Başarısız login denemeler loglanacak
- Admin işlemleri loglanacak
- Log dosyası 5MB'ı aşarsa rotate edilecek

### 8. HTTPS & Headers
- Tüm cookies: Secure flag
- X-Content-Type-Options: nosniff
- X-Frame-Options: SAMEORIGIN
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

## Mobile Security
- Viewport meta tag zorunlu
- Touch-friendly button sizes (min 44x44px)
- Responsive form inputs
- Mobile-optimized error messages

## Deployment Checklist
- [ ] HTTPS enabled
- [ ] Database credentials environment variables
- [ ] Debug mode disabled
- [ ] Error logging configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Backup strategy implemented
