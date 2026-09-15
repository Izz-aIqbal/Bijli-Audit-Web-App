# Bijli Audit — AI-Powered Electricity Bill Auditor & Tariff Guard

Bijli Audit scans, audits, and explains MEPCO electricity bills. It cross-checks every charge against the live NEPRA slab schedule, guards your **Protected** (200-unit) status, and turns disputes into letters. *Understanding. Verify. Save.*

## Features

- **Interactive Audit Calculator** — flagship tool: enter units (or present/previous meter readings), pick your tariff category (protected / unprotected / commercial / industrial), phase, and FPA/QTA/GST/duty/surcharge. Watch the rules engine walk every slab and tax, then compare against your official bill and ask the mascot Math-Bot (grounded in the exact calculation).
- **AI & OCR extraction** — upload bill images (JPG, PNG, WEBP) or PDFs; EasyOCR + vision-LLM extract consumption, charges, and tariff data.
- **Meter Check / Camera** — compare an uploaded meter photo against the billed reading; capture straight from your mobile camera.
- **Protected Status Safety Gauge** — 6-month consumption trend vs the 200-unit ceiling.
- **Smart Load Planner** — estimated next bill and the units budget you must stay under.
- **MEPCO Knowledge & Office Hub** — 8 circle offices with addresses, helplines, and Google Maps links.
- **Dispute & PDF export** — branded audit report and an official dispute letter generator.
- **Interactive Dashboard & History Gallery** — charts, KPIs, single-bill detail, one-click ZIP backup of the whole audit store.

## Tech Stack

- **Frontend:** Next.js 16 (App Router, TypeScript, Turbopack), Tailwind CSS 4, Framer Motion, GSAP, Recharts, Three.js (react-three-fiber background).
- **Backend:** FastAPI (Python), EasyOCR + PyTorch, pydantic. Local runtime data uses SQLite; OpenRouter LLM for extraction + chat.
- **Deployment:** Frontend → Vercel. Backend runs wherever you host FastAPI (Render / Railway / VPS) — see below.

## Project Structure

```
├── bijli-audit-backend/   # FastAPI app (rules engine, OCR, tariff JSON, SQLite)
└── bijli-audit-web/       # Next.js frontend (Vercel root directory)
```

## Getting Started

1. **Backend** — `cd bijli-audit-backend`, create a venv, `pip install -r requirements.txt`, copy `.env.example` → `.env` and set `OPENROUTER_API_KEY`, then `python -m uvicorn main:app --reload` (port 8000).
2. **Frontend** — `cd bijli-audit-web`, `npm install`, then `npm run dev` (port 3000).
3. Open http://localhost:3000 (frontend talks to http://localhost:8000; override with `NEXT_PUBLIC_API_URL`).

### Local env variables

| Variable                  | Used by     | Default               |
| ------------------------- | ----------- | --------------------- |
| `OPENROUTER_API_KEY`      | backend     | —                     |
| `NEXT_PUBLIC_API_URL`     | frontend    | `http://localhost:8000` |

## Deployment on Vercel

1. Push this repo to GitHub.
2. In Vercel, **Import** the repo (or keep your existing linked project). `vercel.json` already sets the **Root Directory** to `bijli-audit-web` and the framework to Next.js.
3. (Recommended) Add `NEXT_PUBLIC_API_URL` under **Project → Settings → Environment Variables** pointing at your hosted backend.
4. Deploy. Note: the **backend is not Vercel-compatible** (SQLite + EasyOCR + PDF rendering). The frontend builds and renders on Vercel; OCR/chat/audit calls need the FastAPI backend to be reachable at `NEXT_PUBLIC_API_URL`. Host the backend on Render/Railway/a VPS and set CORS `allow_origins` accordingly.

## Verification

- Frontend: `npm run build`, `npx tsc --noEmit`, `npx eslint .` — all clean.
- Backend: `python -m uvicorn main:app` then `curl http://127.0.0.1:8000/api/v1/tariff`.