# CopyPoz V5 - Local Development Setup

## Teknoloji Stack

- **Frontend**: Next.js 14 + React 18 + TypeScript
- **Backend**: Next.js API Routes
- **Database**: MySQL 8.0
- **ORM**: Prisma 5.11
- **Styling**: Tailwind CSS
- **Runtime**: Node.js 22

## Gereksinimler

- Node.js 22 (veya 18+)
- npm 11+
- MySQL 8.0
- Git

## Kurulum Adımları

### 1. Repository'yi Clone Edin

```bash
git clone <repository-url>
cd CopyPoz
```

### 2. Bağımlılıkları Yükleyin

```bash
npm install
```

### 3. Environment Variables Ayarlayın

`.env` dosyasını oluşturun (`.env.example`'dan kopyalayın):

```bash
cp .env.example .env
```

`.env` dosyasını düzenleyin:

```env
# Local Development
DATABASE_URL="mysql://root:rootpass123@localhost:3306/copypoz"
MASTER_TOKEN="master-local-123"
SESSION_SECRET="session-secret-local"
NODE_ENV="development"
PORT=3000
NEXT_PUBLIC_MASTER_TOKEN="master-local-123"
```

### 4. Database Kurulumu

#### Seçenek A: Docker ile (Önerilen)

```bash
# Docker network oluşturun
docker network create copypoz_network

# MySQL container'ı başlatın
docker run -d \
  --name copypoz_mysql \
  --network copypoz_network \
  -e MYSQL_ROOT_PASSWORD=rootpass123 \
  -e MYSQL_DATABASE=copypoz \
  -p 3306:3306 \
  mysql:8.0

# Database'i kontrol edin
docker exec copypoz_mysql mysql -u root -prootpass123 -e "SHOW DATABASES;"
```

#### Seçenek B: Local MySQL

```bash
# MySQL'i başlatın
mysql -u root -p

# Database oluşturun
CREATE DATABASE copypoz;
USE copypoz;
```

### 5. Prisma Setup

```bash
# Prisma Client'ı generate edin
npm run prisma:generate

# Database migrations'ı çalıştırın
npx prisma migrate deploy

# (Opsiyonel) Seed data ekleyin
npx prisma db seed
```

### 6. Development Server'ı Başlatın

```bash
npm run dev
```

Server `http://localhost:3000` adresinde çalışacak.

## Kullanım

### Admin Paneline Erişim

1. `http://localhost:3000/login` adresine gidin
2. Varsayılan credentials:
   - Username: `admin`
   - Password: `admin123`

### API Endpoints

#### Health Check
```bash
curl http://localhost:3000/api/health
```

#### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

#### Clients Listesi
```bash
curl http://localhost:3000/api/clients \
  -H "Authorization: Bearer master-local-123"
```

## Development Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Production server
npm start

# Linting
npm run lint

# Type checking
npm run typecheck

# Prisma commands
npm run prisma:generate
npx prisma migrate dev --name <migration-name>
npx prisma studio  # GUI database browser
```

## Dosya Yapısı

```
CopyPoz/
├── app/
│   ├── admin/              # Admin dashboard pages
│   ├── api/                # API routes
│   ├── dashboard/          # Dashboard page
│   ├── login/              # Login page
│   ├── layout.tsx          # Root layout
│   └── globals.css         # Global styles
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── migrations/         # Database migrations
├── public/                 # Static files
├── .env                    # Environment variables
├── .env.example            # Example env file
├── next.config.js          # Next.js configuration
├── tsconfig.json           # TypeScript configuration
├── package.json            # Dependencies
└── README.md               # Project documentation
```

## Database Schema

### Main Tables

1. **users** - Admin users
2. **clients** - MetaTrader clients
3. **master_state** - Master EA state
4. **command_queue** - Commands for clients
5. **master_groups** - Master groups
6. **master_group_assignments** - Group assignments
7. **user_tokens** - API tokens
8. **licenses** - License management
9. **trader_clients** - Trader-client assignments
10. **password_resets** - Password reset tokens
11. **system_logs** - System logs

## Troubleshooting

### Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Çözüm:**
- MySQL'in çalışıp çalışmadığını kontrol edin
- DATABASE_URL'i kontrol edin
- Docker container'ı kontrol edin: `docker ps`

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Çözüm:**
```bash
# Port 3000'ı kullanan process'i bulun
lsof -i :3000

# Process'i kill edin
kill -9 <PID>
```

### Prisma Migration Error

```
Error: P3005 Database does not exist
```

**Çözüm:**
```bash
# Database'i oluşturun
npx prisma db push

# Veya migrations'ı çalıştırın
npx prisma migrate deploy
```

### Build Error

```bash
# Cache'i temizleyin
rm -rf .next node_modules
npm install
npm run build
```

## Docker Compose ile Tam Setup

```bash
# Tüm services'i başlatın
docker-compose up -d

# Logs'ları görün
docker-compose logs -f

# Services'i durdurun
docker-compose down
```

## Production Deployment

Hostinger'a deploy etmek için bkz: [HOSTINGER_DEPLOYMENT.md](./HOSTINGER_DEPLOYMENT.md)

## Useful Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [MySQL Documentation](https://dev.mysql.com/doc)

## Support

Sorunlar için:
1. Logs'ları kontrol edin
2. `.env` dosyasını kontrol edin
3. Database bağlantısını kontrol edin
4. GitHub Issues'ı kontrol edin

---

**Last Updated**: 2026-02-25
**Version**: 1.0
