# CopyPoz V5 - Production Deployment Checklist

## Pre-Deployment (Deployment Öncesi)

### Code Quality
- [ ] `npm run lint` başarılı
- [ ] `npm run typecheck` başarılı
- [ ] `npm run build` başarılı
- [ ] Tüm console.log'lar kaldırıldı
- [ ] Sensitive data hardcoded değil
- [ ] Git history temiz

### Security
- [ ] `.env` dosyası `.gitignore`'da
- [ ] Tüm API endpoints token kontrol ediyor
- [ ] CORS ayarları doğru
- [ ] SQL injection koruması var (Prisma kullanıyor)
- [ ] XSS koruması var
- [ ] CSRF token'lar kullanılıyor
- [ ] Rate limiting yapılandırıldı
- [ ] Password hashing aktif (bcryptjs)

### Database
- [ ] MySQL 8.0 kurulu ve çalışıyor
- [ ] Database backup stratejisi belirlendi
- [ ] Prisma migrations uygulandı
- [ ] Indexes oluşturuldu
- [ ] Connection pooling yapılandırıldı

### Environment
- [ ] `.env.production` hazırlandı
- [ ] DATABASE_URL doğru
- [ ] MASTER_TOKEN güvenli
- [ ] SESSION_SECRET güvenli
- [ ] NODE_ENV=production

## Deployment (Deployment Sırasında)

### Hostinger Setup
- [ ] Node.js 18+ seçildi
- [ ] MySQL 8.0 database oluşturuldu
- [ ] Domain SSL sertifikası aktif
- [ ] Git integration yapılandırıldı (opsiyonel)

### Application Deployment
- [ ] `npm install` çalıştırıldı
- [ ] `npm run prisma:generate` çalıştırıldı
- [ ] `npm run build` başarılı
- [ ] `.env.production` dosyası yüklendi
- [ ] Start command: `npm start` ayarlandı

### Database Migration
- [ ] `npx prisma migrate deploy` çalıştırıldı
- [ ] Tüm tables oluşturuldu
- [ ] Indexes oluşturuldu
- [ ] Admin user oluşturuldu

### Verification
- [ ] Health check endpoint çalışıyor: `/api/health`
- [ ] Login endpoint çalışıyor: `/api/auth/login`
- [ ] Dashboard yükleniyor: `/dashboard`
- [ ] Admin pages erişilebiliyor: `/admin/*`

## Post-Deployment (Deployment Sonrası)

### Monitoring
- [ ] Error logs kontrol ediliyor
- [ ] Application logs aktif
- [ ] Database performance monitored
- [ ] Uptime monitoring kuruldu
- [ ] Alert system aktif

### Performance
- [ ] Page load time < 3s
- [ ] API response time < 500ms
- [ ] Database query time < 100ms
- [ ] Memory usage normal
- [ ] CPU usage normal

### Security
- [ ] SSL/TLS aktif
- [ ] Security headers ayarlandı
- [ ] CORS properly configured
- [ ] Rate limiting working
- [ ] Firewall rules configured

### Backup & Recovery
- [ ] Database backup scheduled
- [ ] Backup verification tested
- [ ] Recovery procedure documented
- [ ] Disaster recovery plan ready

## Maintenance (Bakım)

### Regular Tasks
- [ ] Weekly: Database backup kontrol
- [ ] Weekly: Error logs review
- [ ] Monthly: Security updates
- [ ] Monthly: Performance review
- [ ] Quarterly: Full backup test

### Updates
- [ ] Next.js updates monitored
- [ ] Prisma updates monitored
- [ ] Node.js updates monitored
- [ ] Security patches applied
- [ ] Dependencies updated

## Rollback Plan (Geri Alma Planı)

1. **Immediate Rollback**
   ```bash
   git revert <commit-hash>
   npm run build
   npm start
   ```

2. **Database Rollback**
   ```bash
   npx prisma migrate resolve --rolled-back <migration-name>
   ```

3. **Full Restore**
   - Latest backup'tan restore et
   - Database migrate et
   - Application restart et

## Hostinger Specific Notes

### Node.js Version
- Minimum: 18
- Recommended: 20+
- Current: 22

### Memory Limits
- Typical: 512MB - 1GB
- Monitor: `npm run build` sırasında
- Optimize: Unused dependencies kaldır

### Disk Space
- Minimum: 500MB
- node_modules: ~300MB
- .next: ~100MB
- Database: Depends on data

### Concurrent Connections
- Typical: 100-500
- Database: Connection pooling kullan
- API: Rate limiting implement et

## Support & Resources

- Hostinger Docs: https://support.hostinger.com
- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs
- MySQL Docs: https://dev.mysql.com/doc

## Emergency Contacts

- Hostinger Support: support@hostinger.com
- Database Admin: [Your Email]
- Application Owner: [Your Email]

---

**Last Updated**: 2026-02-25
**Version**: 1.0
**Status**: Ready for Production
