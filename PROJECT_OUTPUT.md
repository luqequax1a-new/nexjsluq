# Luq Admin - Output

Bu dosya, kurulumu ve proje iskeletini özetler. Framework tarafından otomatik oluşturulan standart dosyalar (Laravel/Next scaffold) bu dökümanda tek tek basılmadı; ancak **bizim eklediğimiz/değiştirdiğimiz kritik dosyaların** içerikleri yer alır.

> Not: İstersen bir sonraki mesajda chat’e de aynı formatta (komutlar/ağaç/dosyalar) dökebilirim.

---

## 1) Terminal Komutları

### Backend (Laravel)
```powershell
# Backend dizinine geç
cd .\backend

# Paketler (zaten kuruldu)
composer require laravel/sanctum spatie/laravel-permission

# Publish (zaten yapıldı)
php artisan vendor:publish --provider="Laravel\\Sanctum\\SanctumServiceProvider" --force
php artisan vendor:publish --provider="Spatie\\Permission\\PermissionServiceProvider" --force

# PostgreSQL user/db (port 5466, şifre yok)
psql -h 127.0.0.1 -p 5466 -U postgres -d postgres -c "CREATE ROLE luq LOGIN" 
psql -h 127.0.0.1 -p 5466 -U postgres -d postgres -c "CREATE DATABASE luq_admin OWNER luq"

# DB env'i .env içine yaz (gitignored olduğu için örnek değerler .env.example'da)
# DB_CONNECTION=pgsql
# DB_HOST=127.0.0.1
# DB_PORT=5466
# DB_DATABASE=luq_admin
# DB_USERNAME=luq
# DB_PASSWORD=

# Migrate + seed (env override ile)
$env:DB_CONNECTION='pgsql'; $env:DB_HOST='127.0.0.1'; $env:DB_PORT='5466'; $env:DB_DATABASE='luq_admin'; $env:DB_USERNAME='luq'; $env:DB_PASSWORD=''; \
php artisan migrate:fresh --seed

# Serve
php artisan serve --host=127.0.0.1 --port=8000
```

### Frontend (Next.js)
```powershell
cd .\frontend
copy .env.example .env.local
npm install
npm run dev
```

---

## 2) Dosya Ağacı (özet)
```
luq-admin-monorepo/
  backend/
    app/Http/Controllers/Api/*
    app/Models/Product.php
    app/Policies/ProductPolicy.php
    app/Providers/AuthServiceProvider.php
    bootstrap/app.php
    bootstrap/providers.php
    config/cors.php
    routes/api.php
    database/migrations/2026_01_29_190000_create_products_table.php
    database/seeders/*
    .env.example
  frontend/
    src/app/admin/**
    src/components/AppProviders.tsx
    src/components/admin/**
    src/lib/api.ts
    src/lib/auth.ts
    public/manifest.webmanifest
    public/service-worker.js
    public/icons/icon-192.svg
    public/icons/icon-512.svg
    .env.example
    .env.local.example
  PROJECT_STATUS.md
  PROJECT_OUTPUT.md
```

---

## 3) Dosyalar (kritik/custom)

### backend/bootstrap/app.php
```php
