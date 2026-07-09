# TTIWSA KPI Dashboard 📊

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![React](https://img.shields.io/badge/React-18-blue?logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black?logo=vercel)
![Security](https://img.shields.io/badge/Security-A%2B_Observatory-brightgreen)

**TTIWSA KPI Dashboard** is a premium, real-time enterprise metrics dashboard designed specifically for monitoring TTI, FFG, and Garansi metrics across **Indihome** and **Indibiz** segments per Service Area. 

It provides rich visual analytics, drill-down data tables, and an integrated submission system for ticket evidence, all backed by a serverless Next.js architecture and a Google Apps Script (GAS) data layer.

---

## 🚀 Key Features

### 📈 Rich Visual Analytics
- **Dynamic KPI Cards:** Real-time metrics tracking compliance rates, total tickets, and sub-segment distributions.
- **Interactive Charts:** Powered by Recharts for visualizing symptom rankings, FFG breakdowns, and TTI performance across different regions (STO).
- **Drill-Down Capabilities:** Click deeply into metrics to view the raw ticket data that comprises them.

### 📝 Integrated Form Submissions
Fully integrated submission forms that proxy securely through the Next.js backend directly to Google Apps Script.
- **Update Penyebab Not Comply (`/submit/not-comply`)**
- **Submit PS/PI (`/submit/ps-pi`)**
- **Submit UNSPEC (`/submit/unspec`)**

### 🔐 Enterprise-Grade Security
The dashboard is fortified against modern web vulnerabilities, featuring an admin-only authorization layer for sensitive actions.
- **JWT Edge Authentication:** Uses the highly-optimized `jose` library to sign JSON Web Tokens, creating tamper-proof `HttpOnly` cookies.
- **Admin Evidence Review:** While anyone can submit tickets, only authenticated admins have the power to **Accept or Reject Evidence** directly from the dashboard tables.
- **Anti-Dictionary Attack (Rate Limiting):** The `/api/login` endpoint utilizes an in-memory IP rate limiter (5 failed attempts per 15 minutes) to completely defeat brute-force dictionary attacks.
- **Security by Obscurity:** `X-Powered-By` headers are stripped from the server configuration.
- **Strict Content Security Policy (CSP):** Fortified headers to pass strict security scanners like Mozilla Observatory, preventing XSS and clickjacking.

---

## 🛠️ Technology Stack

- **Framework:** [Next.js 14+](https://nextjs.org/) (App Router & Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Vanilla CSS (Glassmorphism & Micro-animations)
- **Icons:** Lucide React
- **Authentication:** `jose` (JWT)
- **Data Layer:** Google Apps Script (Google Sheets) via Next.js API Routes (Proxy)
- **Deployment:** Vercel (Edge Network)

---

## 📁 Repository Structure

```text
ttiwsa-dashboard-2026/
├── next.config.ts           # Next.js configuration (CSP, Headers, Settings)
├── src/
│   ├── app/
│   │   ├── (dashboard)/     # Main dashboard layout and pages
│   │   │   ├── submit/      # Submission form routes
│   │   │   │   ├── not-comply/
│   │   │   │   ├── ps-pi/
│   │   │   │   └── unspec/
│   │   ├── api/             # Next.js Backend API Routes (Serverless Functions)
│   │   │   ├── dashboard/   # Fetches & aggregates Google Sheet data
│   │   │   ├── login/       # JWT generation & Rate Limiting
│   │   │   ├── logout/      # Session destruction
│   │   │   └── submit/      # Form proxy & Admin Action validation
│   │   ├── globals.css      # Global styles, variables, and animations
│   │   └── layout.tsx       # Root layout including fonts and providers
│   ├── components/
│   │   ├── dashboard/       # Specialized analytics components (Charts, Tables, Forms)
│   │   ├── layout/          # Sidebar, Navbar, and LoginButton
│   │   └── ThemeProvider/   # Client-side state providers
│   └── lib/
│       ├── auth.tsx         # Authentication React Context
│       └── constants.ts     # Configuration URLs and system constants
└── .env.local               # Environment variables (Ignored in Git)
```

---

## 🔒 Environment Variables

To run this project locally or deploy it to Vercel, you must configure the following environment variables. Create a `.env.local` file in the root directory:

```env
# The target Google Apps Script Web App URL for fetching and submitting data
NEXT_PUBLIC_API_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
SUBMIT_ENDPOINT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec

# Admin Credentials for Evidence Review
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_super_secure_password

# 64-character high-entropy cryptographic hex string
# (Generate via: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=your_generated_hex_string
```

---

## 🔌 API Endpoints Reference

| Endpoint | Method | Security | Description |
|----------|--------|----------|-------------|
| `/api/dashboard` | `GET` | Open | Fetches and caches dashboard KPI metrics from GAS. |
| `/api/login` | `POST` | Open | Validates credentials, applies IP rate limits, and issues `HttpOnly` JWT cookie. |
| `/api/logout` | `POST` | Open | Immediately expires and destroys the JWT session cookie. |
| `/api/submit` | `POST` | **Mixed** | Proxies form data to GAS. **Requires Admin JWT** *only* if the payload contains the `REJECT/ACCEPT EVIDENCE` flag. Otherwise, open. |

---

## 💻 Getting Started (Local Development)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/1leuk/ttiwsa-dashboard-2026.git
   cd ttiwsa-dashboard-2026
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```
   *Note: Includes `jose` for lightweight edge-compatible JWTs.*

3. **Set up Environment Variables:**
   Copy `.env.local.example` to `.env.local` (or create it) and fill in your credentials.

4. **Start the development server (with Turbopack):**
   ```bash
   npm run dev
   ```

5. **View the Dashboard:**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Deployment (Vercel)

This application is meticulously optimized for **Vercel**. 

1. Push your code to GitHub.
2. Import the repository into your Vercel Dashboard.
3. In the Vercel project settings, navigate to **Environment Variables** and securely paste your `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `JWT_SECRET`, and API URLs.
4. Deploy!

### Vercel Edge Optimizations
- **API Routes:** The backend API routes run flawlessly as Vercel Serverless Functions.
- **Middleware Compatibility:** The authentication architecture deliberately uses `jose` instead of standard Node `jsonwebtoken` to ensure 100% compatibility with Vercel's Edge Network, allowing for sub-millisecond session verification without heavy Node.js core modules.

---
*Maintained with ❤️ for the TTIWSA Operations Team.*
