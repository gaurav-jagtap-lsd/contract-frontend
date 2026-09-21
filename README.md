# ContractVault — AI-Powered Contract Management

A production-grade contract management SaaS with Gemini AI extraction, Firebase backend, automated email reminders, and a modern Next.js frontend.

---

## Architecture

```
ContractVault/
├── backend/          # Django REST API (Python)
│   ├── apps/
│   │   ├── ai_extraction/    # Gemini AI PDF/image extraction
│   │   ├── contracts/        # Contract CRUD, pause, renew, snooze
│   │   ├── clients/          # Client management
│   │   ├── reminders/        # Email reminder logs + manual trigger
│   │   ├── authentication/   # Firebase Auth integration
│   │   └── audit/            # Audit log
│   └── core/
│       ├── firebase.py        # Firebase Admin SDK init
│       ├── firestore_utils.py # Firestore helpers
│       ├── storage_service.py # Firebase Storage upload/download
│       ├── email_service.py   # Brevo email sender
│       └── audit_service.py   # Audit log writer
│
└── frontend/         # Next.js 14 + TypeScript + Tailwind
    └── src/
        ├── app/
        │   ├── (app)/         # Authenticated app shell
        │   │   ├── dashboard/ # Stats cards + charts
        │   │   ├── contracts/ # Contract list + detail pages
        │   │   ├── upload/    # AI extraction upload flow
        │   │   ├── clients/   # Client management
        │   │   ├── reminders/ # Reminder history
        │   │   ├── audit/     # Audit log
        │   │   └── settings/  # Account settings
        │   ├── login/
        │   ├── register/
        │   └── forgot-password/
        ├── components/
        │   └── layout/        # Sidebar + TopBar
        ├── context/           # AuthContext (Firebase)
        ├── lib/               # api.ts, firebase.ts, utils.ts
        └── types/             # TypeScript interfaces
```

---

## Tech Stack

| Layer       | Technology |
|-------------|-----------|
| Frontend    | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Backend     | Django 5, Django REST Framework |
| Database    | Firebase Firestore |
| Storage     | Firebase Storage |
| Auth        | Firebase Authentication |
| AI          | Google Gemini 2.5 Flash |
| Email       | Brevo (Sendinblue) |
| Task Queue  | Celery + Redis |
| Charts      | Recharts |

---

## Setup

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Copy and fill in environment variables
cp .env.example .env

# Run Django
python manage.py runserver

# Run Celery worker (for email reminders)
celery -A core worker -l info

# Run Celery beat (for scheduled tasks)
celery -A core beat -l info
```

### 2. Frontend

```bash
cd frontend
npm install

# Copy and fill in environment variables
cp .env.local.example .env.local

# Fill in your Firebase web config values:
# NEXT_PUBLIC_FIREBASE_API_KEY
# NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
# NEXT_PUBLIC_FIREBASE_PROJECT_ID
# etc.

npm run dev
```

The app will be running at **http://localhost:3000**

---

## Environment Variables

### Backend (`backend/.env`)
```
DJANGO_SECRET_KEY=...
DEBUG=True
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY_ID=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_STORAGE_BUCKET=...
FIREBASE_WEB_API_KEY=...
GEMINI_API_KEY=...
BREVO_API_KEY=...
BREVO_SENDER_EMAIL=...
REDIS_URL=redis://localhost:6379/0
```

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

> **Note:** Get Firebase web config from Firebase Console → Project Settings → General → Your Apps → Web App.

---

## Key Workflows

### 1. Contract Upload + AI Extraction
1. User navigates to `/upload`
2. Drags & drops a PDF or image
3. File is uploaded to Firebase Storage
4. Gemini 2.5 Flash analyzes the document
5. Extracted fields shown in a review screen (editable)
6. User corrects any missing/wrong fields
7. Saved to Firestore — dashboard updates instantly

### 2. Automated Reminders
- Celery Beat runs `dispatch_reminders` daily at 08:00 UTC
- Contracts within 60 days of expiry get emails
- **31–60 days**: weekly reminders
- **1–30 days**: every 2 days
- **Post-expiry**: daily for 7 days, then stopped
- Per-contract and per-client pause/resume supported

### 3. Contract Status
Status is calculated automatically from `end_date`:
- `active` → more than 30 days remaining
- `expiring_soon` → 1–30 days remaining
- `expired` → past end date
- `paused` → manually paused
- `renewed` → new version created via renew API

---

## API Endpoints (Backend)

```
POST   /api/auth/register/
POST   /api/auth/login/
GET    /api/auth/me/
POST   /api/auth/logout/
POST   /api/auth/reset-password/

GET    /api/dashboard/summary/
GET    /api/dashboard/charts/
GET    /api/dashboard/calendar/

POST   /api/ai/extract/           # Upload + AI extraction
POST   /api/ai/re-extract/        # Re-run extraction

GET    /api/contracts/
POST   /api/contracts/
GET    /api/contracts/:id/
PATCH  /api/contracts/:id/
DELETE /api/contracts/:id/
POST   /api/contracts/:id/pause/
POST   /api/contracts/:id/resume/
POST   /api/contracts/:id/snooze/
POST   /api/contracts/:id/unsnooze/
POST   /api/contracts/:id/renew/
GET    /api/contracts/:id/versions/
GET    /api/contracts/:id/file-url/

GET    /api/clients/
POST   /api/clients/
GET    /api/clients/:id/
PATCH  /api/clients/:id/
DELETE /api/clients/:id/
POST   /api/clients/:id/pause/
POST   /api/clients/:id/resume/

GET    /api/reminders/
POST   /api/reminders/:id/send/

GET    /api/audit/
```

---

## Production Deployment Notes

1. Set `DEBUG=False` in backend `.env`
2. Use a proper `DJANGO_SECRET_KEY` (generate with `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`)
3. Configure `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` for your domain
4. Use a production Redis instance for Celery
5. Deploy frontend to Vercel: `vercel deploy`
6. Deploy backend to Railway, Render, or Google Cloud Run
7. Set up Firebase Security Rules for Firestore and Storage
8. Enable Firebase App Check for production API protection
