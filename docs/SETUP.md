# GreenRoots Backend Setup & Deployment Guide

This guide describes how to deploy the GreenRoots Supabase backend and connect the React frontend.

---

## 1. Prerequisites

- **Node.js 18+** & **npm**
- **Supabase CLI**:
  ```bash
  npm install -g supabase
  ```
- **Supabase Account**: [https://supabase.com](https://supabase.com) (free tier is sufficient)
- **PayPal Developer Account**: [https://developer.paypal.com](https://developer.paypal.com) (Sandbox)
- **Gemini API Key**: [https://aistudio.google.com](https://aistudio.google.com)

---

## 2. Supabase Cloud Project Setup

### Step 2.1: Create Project & Link CLI
1. Create a new project in the Supabase Dashboard named `greenroots`. Note the **Project Ref** (e.g. `xyzabcdefghijklm`).
2. In your terminal at the project root (`GreenRoots/`):
   ```bash
   supabase login
   supabase link --project-ref <YOUR_PROJECT_REF>
   ```

### Step 2.2: Apply Database Migrations
Run the 7 version-controlled SQL migrations:
```bash
supabase db push
```
This enables `postgis`, `pg_net`, `pg_cron`, creates all 22 tables, security triggers, axial hex math, RLS policies, and scheduled jobs.

### Step 2.3: Seed Data
Apply the seed data script:
```bash
# Apply initial tables, demo accounts, sample pools and listings:
supabase db execute --file supabase/seed/seed.sql
```

To create the corresponding Supabase Auth accounts (with test phone numbers and passwords):
```bash
deno run --allow-net --allow-env supabase/seed/seed.ts
```

---

## 3. Configure Supabase Secrets

Set the server-side environment secrets required by Edge Functions:
```bash
supabase secrets set \
  PAYPAL_API_BASE="https://api-m.sandbox.paypal.com" \
  PAYPAL_CLIENT_ID="<YOUR_PAYPAL_SANDBOX_CLIENT_ID>" \
  PAYPAL_CLIENT_SECRET="<YOUR_PAYPAL_SANDBOX_SECRET>" \
  PAYPAL_WEBHOOK_ID="<YOUR_PAYPAL_WEBHOOK_ID>" \
  GEMINI_API_KEY="<YOUR_GEMINI_API_KEY>" \
  CRON_SECRET="greenroots-cron-secret-2026"
```

---

## 4. Deploy Supabase Edge Functions

Deploy all edge functions to your Supabase project:
```bash
supabase functions deploy auth --no-verify-jwt
supabase functions deploy ai --no-verify-jwt
supabase functions deploy ai-assistant --no-verify-jwt
supabase functions deploy listings --no-verify-jwt
supabase functions deploy requirements --no-verify-jwt
supabase functions deploy pools --no-verify-jwt
supabase functions deploy orders --no-verify-jwt
supabase functions deploy payments --no-verify-jwt
supabase functions deploy paypal-create-order --no-verify-jwt
supabase functions deploy paypal-capture-order --no-verify-jwt
supabase functions deploy paypal-order-status --no-verify-jwt
supabase functions deploy paypal-webhook --no-verify-jwt
supabase functions deploy payouts --no-verify-jwt
supabase functions deploy collection-points --no-verify-jwt
supabase functions deploy forecast --no-verify-jwt
supabase functions deploy forecasts --no-verify-jwt
supabase functions deploy moderation --no-verify-jwt
supabase functions deploy admin --no-verify-jwt
supabase functions deploy audit --no-verify-jwt
supabase functions deploy notifications --no-verify-jwt
supabase functions deploy matching --no-verify-jwt
supabase functions deploy cron-dispatch --no-verify-jwt
```

---

## 5. PayPal Sandbox Webhook Setup

1. Go to your **PayPal Developer Dashboard** → Apps & Credentials → Select your REST app.
2. Under **Webhooks**, click **Add Webhook**.
3. Set Webhook URL:
   ```
   https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/paypal-webhook
   ```
4. Subscribe to the following events:
   - `Payment capture completed` (`PAYMENT.CAPTURE.COMPLETED`)
   - `Checkout order approved` (`CHECKOUT.ORDER.APPROVED`)
5. Copy the generated **Webhook ID** and set it in Supabase secrets:
   ```bash
   supabase secrets set PAYPAL_WEBHOOK_ID="<COPIED_WEBHOOK_ID>"
   ```

---

## 6. Switch Frontend from Mock to Real Backend

In `GreenRoots/.env`:
```env
# Set to false to switch from in-memory mocks to Supabase Edge Functions
VITE_USE_MOCKS=false

# Your Supabase Project URL and Anon Public Key:
VITE_SUPABASE_URL=https://<YOUR_PROJECT_REF>.supabase.co
VITE_SUPABASE_ANON_KEY=<YOUR_SUPABASE_ANON_KEY>
```

Start the Vite development server:
```bash
npm run dev
```

---

## 7. Demo Accounts for Evaluation

| Role | Name | Identifier | Credentials | Experience |
|---|---|---|---|---|
| **Farmer** | Ramesh Yadav | `9812345670` | OTP: `123456` | List residue, voice drafting, view nearby pools, commit quantity |
| **Buyer** | Amit Traders | `9822334455` | OTP: `123456` | Browse listings, direct residue purchases, PayPal checkout |
| **Industry** | Panipat Biomass Energy | `procurement@panipatbiomass.example` | Password: `demo1234` | Post requirements, manage pools, PayPal settlement |
| **Admin** | Priya Menon | `admin@greenroots.example` | Password: `demo1234` | Verify industries, approve farmer payouts, review audit logs |

Click any demo button on the login screen to sign in instantly.

