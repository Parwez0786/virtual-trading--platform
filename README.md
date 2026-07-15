# Virtual Trading Platform

Web app for practicing stock trading with virtual money and live market data. Users can register, manage a portfolio, buy/sell stocks, use a watchlist, and place auto buy/sell orders.

**Repository:** [Parwez0786/virtual-trading--platform](https://github.com/Parwez0786/virtual-trading--platform)

![Node.js](https://img.shields.io/badge/node.js-v20%20recommended-green)
![Express](https://img.shields.io/badge/express-4.x-lightgrey)
![MySQL](https://img.shields.io/badge/database-MySQL-blue)
![License](https://img.shields.io/badge/license-ISC-blue.svg)

## Features

- Email-based registration with confirmation link (Gmail SMTP)
- Sign-in with ID/password (JWT cookie session)
- Optional Google / GitHub / Facebook OAuth (Passport)
- Virtual buy & sell with live prices (RapidAPI / Yahoo Finance)
- Portfolio, wishlist, reviews, and transaction history
- Auto-buy and auto-sell jobs on a configurable interval
- Centralized config/messages in `src/constants/enums.js`
- Layered layout: routes → controllers → services → jobs

## Tech stack

| Layer | Technology |
|--------|------------|
| Runtime | Node.js (use **v20**; newer majors can break older JWT deps) |
| Server | Express |
| Views | Handlebars (`.hbs`) |
| Database | MySQL (`mysql2`) |
| Auth | JWT, CryptoJS, Passport (Google / GitHub / Facebook) |
| Email | Nodemailer (Gmail App Password) |
| Market data | RapidAPI latest-stock-price, Yahoo Finance, Alpha Vantage |

## Prerequisites

- Node.js **20.x** (Homebrew: `brew install node@20`)
- MySQL running locally
- npm
- Gmail account with [App Password](https://myaccount.google.com/apppasswords) for signup email (2-Step Verification required)

## Setup

### 1. Clone and install

```bash
git clone https://github.com/Parwez0786/virtual-trading--platform.git
cd virtual-trading--platform
npm install
```

### 2. Environment

```bash
cp .env.example .env
```

Edit `.env` with your values. Important keys:

| Variable | Purpose |
|----------|---------|
| `PORT` | Server port (default `3000`) |
| `APP_HOST` | Public base URL for email links (default `http://localhost`) |
| `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | MySQL connection |
| `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Gmail SMTP for registration / password reset |
| `JWT_SECRET`, `CRYPTO_SECRET`, `SESSION_SECRET` | Auth & session secrets |
| `RAPIDAPI_KEY` | Live NSE-style prices (optional but needed for market features) |
| OAuth client IDs/secrets | Optional social login |

`.env` is gitignored — never commit real secrets.

### 3. Database

Create the database (name should match `DB_NAME`, default `software_engg`):

```sql
CREATE DATABASE software_engg;
```

Required tables include at least:

- `stockuser` — users (username PK, name, email, mobNo, dob, amount, password, profit, loss)
- `userStocks`, `wishlist`, `autoBuy`, `autoSell`
- `stocks`, `transactionHistory`, `reviews` (as used by features)

Example `stockuser` shape:

```sql
CREATE TABLE IF NOT EXISTS stockuser (
  username VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  mobNo VARCHAR(50),
  dob VARCHAR(50),
  amount DOUBLE DEFAULT 0,
  password VARCHAR(255),
  profit DOUBLE DEFAULT 0,
  loss DOUBLE DEFAULT 0
);
```

Adjust other tables to match how the routers insert/select data.

### 4. Run

Prefer Node 20 on the PATH:

```bash
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"   # macOS Homebrew example
npm start
```

`npm start` runs `nodemon src/server.js`.

Open:

- App: [http://localhost:3000](http://localhost:3000)
- Login / signup: [http://localhost:3000/api/loginauth/login](http://localhost:3000/api/loginauth/login)

## Project structure

```
├── .env.example          # Env template (committed)
├── package.json
├── public/               # Static assets
├── templates/
│   ├── views/            # Handlebars pages
│   └── partials/
└── src/
    ├── server.js         # Entry: load env, listen, start jobs
    ├── app.js            # Express app factory
    ├── auth.js           # Passport strategies
    ├── config/           # Env loading
    ├── constants/        # Enums & shared config helpers
    ├── controllers/      # Login, register, password flows
    ├── middleware/       # JWT verify, logged-in checks
    ├── services/         # DB, mail, stock prices, user ops
    ├── jobs/             # Auto buy / sell workers
    ├── routes/           # Top-level route registration
    ├── router/           # Feature routers (API mounts)
    ├── database/         # MySQL connection
    ├── mailer/           # Nodemailer transport
    └── utils/            # Crypto, logger helpers
```

## Main routes

| Path | Description |
|------|-------------|
| `/api/loginauth/login` | Sign in / sign up UI |
| `/api/registerauth/register` | Start email registration |
| `/api/auth/forget-password` | Password reset email |
| `/api/showUserStocks/stockHome` | Trading home (after login) |
| `/api/sell/...` | Sell & auto-order forms |
| `/api/profileauth/...` | Profile, history, auto orders |
| `/auth/google` (etc.) | OAuth (if credentials set) |

## Development notes

- Use **Node 20**. Node 22+ may fail on older `jsonwebtoken` / `buffer-equal-constant-time` stacks.
- Signup sends a confirmation email; links use `APP_HOST` + `PORT`.
- Sign in uses **ID** (`username`), not email.
- UI flash errors are shown on the login page (including SweetAlert); avoid relying on server `console` for user-facing errors.
- Auto-trade interval: `AUTO_TRADE_INTERVAL_MS` (default `1500`).

## License

ISC

## Author

parwez — [GitHub](https://github.com/Parwez0786)
