# Zapto — Dharmapuri home services

Website and booking API for a combined team of 10 electricians and plumbers.

Current website: https://zapto-pi.vercel.app/

## Upload to GitHub

Create a GitHub repository, then upload the **contents of this folder** at the repository root. Include the hidden `.gitignore` and `.env.example` files. Do not upload `node_modules`, `.vercel`, real `.env` files or API keys.

Alternatively, from this folder:

```sh
git init
git add .
git commit -m "Add Zapto website and booking API"
git branch -M main
# Add your own GitHub repository URL, then push:
# git remote add origin YOUR_REPOSITORY_URL
# git push -u origin main
```

## Connect GitHub to Vercel

Open the existing **zapto** project in the **DAV_AI** Vercel account. Under **Settings → Git**, connect this GitHub repository. Keep the repository root as the root directory, Framework **Other**, Build Command `npm run build`, and Output Directory `public`. This reuses the current website instead of creating a second project. Future pushes can deploy through Vercel.

## Files

- `public/`: website HTML, CSS and JavaScript.
- `api/`: Vercel booking/configuration routes.
- `lib/`: booking validation, notifications and Postgres adapter.
- `scripts/build.mjs`: generates server-side assets and the authoritative service price catalogue from the frontend.
- `schema.sql`: request table for Neon Postgres.
- `.env.example`: required configuration names only; no credentials.
- `tests/booking.mjs`: mocked notification tests; sends no real messages.

## Local checks

Use Node.js 22 or newer:

```sh
npm ci
npm run build
npm test
```

For a visual-only preview, open `public/index.html`. API routes require the Vercel runtime. File previews cannot send email or SMS.

## Activate booking notifications

The integration code is present, but email  are **not active**. The form only enables online submission when server configuration is present and a visitor completes Turnstile.

1. Connect Neon Postgres to the Vercel project. Set its connection string as `DATABASE_URL` and run `schema.sql` once in the Neon SQL editor.
2. Set `RESEND_API_KEY` and `EMAIL_FROM` in Vercel environment settings. For initial testing to the Resend account owner email, use `Zapto <onboarding@resend.dev>`. For your own sender address, verify its domain in Resend first. Never use the placeholder `yourdomain.com`.
3. SMS is disabled for this release. Twilio configuration is not required.
4. Configure Cloudflare Turnstile for the live hostname. Set `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`.
5. Redeploy after environment changes, then submit one controlled test request and confirm actual email  receipt.

Owner email: **itsmedavidraj@gmail.com**. SMS is disabled. These are fixed server-side destinations, not supplied by visitors. Keep all provider keys and the database URL in Vercel environment settings, never GitHub or browser code.

## Current limits

Service prices are provisional Urban Company Bengaluru reference prices, not a verified Dharmapuri rate card. Requests require manual confirmation; there is no worker dispatch dashboard. Requests are saved before notification attempts, with status fields for each provider. Provider acceptance is not delivery confirmation. Failed or pending notifications require owner review in the database; there are no automatic retries or delivery webhooks. Define a customer-data retention policy before collecting real requests.

The website currently uses Vercel Hobby. Vercel requires an eligible commercial plan for business use; review current plan terms before operating the service.
