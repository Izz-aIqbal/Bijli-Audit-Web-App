# ⚡ Bijli Audit — AI-Powered Electricity Bill Auditor & Tariff Guard

**Understanding. Verify. Save.**

Bijli Audit scans, audits, and explains **MEPCO electricity bills**. It reads your bill (photo, mobile camera, or PDF), cross-checks **every single charge** against the live **NEPRA slab schedule**, guards your **Protected (200-unit)** status, and turns any overcharge into a ready-to-submit **dispute letter**.

> Why it exists: in Pakistan, a consumer crossing **200 units** gets their *entire* month re-rated at full (unsubsidised) price — a bill can jump 2–3× overnight. Most people can't verify their own bill. Bijli Audit does it for them, line by line, and explains the math.

---

## ✨ Features

### 1. Interactive Audit Calculator (flagship)
- Enter **units** or **present/previous meter readings** directly.
- Pick your **tariff category** — Protected / Unprotected / Commercial / Industrial — plus phase, FPA, QTA, GST, duty, and surcharge.
- Watch the rules engine walk **every slab and tax** with a live GSAP-animated total, per-slab bars, and a full itemized breakdown.
- Compare your **official bill amount** against the recomputed figure → instant "you're paying Rs X more/less" verdict.
- **Math-Bot**: an in-page AI panel that answers questions grounded in *your exact calculation* — never generic advice.

### 2. AI + OCR Bill Extraction
- Upload **JPG / PNG / WEBP / PDF** — or snap a **photo with your mobile camera**.
- **Tesseract OCR** (lightweight, free-tier friendly) reads the text → **gpt-4o-mini** (via OpenRouter) structures it into clean fields: consumer, reference number, units, slab, every charge line, due date.
- Robust PDF handling: extract the embedded page image first, render the page as a fallback.
- Every audit is **saved** to the history gallery with its stored bill image.

### 3. Tariff Verification Engine
- Recomputes your bill from the official NEPRA schedule and flags: wrong slab, missing/wrong **Protected subsidy**, miscalculated FPA/QTA/tax, or the **200-unit cliff**.
- **Deterministic guard rails** — e.g. the payable-amount picker skips date days like `17-AUG-26` so it never returns a false "17" instead of the real `1,128`.
- Verified against real MEPCO bills.

### 4. Meter Check / Camera
- Compare a **photo of your physical meter** against the billed reading → **Match / Mismatch / Inconclusive**. Catches inflated readings.

### 5. Protected Status Safety Gauge
- 6-month consumption trend chart vs the **200-unit ceiling**, so you always know your buffer.

### 6. Smart Load Planner
- Enter appliance usage (AC hours, fans, lights…) → estimated **next bill** and exactly **how many more units** you can use before losing Protected status. Export an estimate PDF.

### 7. MEPCO Knowledge & Office Hub
- How MEPCO bills and the Protected/Unprotected tariff work, plus **8 circle offices** (Multan, Vehari, Sahiwal, RYK, Bahawalpur, Muzaffargarh, D.G. Khan, Khanewal) with addresses, helplines, services, and Google Maps links.

### 8. Dispute & PDF Export
- **Branded audit report PDF** per bill, an official **dispute letter PDF** addressed to MEPCO, and a **one-click ZIP backup** of your entire audit store + chat log.

### 9. AI Mascot — "Bijli"
- An animated assistant that floats on every page (with a grooved "Ask Bijli" badge), answers bill questions in plain language, and **persists conversations** per household.

---

## 🧱 Tech Stack

### Frontend (`bijli-audit-web`)
| Technology | Role |
|---|---|
| **Next.js 16** (App Router, TypeScript, Turbopack) | Framework · Vercel-ready |
| **Tailwind CSS 4** | Styling |
| **Framer Motion** & **GSAP** | Animations (nav pill, page transitions, money counter) |
| **Recharts** | Dashboard consumption charts |
| **Three.js / react-three-fiber** | 3D landing background |
| **jsPDF / html2canvas / html2pdf** | Client-side PDF audit + dispute reports |

### Backend (`bijli-audit-backend`)
| Technology | Role |
|---|---|
| **FastAPI + Uvicorn** | Web API (docs at `/docs`) |
| **Tesseract OCR** + OpenCV / Pillow / NumPy | Lightweight bill & meter OCR |
| **PyMuPDF + pypdfium2** | PDF bill rendering |
| **SQLModel / SQLite** | Audits & chat history (`billrecord`, `chatmessage`) |
| **Rules Engine** (`rules_engine/calculator.py` + `tariff_mepco.json`) | NEPRA slab/tax/subsidy math, protected-cliff logic |
| **OpenRouter (`gpt-4o-mini`)** | Structured field extraction + Bijli chat |

### Deployment
| Piece | Role |
|---|---|
| **Vercel** | Frontend hosting (root dir `bijli-audit-web`) |
| **Railway** | Backend hosting — Docker image via `Dockerfile` + `railway.json` |
| **Tesseract in image** | Installed via `apt-get` in the Dockerfile (no PyTorch/EasyOCR → fits free tiers) |
| **CORS** | Allows the Vercel site to call the Railway API |
| **Env vars** | `OPENROUTER_API_KEY` (Railway) · `NEXT_PUBLIC_API_URL` (Vercel) |

---

## 📁 Project Structure

```
Bijli-Audit-Web-App/
├── vercel.json                    # Vercel root-directory config
├── bijli-audit-backend/           # FastAPI app
│   ├── main.py                    # API routes, OCR pipeline, CORS, MEPCO guard
│   ├── extract.py                 # LLM field extraction + total-amount rescue
│   ├── rules_engine/              # NEPRA calculator + tariff_mepco.json + verify_bill
│   ├── db.py / schema.py          # SQLite models (billrecord, chatmessage)
│   ├── Dockerfile                 # Railway build (python + tesseract-ocr)
│   ├── railway.json               # Railway service config
│   └── requirements.txt           # Pinned Python deps
└── bijli-audit-web/               # Next.js 16 frontend
    ├── app/                       # calculator, dashboard, history, planner,
    │                              # meter-check, mepco, dispute/[id], history/[id]
    ├── components/                # Navbar, Mascot, GsapCounter, Charts, Scene…
    └── lib/                       # apiBase, exportPdf, types
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js 22** (engines pinned in `package.json`)
- **Python 3.11–3.13**
- **Tesseract OCR** binary:
  - Windows: `winget install UB-Mannheim.TesseractOCR`
  - Linux: `sudo apt-get install -y tesseract-ocr`

### 1. Backend (port 8000)
```bash
cd bijli-audit-backend
python -m venv venv
venv\Scripts\activate                 # Windows   (`. venv/bin/activate` on Linux/Mac)
pip install -r requirements.txt
copy .env.example .env                # then paste your OPENROUTER_API_KEY
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend (port 3000)
```bash
cd bijli-audit-web
npm install
npm run dev
```

Open **http://localhost:3000** — the frontend auto-targets `http://localhost:8000` (override with a `.env.local` `NEXT_PUBLIC_API_URL`).

### Environment variables
| Variable | Used by | Default |
|---|---|---|
| `OPENROUTER_API_KEY` | backend | — (required for extraction + chat) |
| `CORS_ORIGINS` | backend | `http://localhost:3000` + live Vercel URL |
| `DATABASE_URL` | backend | `sqlite:///bijli_audit.db` (Railway: mounted volume) |
| `DATA_DIR` | backend | `media` |
| `NEXT_PUBLIC_API_URL` | frontend | `http://localhost:8000` |

---

## ☁️ Deployment

### Vercel (frontend)
1. Import the repo into Vercel. `vercel.json` already sets **Root Directory** → `bijli-audit-web` and framework → Next.js.
2. Add `NEXT_PUBLIC_API_URL` → your Railway URL under **Project → Settings → Environment Variables**.
3. Deploy — auto-rebuilds on every push to `main`.

### Railway (backend)
1. Create a Railway project from this repo, root directory → `bijli-audit-backend`.
2. Railway uses the **Dockerfile** (installs Tesseract + deps) and `railway.json`.
3. Add `OPENROUTER_API_KEY`.
4. The backend gets a public URL — put that in Vercel's `NEXT_PUBLIC_API_URL`.

> The backend is **not Vercel-compatible** (SQLite + Tesseract + PDF rendering need a persistent container) — that's why it lives on Railway.

---

## ✅ Verification

```bash
# Frontend
cd bijli-audit-web
npm run build        # 10 routes, all green
npx eslint .         # 0 errors

# Backend
cd bijli-audit-backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
curl http://127.0.0.1:8000/                  # {"message":"Bijli Audit backend is running"}
curl http://127.0.0.1:8000/api/v1/tariff     # NEPRA tariff JSON
# Docs: http://127.0.0.1:8000/docs
```

---

## 📌 Known Limitations
- OCR accuracy depends on photo quality — faint/glossy/stained bills may cause one or two fields to extraction at low confidence (the UI flags this rather than guessing).
- Tariff JSON must be refreshed each time NEPRA publishes new rates.
- Currently MEPCO-specific; other DISCOs need their own tariff file.

## 🔭 Roadmap
- Multi-DISCO support (LESCO, IESCO, FESCO, …)
- Urdu + voice-first interface
- WhatsApp/SMS alerts approaching the 200-unit limit
- Solar net-metering calculation
- E-dispute submission with status tracking

---

*Made with ⚡ for every household that deserves to know what they're paying for.*