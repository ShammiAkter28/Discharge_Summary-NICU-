# Inpatient EMR • NICU / PICU Discharge Summary Module

A beginner-friendly, production-ready Electronic Medical Record (EMR) Discharge Summary application built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, and connected to an **Oracle Database 12c** via the modern, pure-JavaScript `oracledb` Thin Mode connection pool.

---

## 🔐 Authentication & Initial Credentials

The system includes a secure authentication module connected to the Oracle `USERS` table, protected by HTTP-only session cookies and Next.js route middleware.

### First User Credentials:
- **Username:** `admin`
- **Password:** `admin`

- **Login Page:** [http://localhost:3000/login](http://localhost:3000/login) (Features a 1-click **"Use First User (Admin)"** helper button).
- **Route Protection:** Protected clinical routes like `/discharge` require authentication and will automatically redirect unauthenticated visits to `/login`.
- **Sign Out:** Click the user badge (`👤 admin`) in the top right of the EMR dashboard to sign out.

---

## 🌟 Key Features

1. **Next.js 14 App Router & TypeScript**: Fast, type-safe full-stack architecture with server-side API routes and interactive client components.
2. **Oracle Database Connection Pool (`src/lib/oracle.ts`)**:
   - Pure-JavaScript **Thin Mode** (Zero instant-client or C-driver dependency required).
   - Global singleton pattern prevents pool exhaustion during Hot Module Replacement (HMR).
   - Automated connection lifecycle (connect $\to$ query $\to$ release).
3. **Safe Parameterized Queries (`src/app/api/discharge/route.ts`)**:
   - Prevents SQL Injection through Oracle bind variables (`:adm_no`, `:diagnosis`, etc.).
   - Utilizes atomic `MERGE INTO` (UPSERT) statements for record updates and insertions.
   - Real-time Oracle DB health check endpoint (`/api/discharge?action=health`).
4. **Clinical EMR Dashboard (`src/app/discharge/page.tsx`)**:
   - Clean, sectioned form for Patient Demographics, Inpatient Stay, Clinical Course, and Diagnoses.
   - Dynamic Medication Prescription Schedule (add, edit, delete drug schedules).
   - Live Oracle DB online/offline indicator.
   - Instant search & fetch from Oracle Database by Admission ID.
5. **Print-Friendly Clinical Document**:
   - One-click print preview designed to match hospital paper discharge summaries.
   - High-contrast clinical document layout with hospital letterhead, diagnosis blocks, Rx prescription table, danger signs alert, and physician signature lines.

---

## 📁 Project Structure

```text
nicu-discharge/
├── .env.local                 # Oracle connection credentials & pool settings
├── .env.example               # Template environment configuration
├── next.config.mjs            # Next.js configuration (externalizes oracledb)
├── package.json               # Dependencies and scripts
├── postcss.config.mjs         # PostCSS configuration for Tailwind CSS
├── tailwind.config.ts         # Tailwind CSS configuration with print media rules
├── tsconfig.json              # TypeScript compiler configuration
├── scripts/
│   └── test-db.js             # Standalone Oracle connectivity diagnostic script
└── src/
    ├── app/
    │   ├── globals.css        # Global styles & @media print styles
    │   ├── layout.tsx         # Root HTML layout & fonts
    │   ├── page.tsx           # Hospital EMR landing page
    │   ├── api/
    │   │   └── discharge/
    │   │       └── route.ts   # GET & POST API route with Oracle bind variables
    │   └── discharge/
    │       └── page.tsx       # Responsive React dashboard & print-friendly view
    ├── lib/
    │   └── oracle.ts          # Oracle connection pool & query executor
    └── types/
        └── discharge.ts       # TypeScript interfaces for discharge records & meds
```

---

## ⚙️ Oracle Database Configuration

The database configuration is stored in `.env.local`:

```env
ORACLE_USER=ATI_REGI
ORACLE_PASSWORD=ATI_REGI
ORACLE_HOST=192.168.0.246
ORACLE_PORT=1521
ORACLE_SERVICE_NAME=ORCL
ORACLE_CONNECT_STRING=192.168.0.246:1521/ORCL

# Connection Pool Tuning
ORACLE_POOL_MIN=1
ORACLE_POOL_MAX=10
ORACLE_POOL_INCREMENT=1
ORACLE_POOL_TIMEOUT=60
```

---

## 🚀 Getting Started

### 1. Test Oracle Connectivity
Run the standalone diagnostic test script:
```bash
npm run test:db
```

### 2. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) or navigate directly to [http://localhost:3000/discharge](http://localhost:3000/discharge).

### 3. Production Build & Start
```bash
npm run build
npm run start
```

---

## 🔒 Security: Understanding Parameterized Bind Variables

In `src/app/api/discharge/route.ts`, queries never interpolate raw user input:

```typescript
// ❌ INSECURE (Vulnerable to SQL Injection):
// const sql = `SELECT * FROM IP_NICUPICUDISCHARGE WHERE ADMISSION_NO = '${admissionId}'`;

// ✅ SECURE (Oracle Parameterized Bind Variable):
const sql = `
  SELECT * FROM IP_NICUPICUDISCHARGE 
  WHERE UPPER(ADMISSION_NO) = UPPER(:adm_no)
`;
const binds = { adm_no: admissionId.trim() };
const result = await executeOracleQuery(sql, binds);
```

---

## 🖨️ Printing & PDF Export

Press the **Print Summary** button or press `Ctrl + P` / `Cmd + P` in your browser. Unnecessary web UI navigation bars and buttons will be hidden automatically, formatting the summary into a hospital-ready document.
