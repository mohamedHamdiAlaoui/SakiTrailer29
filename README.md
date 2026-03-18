# SakiTrailer29

Vite + React + TypeScript showroom app with:

- searchable, filterable, sortable products
- product gallery and backend lead capture
- protected auth flows backed by the API + Firebase
- Google OAuth via Firebase + backend token verification
- admin CRUD backed by backend SQLite database
- lead and order management backed by backend SQLite database
- improved SEO metadata per route
- Netlify SPA redirects via `public/_redirects`

## Run

```bash
npm install
npm run dev
npm run build
```

Run `npm run dev:server` and `npm run dev` in separate terminals during local development.

## Admin Setup

Set `ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD` in `.env` before first run if you want the API to create an initial admin account automatically.

Regular users can create accounts from `/signup`.

## Storage

- Product catalog is stored in backend SQLite (`PRODUCTS_DB_PATH`).
- Leads and orders are stored in backend SQLite.
- Legacy browser auth data is cleared automatically when API sessions are restored.

## Environment

Copy `.env.example` to `.env` and provide Firebase values:

1. Firebase Web config (`VITE_FIREBASE_*`) from Firebase Console -> Project settings -> Your apps.
2. Firebase Admin service account credentials (`FIREBASE_*`) from Firebase Console -> Project settings -> Service accounts.
3. Optional but recommended: set `ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD` for initial admin access.
4. In Firebase Console -> Authentication -> Sign-in method, enable Google provider.
5. Add your dev domain (`http://localhost:5173`) to Firebase Authentication authorized domains.

See [.env.example](./.env.example).
