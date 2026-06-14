# AMC Dashboard — Client Domain & AMC Management

A production-ready SaaS dashboard for agencies to manage clients, domains, and Annual Maintenance Contracts with automated email reminders.

---

## ✨ Features

| Module | Capabilities |
|--------|-------------|
| **Clients** | Full CRUD, linked domains/AMCs, activity timeline |
| **Domains** | WHOIS auto-fetch, expiry tracking, status alerts |
| **AMC Contracts** | Renewal tracking, 6 contract types, revenue reports |
| **Email Automation** | 30/15/7/0-day reminders, SendGrid + SMTP fallback |
| **Dashboard** | KPI cards, revenue charts, expiry alert widget |
| **Calendar** | Monthly view with domain + AMC expiry events |
| **Reports** | CSV exports for clients/domains/AMCs, revenue pie chart |
| **Settings** | User management, system config, notification toggles |
| **Dark Mode** | Full light/dark theme |
| **Roles** | Admin (full access) + Manager (no settings/users) |

---

## 🚀 Quick Start

### Option A — Automated Setup

```bash
git clone <repo> && cd amc-dashboard
bash scripts/setup.sh
```

The script installs deps, generates secrets, creates the database, runs migrations, and seeds the admin user.

### Option B — Manual Setup

**1. Install dependencies**
```bash
npm install --legacy-peer-deps
```

**2. Configure environment**
```bash
cp .env.example .env.local
# Edit .env.local — at minimum set DATABASE_URL, NEXTAUTH_SECRET, JWT_SECRET, CRON_SECRET
```

**3. Set up database**
```bash
createdb amc_dashboard
npx prisma generate
npx prisma migrate dev --name init
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
```

**4. Start dev server**
```bash
npm run dev
# → http://localhost:3000
```

**Default login:** `hello@formium.in` / `admin123`
> ⚠️ Change the password immediately after first login via Settings → User Management.

---

## 🐳 Docker Deployment (Hostinger VPS)

**1. Create `.env.production`**
```env
POSTGRES_USER=amc_user
POSTGRES_PASSWORD=your-strong-password

DATABASE_URL=postgresql://amc_user:your-strong-password@postgres:5432/amc_dashboard
NEXTAUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=https://yourdomain.com
JWT_SECRET=<openssl rand -base64 32>
CRON_SECRET=<openssl rand -hex 20>

SENDGRID_API_KEY=SG.xxxxxxxxx
SENDGRID_FROM_EMAIL=hello@formium.in
SENDGRID_FROM_NAME=Formium Agency

WHOIS_API_KEY=your-whoisxml-api-key
```

**2. Deploy**
```bash
# On your VPS
git clone <repo> && cd amc-dashboard
docker compose --env-file .env.production up -d --build

# First-time: run migrations + seed
docker compose exec app npx prisma migrate deploy
docker compose exec app npx ts-node prisma/seed.ts
```

**3. Nginx Reverse Proxy**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Then: `sudo certbot --nginx -d yourdomain.com`

The Docker Compose file includes a **cron container** that automatically fires the automation endpoint at 8:00 AM daily.

---

## 📂 Project Structure

```
amc-dashboard/
├── app/
│   ├── api/
│   │   ├── auth/          # login, logout, me
│   │   ├── clients/       # CRUD + [id]
│   │   ├── domains/       # CRUD + [id]
│   │   ├── amc/           # CRUD + [id] (with renew action)
│   │   ├── dashboard/     # KPIs, alerts, charts
│   │   ├── email-logs/    # Email history
│   │   ├── reports/       # CSV exports
│   │   ├── settings/      # system + notifications
│   │   ├── users/         # Admin CRUD + [id]
│   │   ├── whois/         # WHOIS lookup
│   │   └── cron/          # Automation trigger
│   ├── dashboard/
│   │   ├── page.tsx           # Dashboard home
│   │   ├── clients/           # List + [id] detail
│   │   ├── domains/           # Domain management
│   │   ├── amc/               # AMC contracts
│   │   ├── calendar/          # Calendar view
│   │   ├── email-logs/        # Log viewer
│   │   ├── reports/           # Charts + exports
│   │   └── settings/          # Settings panel
│   └── login/             # Auth page
├── components/
│   ├── layout/            # Sidebar, Topbar
│   └── ui/                # Button, Modal, Table, Card, etc.
├── contexts/              # AuthContext (JWT + localStorage)
├── hooks/                 # useApi (token injection)
├── lib/
│   ├── auth.ts            # JWT sign/verify, bcrypt
│   ├── email.ts           # SendGrid + SMTP + HTML templates
│   ├── prisma.ts          # Prisma singleton
│   ├── utils.ts           # cn, formatDate, formatCurrency, CSV
│   └── whois.ts           # WhoisXML API client
├── middleware.ts           # Auth guard + admin role protection
├── prisma/
│   ├── schema.prisma       # Full schema (8 models)
│   ├── seed.ts             # Admin user + sample data
│   └── migrations/        # SQL migrations
├── scripts/
│   ├── setup.sh           # One-command local setup
│   └── cron.js            # Standalone cron runner
├── docker-compose.yml
├── Dockerfile
└── .env.example
```

---

## 🔌 API Reference

All endpoints except `/api/auth/login` require `Authorization: Bearer <token>` header (or `auth_token` cookie).

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | `{ email, password }` → `{ user, token }` |
| POST | `/api/auth/logout` | Clear session cookie |
| GET | `/api/auth/me` | Current authenticated user |

### Clients
| Method | Path | Params |
|--------|------|--------|
| GET | `/api/clients` | `?search=&page=&limit=` |
| POST | `/api/clients` | `{ name, companyName, email, phone, notes }` |
| GET | `/api/clients/[id]` | Includes domains, AMCs, activity |
| PUT | `/api/clients/[id]` | Partial update |
| DELETE | `/api/clients/[id]` | Cascade deletes domains + AMCs |

### Domains
| Method | Path | Params |
|--------|------|--------|
| GET | `/api/domains` | `?search=&status=&clientId=&page=` |
| POST | `/api/domains` | `{ clientId, domainName, expiryDate, ... }` |
| PUT | `/api/domains/[id]` | Partial update, auto-recalculates status |
| DELETE | `/api/domains/[id]` | — |

### AMC Contracts
| Method | Path | Params |
|--------|------|--------|
| GET | `/api/amc` | `?search=&status=&paymentStatus=&clientId=` |
| POST | `/api/amc` | `{ clientId, amcType, startDate, expiryDate, amount, ... }` |
| PUT | `/api/amc/[id]` | Update OR `{ action: 'renew', expiryDate, ... }` |
| DELETE | `/api/amc/[id]` | — |

### Utilities
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dashboard` | KPIs + alerts + chart data |
| GET | `/api/whois?domain=example.com` | WHOIS auto-fill |
| GET | `/api/reports?type=clients\|domains\|amc` | Download CSV |
| GET | `/api/email-logs` | `?status=SENT\|FAILED&page=` |
| POST | `/api/cron` | Run automation (requires `CRON_SECRET`) |

### Settings (Admin only)
| Method | Path |
|--------|------|
| GET/POST | `/api/settings/system` |
| GET/PUT | `/api/settings/notifications` |
| GET/POST | `/api/users` |
| PUT/DELETE | `/api/users/[id]` |

---

## ⚙️ Email Automation

The cron engine (`/api/cron`) runs daily and:

1. Finds all domains/AMCs with expiry within 30, 15, 7, or 0 days
2. Checks `EmailLog` to avoid duplicate sends on the same day
3. Sends branded HTML emails to admin + any additional emails + client email
4. Updates domain/AMC status (`ACTIVE → EXPIRING_SOON → EXPIRED`)
5. Logs every send attempt with status and any error message

### Trigger Options

**Docker (auto — included in docker-compose.yml)**
Runs at 8:00 AM daily, no setup needed.

**External HTTP**
```bash
curl -X POST https://yourdomain.com/api/cron \
  -H "Authorization: Bearer $CRON_SECRET"
```

**Standalone script**
```bash
CRON_SECRET=your-secret NEXT_PUBLIC_APP_URL=https://yourdomain.com \
  node scripts/cron.js
```

---

## 🔐 Security

- Passwords hashed with **bcrypt** (12 rounds)
- **JWT** tokens with 7-day expiry, stored as httpOnly cookies
- **Role-based** middleware on all API routes (enforced server-side)
- Admin routes protected at middleware level (`/api/users`, `/api/settings`)
- Cron endpoint protected by `CRON_SECRET` bearer token
- No sensitive data in client-side localStorage (only the JWT)

---

## 🗄️ Database Schema

```
User ──────────────────────────────────
  id, name, email, password, role, isActive

Client ─────────────────────────────────
  id, name, companyName, email, phone, notes
  → domains[]      (cascade delete)
  → amcContracts[] (cascade delete)
  → activities[]   (cascade delete)

Domain ─────────────────────────────────
  id, clientId, domainName, registrar,
  purchaseDate, creationDate, expiryDate,
  autoRenew, domainCost, loginUrl, status

AmcContract ────────────────────────────
  id, clientId, amcType, customType,
  startDate, expiryDate, amount,
  paymentStatus, status

EmailLog ───────────────────────────────
  id, emailType, status, recipient,
  subject, domainId?, amcContractId?,
  errorMessage, sentAt

ActivityLog ────────────────────────────
  id, clientId, activityType, description

Settings / NotificationConfig
  key-value system settings + notification prefs
```

---

## 🔮 Future-Ready

The architecture is prepared for:

- **Client Portal** — Add a `/portal` route group with separate auth; clients already linked via `clientId`
- **WhatsApp Notifications** — Extend `lib/email.ts` with a WhatsApp API adapter
- **Razorpay/Stripe** — AMC renewal flow already has `paymentStatus`; add webhook endpoint
- **More Roles** — Extend the `Role` enum in `prisma/schema.prisma`

---

## 📦 Tech Stack

| | |
|-|-|
| Framework | Next.js 15 App Router |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + dark mode |
| Database | PostgreSQL 16 |
| ORM | Prisma |
| Auth | JWT + bcrypt |
| Email | SendGrid API + Nodemailer SMTP fallback |
| Charts | Recharts |
| Icons | Lucide React |
| Deployment | Docker + Hostinger VPS |

---

© 2025 Formium Agency
