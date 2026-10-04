# SkillCert | Modern Online Test & Automatic Certificate Platform

A production-ready SaaS platform designed for professional organizations, educational academies, and enterprises to conduct standardized technical examinations, compute authoritative server-side scores, issue high-resolution cryptographically verifiable PDF certificates, and automatically dispatch certificates to candidates via transactional email.

---

## 🚀 Key Highlights & Architectural Flow

```
Candidate Registration (Name, Email, Org)
  ↓
Proctored Test Interface (Countdown Timer, Tab Visibility Tracking, Real-time Persistence)
  ↓
Final Submission
  ↓
Authoritative Server-Side Evaluation (Never exposes answers to client)
  ↓
Passing Threshold Check (Configurable, Default: ≥ 60%)
  ├─ PASSED ──→ Auto-generate PDF Certificate (pdf-lib + QR Code)
  │              ↓
  │              Store unique Certificate ID (e.g., CERT-2026-8F42K9)
  │              ↓
  │              Automated Email Dispatch (Resend API + PDF attachment)
  │              ↓
  │              Present Result Screen with Download, Live Preview & Public Verify URL
  │
  └─ FAILED ──→ Comprehensive Performance Review (Question Explanations, Retake Guidance)
```

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router, Server Actions & Edge-compatible API routes)
- **Language**: TypeScript (Strict typing)
- **Styling**: Tailwind CSS with custom Dark/Light theme system
- **Icons**: Lucide React
- **ORM / Database**: Prisma ORM with relational PostgreSQL schema + persistent embedded zero-friction JSON engine for immediate local execution
- **PDF Generation**: `pdf-lib` (Vector graphics, custom border flourishes, embedded signatures, tamper-evident layout)
- **QR Code Engine**: `qrcode` (Dynamic scannable verification URLs)
- **Email Service**: `resend` (Transactional email delivery with attached PDF & audit logging in `EmailLog`)
- **Validation**: `zod` (Input sanitization & type safety)
- **Celebration Effects**: `canvas-confetti`

---

## 🌟 Core Features

### 1. Landing Page
- High-impact headline: **Test. Prove. Get Certified.**
- Interactive assessment discovery card with syllabus breakdown (HTML5, CSS3, JavaScript ES6+, React, Git, HTTP/Web Fundamentals).
- Instant credential verification lookup widget.
- Responsive FAQ accordion and accredited institution footer.

### 2. Examination Experience
- Timed countdown timer (20 minutes default) with auto-submission upon expiry.
- Anti-cheating & proctoring precautions:
  - Browser tab visibility monitoring & warning alerts.
  - Page unload warning (`beforeunload`).
  - Real-time continuous progress persistence to the server.
- Interactive question palette with status color coding (Answered: Green, Unanswered: Gray, Marked for Review: Yellow, Current Question: Cyan ring).
- Submit confirmation modal displaying answered vs pending breakdown.

### 3. Server-Side Evaluation
- Strict authoritative calculation executed solely on the server.
- Evaluates: Total questions, Correct count, Incorrect count, Unanswered count, Total score, Percentage, and Pass/Fail status.
- Zero client-side leakage of correct answers or explanation keys before submission.

### 4. Automated Certificate Generation & Verification
- High-resolution A4 landscape certificate created as a downloadable PDF.
- Contains: Organization seal, Participant name, Test title, Evaluated score, Issue date, Unique Certificate ID (`CERT-YYYY-XXXXXX`), Authorized signatures, and verifiable QR code.
- Public `/verify` and `/verify/[certificateId]` routes allowing anyone to verify credential authenticity.

### 5. Email Automation
- Automatically sends congratulations email to candidates upon passing.
- Attached PDF certificate.
- Transactional delivery tracking and fallback simulation logging (`EmailLog` table).

### 6. Admin Management Dashboard (`/admin`)
- Secure authentication with 1-click Demo Admin option.
- Analytics cards: Total Tests, Candidates, Completed Exams, Certificates Issued, Pass Rate.
- Interactive performance charts: Score distribution bands, Pass/Fail ratios.
- Test management: Create, Edit, Toggle Publish, Delete.
- Question bank: Add Multiple Choice & True/False questions with custom marks and explanations.
- Candidate table: Filter results, search by candidate name or email, **Export as CSV**.
- Certificate management: View credentials, download PDFs, trigger email resends.
- Transactional email audit logs.

---

## 🔐 Demo Credentials

- **Admin Portal**: `/admin`
- **Email**: `admin@skillcert.org`
- **Password**: `admin123456`
*(Or click "1-Click Instant Demo Admin Login" on the login screen)*

---

## ⚡ Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/shardul-2007/Online-Test-And-Certification-Platform.git
cd Online-Test-And-Certification-Platform
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 📁 Project Structure

```
├── data/
│   └── certipulse_db.json         # Persistent database store
├── prisma/
│   └── schema.prisma              # PostgreSQL Prisma schema definition
├── src/
│   ├── app/
│   │   ├── admin/page.tsx         # Admin dashboard & analytics
│   │   ├── api/
│   │   │   ├── admin/             # Admin CRUD & CSV export APIs
│   │   │   ├── certificates/      # Certificate lookup, download & resend
│   │   │   ├── test/              # Registration, sync & server submit
│   │   │   └── tests/             # Published tests listing
│   │   ├── result/[attemptId]/    # Results & interactive certificate view
│   │   ├── test/[attemptId]/      # Proctored examination room
│   │   ├── verify/                # Public verification portal
│   │   ├── layout.tsx             # Theme provider & root layout
│   │   └── page.tsx               # Enterprise landing page
│   ├── components/
│   │   ├── Navbar.tsx             # Responsive header
│   │   ├── Footer.tsx             # Enterprise footer
│   │   ├── ThemeProvider.tsx      # Dark/light mode context
│   │   └── TestRegisterModal.tsx  # Candidate registration modal
│   └── lib/
│       ├── auth.ts                # Admin cookie-based sessions
│       ├── db.ts                  # Database abstraction layer
│       ├── email.ts               # Resend transactional email service
│       ├── pdf.ts                 # PDF certificate generator (pdf-lib)
│       ├── seed.ts                # Initial demo tests & questions
│       └── types.ts               # TypeScript data models
```

---

## 📄 License

MIT License. Designed and built with enterprise standards.
