# SecurePass — MERN Password Security Toolkit

A full-stack MERN application that lets authenticated users check whether a password has appeared in a known data breach (via the **Have I Been Pwned** API), generate strong new passwords, and review a privacy-preserving history of that activity — all without the password itself ever leaving the browser.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [How It Works](#how-it-works)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
  - [Backend](#backend-setup)
  - [Frontend](#frontend-setup)
- [Environment Variables](#environment-variables)
- [Running the App](#running-the-app)
- [API Reference](#api-reference)
- [Password Policy](#password-policy)
- [Security Highlights](#security-highlights)
- [Known Gaps & Things to Double-Check](#known-gaps--things-to-double-check)
- [License](#license)

## Overview

SecurePass has two moving parts:

1. **Backend (Express + MongoDB)** — handles user registration, login, password-reset requests, and issues JWTs. It also stores a lightweight activity **history** per account (never raw passwords).
2. **Frontend (React + Vite)** — a single-page app with a login/register screen (plus "forgot password") and a dashboard containing three tools: a **Password Leak Checker**, a **Password Generator**, and an **Account History** tab. The checker and generator both run entirely client-side and never send raw passwords anywhere.

## Features

- **User authentication** — register/login with hashed passwords and JWT-based sessions.
- **Forgot / reset password** — request a reset link by email; the link lets you set a new password within a 15-minute window. In local development without SMTP configured, the reset link is printed to the backend console instead of emailed, so the flow works out of the box.
- **Password leak checker** — checks a password against the Have I Been Pwned (HIBP) breach database using the k-anonymity model, so the full password never leaves the browser.
- **Password generator** — generates cryptographically random passwords with configurable length (8–32) and character sets, plus a live strength meter.
- **Account history** — a per-account, filterable timeline of past breach checks (breached? how many times?) and password generations (length, character options, strength). The history stores **metadata only** — it never records the passwords you checked or generated.
- **Clean, tabbed dashboard UI** for switching between the three tools.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, plain CSS, `crypto-js` |
| Backend | Node.js, Express, Mongoose (MongoDB) |
| Auth | `bcryptjs` (password hashing), `jsonwebtoken` (JWT) |
| Password reset email | `nodemailer` (falls back to console logging if SMTP isn't configured) |
| Breach data | Have I Been Pwned — Pwned Passwords `range` API |
| Randomness | Web Crypto API (`crypto.getRandomValues`) for password generation |

## How It Works

```
┌────────────┐   register / login / reset (JSON)   ┌──────────────┐       ┌───────────┐
│  React SPA │ ───────────────────────────────────▶ │  Express API │ ────▶ │  MongoDB  │
│   (Vite)   │ ◀─────────────────────────────────── │  (JWT auth)  │       │ Users +   │
└────────────┘         JWT + user info / history     └──────────────┘       │ History   │
       │                                                     │              └───────────┘
       │  password never leaves the browser —                │ reset email
       │  only a 5-character SHA-1 prefix is sent             ▼
       ▼                                              (nodemailer, or
┌─────────────────────────────┐                        console fallback
│ Have I Been Pwned Range API │                         in dev)
│ api.pwnedpasswords.com      │
└─────────────────────────────┘
```

**Auth flow:** `Auth.jsx` posts to `/api/auth/register` or `/api/auth/login`. On success, the backend returns a signed JWT, which the frontend stores in `localStorage` and attaches to the app's user state. `App.jsx` checks `localStorage` on load to keep the user logged in across refreshes.

**Forgot / reset password flow:** From the login screen, `ForgotPassword.jsx` posts an email to `/api/auth/forgot-password`. The backend always returns the same generic message (to avoid leaking which emails are registered), and — only if the email matches an account — generates a random token, stores its SHA-256 hash on the user document with a 15-minute expiry, and emails a link like `http://localhost:3000/reset-password?token=<rawToken>`. Opening that link routes to `ResetPassword.jsx` (handled in `App.jsx` without adding a router dependency), which posts the new password to `/api/auth/reset-password/:token`. The backend re-hashes the token to look up the matching user and expiry before allowing the change.

**Breach-checking flow (k-anonymity):** `PasswordChecker.jsx` hashes the entered password with SHA-1 using `crypto-js`, splits the hash into a 5-character prefix and the remaining suffix, and sends only the prefix to the HIBP range API. The API returns every suffix that shares that prefix along with breach counts; the app checks locally whether the full suffix is in that list. This means the backend and HIBP never see the actual password or its full hash. The outcome (breached or not, and the count) is then logged to `/api/history`.

**Generator flow:** `PasswordGenerator.jsx` builds a character set from the selected options (uppercase/lowercase/numbers/symbols) and fills it using `crypto.getRandomValues`, a cryptographically secure random source — not `Math.random`. Once generated, the length, the character options used, and the computed strength label are logged to `/api/history` — the generated password itself is never sent to the backend.

**History flow:** `History.jsx` fetches `/api/history` (JWT-protected) on mount, shows a filterable list (All / Checks / Generated), and offers a "Clear history" action that wipes the account's history via `DELETE /api/history`.

## Project Structure

```
backend/
├── config/
│   └── db.js                    # Mongoose connection to MongoDB
├── controllers/
│   ├── authController.js        # register/login/forgot-password/reset-password, bcrypt, JWT
│   └── historyController.js     # get/add/clear a user's activity history
├── middleware/
│   └── authMiddleware.js        # `protect` — verifies JWT (now used by history routes)
├── models/
│   ├── User.js                  # Mongoose User schema (+ reset-token fields)
│   └── History.js               # Activity history schema — metadata only, never passwords
├── routes/
│   ├── authRoutes.js            # POST /register, /login, /forgot-password, /reset-password/:token
│   └── historyRoutes.js         # GET/POST/DELETE /api/history (protected)
├── utils/
│   └── sendEmail.js             # nodemailer wrapper with a console-log dev fallback
├── .env.example                 # Documents every environment variable
├── package.json
└── server.js                    # Express app entry point

frontend/
├── index.html
├── package.json
├── vite.config.js                # dev server on port 3000
└── src/
    ├── App.jsx                   # top-level gate: Auth vs Dashboard vs ResetPassword
    ├── App.css
    ├── main.jsx                  # React root
    ├── utils/
    │   └── api.js                 # shared API_URL + history-logging helper
    └── components/
        ├── Auth.jsx                # login/register form (+ "Forgot password?" link)
        ├── Auth.css
        ├── ForgotPassword.jsx      # request a reset link by email
        ├── ResetPassword.jsx       # set a new password from the emailed link
        ├── Dashboard.jsx           # tabbed shell for the three tools
        ├── Dashboard.css
        ├── PasswordChecker.jsx     # HIBP k-anonymity breach check (+ history logging)
        ├── PasswordChecker.css
        ├── PasswordGenerator.jsx   # CSPRNG password generator + strength meter (+ history logging)
        ├── PasswordGenerator.css
        ├── History.jsx             # account activity timeline
        └── History.css
```

## Prerequisites

- Node.js 18+ and npm
- A MongoDB instance — either local (`mongod`) or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- (Optional) SMTP credentials for real password-reset emails — without them, reset links are printed to the backend console instead

## Setup

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/` (copy `.env.example` and fill in the values — see [Environment Variables](#environment-variables)), then start the server:

```bash
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000`.

## Environment Variables

Create `backend/.env` with the following (the variable names must match exactly what `config/db.js` and `authController.js` read — see `backend/.env.example` for a ready-to-copy template):

| Variable | Required | Description |
|---|---|---|
| `PORT` | No (defaults to 5000) | Port the Express server listens on |
| `MONGO_URI` | Yes | MongoDB connection string, e.g. `mongodb://localhost:27017/securepass` or an Atlas SRV URI |
| `JWT_SECRET` | Yes | Long random string used to sign/verify JWTs |
| `CLIENT_URL` | No (defaults to `http://localhost:3000`) | Used to build the link inside password-reset emails |
| `RESET_TOKEN_EXPIRES_MINUTES` | No (defaults to 15) | How long a password reset link stays valid |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` | No | SMTP credentials for sending real reset emails. If any of `EMAIL_HOST`/`EMAIL_USER`/`EMAIL_PASS` are missing, reset links are logged to the backend console instead — handy for local development |

The frontend has no `.env` — the API base URL (`http://localhost:5000/api`) is defined once in `src/utils/api.js`. Update that constant if you deploy the backend elsewhere.

## Running the App

1. Start MongoDB (local or confirm your Atlas cluster is reachable).
2. `cd backend && npm run dev` → API on `http://localhost:5000`.
3. `cd frontend && npm run dev` → app on `http://localhost:3000`.
4. Register an account, log in, and use the **Password Leak Checker**, **Password Generator**, and **History** tabs.
5. To try "forgot password": click it on the login screen, submit your email, then check the backend console for the reset link (unless you've configured real SMTP credentials).

## API Reference

Base URL: `http://localhost:5000/api`

### `POST /auth/register`

Registers a new user.

**Body:**
```json
{ "username": "alice", "email": "alice@example.com", "password": "StrongP@ss1" }
```

**Responses:**
- `201` — `{ "message": "User registered successfully" }`
- `400` — user already exists, or password fails the [policy](#password-policy)
- `500` — server error

### `POST /auth/login`

Logs in with either email or username.

**Body:**
```json
{ "identifier": "alice@example.com", "password": "StrongP@ss1" }
```

**Responses:**
- `200` — `{ "_id", "username", "email", "token" }`
- `401` — invalid credentials
- `500` — server error

### `POST /auth/forgot-password`

Requests a password-reset email. Always returns the same generic response, whether or not the email is registered, to avoid leaking account existence.

**Body:**
```json
{ "email": "alice@example.com" }
```

**Responses:**
- `200` — `{ "message": "If an account with that email exists, a password reset link has been sent." }`
- `400` — email missing from the request body
- `500` — server error

### `POST /auth/reset-password/:token`

Sets a new password using the raw token from the emailed reset link.

**Body:**
```json
{ "password": "NewStrongP@ss1" }
```

**Responses:**
- `200` — `{ "message": "Password reset successful. You can now log in." }`
- `400` — token invalid/expired, password missing, or password fails the [policy](#password-policy)
- `500` — server error

### `GET /history` *(requires `Authorization: Bearer <token>`)*

Returns the logged-in user's activity history, newest first (capped at the most recent 100 entries).

**Response `200`:**
```json
[
  { "_id": "...", "action": "breach_check", "breached": true, "breachCount": 42, "createdAt": "..." },
  { "_id": "...", "action": "password_generated", "length": 16, "options": { "uppercase": true, "lowercase": true, "numbers": true, "symbols": true }, "strength": "Strong", "createdAt": "..." }
]
```

### `POST /history` *(requires `Authorization: Bearer <token>`)*

Logs a single activity event. Called automatically by the checker and generator — you generally won't need to call this directly.

**Body (breach check):**
```json
{ "action": "breach_check", "breached": true, "breachCount": 42 }
```

**Body (password generation):**
```json
{ "action": "password_generated", "length": 16, "options": { "uppercase": true, "lowercase": true, "numbers": true, "symbols": true }, "strength": "Strong" }
```

### `DELETE /history` *(requires `Authorization: Bearer <token>`)*

Deletes all of the logged-in user's history entries.

**Response `200`:** `{ "message": "History cleared" }`

### `GET /`

Health check — returns the plain-text string confirming the API is running.

## Password Policy

Enforced server-side in `authController.js` at registration **and** at password reset:

- At least 8 characters
- At least one lowercase letter
- At least one uppercase letter
- At least one digit
- At least one special character from `@$!%*?&`

## Security Highlights

- Passwords are hashed with **bcrypt** (salt rounds = 10) before being stored — plaintext passwords are never saved.
- JWTs are signed with `JWT_SECRET` and expire after **30 days**.
- Breach checking uses HIBP's **k-anonymity range API** — only a 5-character SHA-1 prefix is transmitted, never the password or full hash.
- The password generator uses `crypto.getRandomValues` (a CSPRNG), avoiding the predictability of `Math.random`.
- **Password reset tokens are never stored in plaintext** — only a SHA-256 hash of the token is saved, with a short (15-minute, configurable) expiry.
- The forgot-password endpoint returns an **identical response** regardless of whether the email is registered, to prevent account enumeration.
- **Activity history stores metadata only** — whether a checked password was breached (and how many times), or the length/options/strength of a generated password. The actual passwords are never sent to or stored on the server, consistent with the rest of the app.

## Known Gaps & Things to Double-Check

- **JWT is stored in `localStorage`** on the frontend, which is simple but vulnerable to XSS. An httpOnly cookie is a more hardened option if this goes to production.
- **CORS is wide open** (`app.use(cors())` with no origin restriction) — fine for local development, but worth locking down to a specific origin before deploying.
- **The frontend doesn't mirror the backend's password-strength regex** on the register form — `Auth.jsx` only enforces `required` on the field, so a weak password is only caught after submitting to `/register`. The reset-password form does show the requirement as hint text, but likewise relies on the backend for enforcement.
- **Password reset emails require SMTP to actually be delivered.** Without `EMAIL_HOST`/`EMAIL_USER`/`EMAIL_PASS` set, the reset link is only printed to the backend console — fine for development, but you'll need real SMTP credentials (or a transactional email provider) before deploying.
- **Resetting a password doesn't invalidate existing JWTs.** Any session token issued before a reset stays valid until its 30-day expiry. If you need "reset password logs out other devices" behavior, that would require tracking a token version/issued-at cutoff per user.
- **History is capped at the 100 most recent entries** per account (`HISTORY_LIMIT` in `historyController.js`) and has no pagination yet — fine for a personal tool, but worth revisiting if usage grows.

## License

MIT
