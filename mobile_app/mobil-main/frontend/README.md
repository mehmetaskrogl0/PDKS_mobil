# Atlas PDKS — Mobile App

React Native / Expo mobil uygulama. `eminyldz24/PDKS_PROJECT` reposundaki FastAPI + SQLAlchemy backend'e bağlanır.

## Backend ile birlikte çalıştırma

### 1. Backend'i başlatın (bu reponun `backend/` klasöründeki referans FastAPI)
```bash
cd backend
python -m venv venv && source venv/bin/activate  # Windows: venv\Scripts\activate
pip install fastapi uvicorn sqlalchemy pymysql passlib[bcrypt] python-jose python-multipart openpyxl
# MySQL'i (referans database.py'de belirtilen `pdks_db`) ayağa kaldırın veya
# environment variable ile SQLite'a geçirin:
#   export DATABASE_URL="sqlite:///./pdks.db"
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend `/auth/login`, `/users/me`, `/attendance/check-in`, `/leave/`, `/dashboard/admin`, `/reports/monthly/all` vb. endpoint'ler mobile backend tarafında `/api` prefix'i ile çalışır.

### 2. Mobile app'i başlatın
```bash
cd mobile_app/mobil-main/frontend
npm install
copy .env.example .env
# .env dosyasındaki EXPO_PUBLIC_BACKEND_URL değerini
# kendi bilgisayarınızın LAN IP'sine göre güncelleyin (örn. 192.168.1.100)
npm run start
```

Expo Go uygulaması ile QR kodu tarayarak telefonunuzda açabilir veya `w` tuşuyla web tarayıcıda gösterebilirsiniz.

### 3. Test hesabı
Backend'i ilk kez ayağa kaldırırken bir admin hesabı oluşturmalısınız. `/auth/register` ile yeni bir kullanıcı oluşturup DB'de `role='admin'` yapın.

## Özellikler
- **Çalışan**: GPS'li giriş/çıkış, günlük/haftalık çalışma özeti, geç/fazla/eksik mesai rozetleri, geçmiş, izin talebi
- **Admin**: Zengin dashboard (KPI + 30 günlük grafik), çalışan CRUD, işyeri CRUD, izin onay/red, aylık rapor

## Tasarım
- Beyaz + kurumsal mavi (#2E5BFF) palet
- iOS-Native Clean personality
- Sabit vardiya (8 saat = 480 dakika) — çıkışta `overtime_minutes` / `missing_minutes` otomatik hesaplanır
- Geç kalma otomatik: workplace `start_time`'a göre `late_minutes` hesaplanır

## Bilinen sınırlamalar (Referans Backend uyumu)
- `POST /auth/register` sadece `{message, user_id}` döner — mobile app otomatik olarak sonrasında `POST /auth/login` çağırır
- `POST /auth/login` sadece `{access_token, token_type}` döner — sonrasında `GET /users/me` çağrılır
- `GET /workplaces/` **admin gerektirir** — çalışanlar bu endpoint'i çağıramaz
- Yeni kayıt olan çalışan otomatik olarak işyerine atanmaz — **admin manuel atamalıdır**
