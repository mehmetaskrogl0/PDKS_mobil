# Atlas PDKS v2 - Product Requirements Document

## Overview
Atlas PDKS is an enterprise-grade personnel attendance tracking (PDKS) mobile app: GPS-verified
check-in/out, late / overtime / missing-minute accounting, leave management, multi-workplace
support, and a rich admin console with monthly reports. Formal white + brand blue (#2E5BFF).

**Ref repo alignment**: v2 mirrors the feature-set of `eminyldz24/PDKS_PROJECT` (Phase 1 + 2):
name+surname split, `late/late_minutes/overtime_minutes/missing_minutes` on attendance,
Leave model with approve/reject workflow, multi-workplace with user assignment,
admin rich dashboard, and monthly reports API. Phase 3 (Excel export, system log UI) is deferred.

## Roles
- **employee** — self-register, punch in/out, submit leave, view own history + monthly summary.
- **admin** — full CRUD on users & workplaces, approves/rejects leaves, sees dashboard metrics + monthly reports.

## Backend API (`/api`)
- Auth: `POST /auth/register`, `POST /auth/login`
- Users: `GET /users/me`, `GET /users/`, `GET /users/{id}`, `POST /users/`,
  `PUT /users/{id}`, `DELETE /users/{id}`
- Workplaces: `GET /workplaces/`, `POST /workplaces/`, `GET|PUT|DELETE /workplaces/{id}`
- Attendance: `POST /attendance/check-in`, `POST /attendance/check-out`,
  `GET /attendance/my-attendance`, `GET /attendance/today-me`,
  `GET /attendance/all|today|active|user/{id}` (admin)
- Leave: `POST /leave/`, `GET /leave/my`, `GET /leave/all|pending`,
  `PUT /leave/{id}/approve|reject`
- Dashboard: `GET /dashboard/`, `GET /dashboard/admin`, `GET /dashboard/chart`
- Reports: `GET /reports/monthly/all?year=&month=`, `GET /reports/monthly/{user_id}?year=&month=`
- System logs: `GET /system-logs/`

## Attendance Business Logic
- `late` = check-in time > workplace `start_time`; `late_minutes` = delta in minutes
- Normal shift = **480 minutes (8h)**. At check-out:
  - `overtime_minutes` = max(worked - 480, 0)
  - `missing_minutes` = max(480 - worked, 0)
- Geofence via Haversine distance ≤ workplace `radius` (both check-in & check-out)

## Frontend Screens
### Employee (`/(tabs)`)
- **Ana Sayfa**: big GPS punch button, greeting card with approved/pending leave pills, GPS
  meters, warning banner, late banner (`Bugün X dk geç geldiniz`), stats (today/week/planned),
  Geç/Fazla/Eksik summary when shift closed, recent history rows with late-badge
- **Geçmiş**: total-minutes hero, Geç/Fazla/gün pills, per-row late/overtime/missing tags
- **İzin**: create leave (start_date, end_date, reason), status pills (Beklemede/Onaylandı/Reddedildi)
- **Profil**: hero avatar, assigned workplace, radius, shift start, logout

### Admin (`/(admin)`)
- **Panel**: 9 KPIs (Çalışan, Aktif, Geç, Bugün Giriş/Çıkış, Devamsız, Bekleyen/Onaylı/Red izin),
  Çalışma İstatistikleri card, 30-day mini bar chart, recent-check-in list with late badges
- **Çalışan**: employee list with workplace name + active pill; create/edit/delete via bottom
  sheet (name, surname, email, password, role, workplace chip picker)
- **İşyerleri**: workplace list with pills (radius, start_time); create/edit/delete
- **İzinler**: pending/all tabs; per-row Approve/Reject buttons
- **Rapor**: month navigator, per-employee monthly card with çalışma günü, izin, geç sayısı,
  geç/fazla/eksik dakika totals

## Stack
- **Frontend**: Expo SDK 54, expo-router file-based, expo-location, expo-secure-store, expo-haptics
- **Backend**: FastAPI + Motor + passlib[bcrypt] + python-jose (JWT), lifespan-seeded admin + default workplace
- **DB**: MongoDB `atlas_pdks` — collections: `users`, `workplaces`, `attendance`, `leaves`, `system_logs`

## Env (backend/.env)
- `MONGO_URL`, `DB_NAME`, `JWT_SECRET`, `JWT_ALGO`, `JWT_EXPIRE_MINUTES`
- `FIRST_ADMIN_EMAIL`, `FIRST_ADMIN_PASSWORD`, `FIRST_ADMIN_NAME`
- `WORKPLACE_NAME`, `WORKPLACE_LAT`, `WORKPLACE_LNG`, `WORKPLACE_RADIUS_M`, `SHIFT_START`, `SHIFT_END`

## Deferred to Phase 3
- Excel (.xlsx) monthly report export (openpyxl)
- Sistem logları için ayrı admin ekran (backend endpoint already exists)
- Chart page with per-workplace breakdown
