# GreenRoots API Contract Specification

This document defines the complete HTTP and WebSocket interface for the **GreenRoots** agricultural waste marketplace and payment settlement platform.

The backend is built entirely on **Supabase Cloud** (PostgreSQL, PostGIS, Auth, Storage, Edge Functions, Realtime, pg_cron).

Base Edge Function URL:
```
${VITE_SUPABASE_URL}/functions/v1/
```

Every response returns HTTP `200` or `201` on success, or an RFC-7807 compatible error JSON:
```json
{
  "error": "Error message describing the failure",
  "code": "ERROR_CODE",
  "details": {}
}
```

---

## 1. Authentication (`auth/`)

### `POST /auth/demo-login`
Fast-switch demo accounts for presentation and evaluation.
- **Request Body:**
  ```json
  { "role": "farmer" | "buyer" | "industry" | "admin" }
  ```
- **Response (`Profile`):**
  ```json
  {
    "id": "farmer_1",
    "name": "Ramesh Yadav",
    "role": "farmer",
    "phone": "9812345670",
    "email": null,
    "village": "Rewari",
    "district": "Rewari",
    "state": "Haryana",
    "language": "hi",
    "location": { "lat": 28.197, "lng": 76.617 },
    "reputation": 4.6,
    "reputationFactors": [
      { "key": "deliveries", "label": "Completed deliveries", "value": "38", "weight": 30 }
    ],
    "payoutReadiness": "Ready",
    "verified": true,
    "avatarInitials": "RY",
    "joined": "2023-11-02"
  }
  ```

### `POST /auth/request-otp`
Sends an SMS OTP (or test OTP in Sandbox: `123456`).
- **Request Body:** `{ "phone": "9812345670" }`
- **Response:** `{ "sent": true, "hint": "Demo OTP is 123456" }`

### `POST /auth/login-phone`
Verifies OTP for Farmers and Buyers.
- **Request Body:** `{ "phone": "9812345670", "otp": "123456" }`
- **Response:** `Profile`

### `POST /auth/login-email`
Authenticates Industries and Administrators.
- **Request Body:** `{ "email": "procurement@panipatbiomass.example", "password": "demo1234" }`
- **Response:** `Profile`

### `POST /auth/signup`
Registers a new user. For industry accounts, creates a pending verification entry.
- **Request Body:**
  ```json
  {
    "role": "farmer" | "buyer" | "industry",
    "name": "Sunita Devi",
    "phone": "9812345671",
    "email": null,
    "village": "Bawal",
    "district": "Rewari",
    "state": "Haryana",
    "language": "hi",
    "licenseNumber": "HR-REW-2024-00123",
    "companyName": "Green Biomass Co",
    "contactPerson": "Sunita Devi"
  }
  ```
- **Response:** `Profile`

---

## 2. AI Assistant (`ai/` & `ai-assistant/`)

### `POST /ai/parse-listing`
Parses voice speech transcript or free text into structured listing drafts using Gemini with confidence scores.
- **Request Body:** `{ "text": "I have 50 quintals of paddy straw in Rewari at 1200 rupees per quintal" }`
- **Response:**
  ```json
  {
    "wasteType": "paddy_straw",
    "quantity": 50,
    "unit": "quintal",
    "rate": 1200,
    "rateUnit": "quintal",
    "village": "Rewari",
    "confidence": {
      "wasteType": 0.93,
      "quantity": 0.95,
      "rate": 0.88,
      "village": 0.84
    },
    "rawText": "..."
  }
  ```

### `POST /ai/parse-requirement`
Extracts industry procurement requirements.
- **Request Body:** `{ "text": "Need 100 tonnes rice husk in Panipat by 15 November at 950 per quintal" }`
- **Response:** `RequirementDraft`

### `POST /ai/explain-pool`
Generates human-friendly explanations of pool fulfillment feasibility and pacing.
- **Request Body:**
  ```json
  {
    "committedKg": 62000,
    "targetKg": 100000,
    "deadline": "2026-11-15T18:00:00Z",
    "contributionCount": 7
  }
  ```
- **Response:**
  ```json
  {
    "summary": "This pool is 62% full. 38,000 kg is still needed with 6 days left...",
    "assumptions": ["Based on 7 recorded contributions.", "..."],
    "confidence": 0.72
  }
  ```

### `POST /ai/explain-match`
Explains why a farmer is ranked high for an industry's procurement pool.
- **Response:** String explanation text.

---

## 3. Crop Residue Listings (`listings/`)

### `POST /listings/list`
Lists active listings with geospatial distance from user and unit-normalized pricing.
- **Request Body:**
  ```json
  {
    "q": "paddy",
    "wasteType": "paddy_straw",
    "maxDistanceKm": 50,
    "sort": "nearest" | "price" | "trusted"
  }
  ```
- **Response:** `ListingWithDistance[]`

### `POST /listings/create`
Creates a verified listing.
- **Request Body:** `{ "draft": { ... }, "collectionPointId": "cp_rewari_central" }`
- **Response:** `Listing`

### `POST /listings/recommend`
Returns top-3 grounded active listings ranked by proximity, trust, and price.

---

## 4. Industry Requirements & Pools (`requirements/` & `pools/`)

### `POST /requirements/create`
Submits an industry procurement requirement and automatically generates an open pool.
- **Request Body:**
  ```json
  {
    "wasteType": "paddy_straw",
    "quantity": 100,
    "unit": "tonne",
    "rate": 2300,
    "deadline": "2026-11-15T18:00:00Z",
    "village": "Panipat",
    "location": { "lat": 29.39, "lng": 76.963 }
  }
  ```
- **Response:** `{ "requirement": Requirement, "poolId": "pool_..." }`

### `POST /pools/commit`
Atomically records a farmer's quantity commitment to a pool.
- Concurrency handled via PostgreSQL row-level locks.
- Generates a dropoff token (`TK-XXXX`) and QR payload.
- Automatically transitions pool to `"Ready for Pickup"` once `committed_kg >= target_kg`.
- **Response:** `{ "pool": PoolWithMeta, "contribution": PoolContribution }`

### `POST /pools/expand`
Expands the notification radius (e.g. from 15 km to 35 km or 60 km) when commitments are slow.

---

## 5. Payments & PayPal Sandbox (`payments/` & `paypal-*`)

### `POST /payments/create-order` (alias: `/paypal-create-order`)
Creates a PayPal v2 Checkout Order with currency snapshot (INR paise converted to USD cents).
- **Request Body:**
  ```json
  {
    "scope": "order" | "pool",
    "referenceId": "pool_wheat_ludhiana",
    "amount": 144000,
    "idempotencyKey": "idem_12345"
  }
  ```
- **Response:** `Payment`

### `POST /payments/confirm` (alias: `/paypal-capture-order`)
Captures an approved PayPal order. On successful capture of a pool:
1. Marks all pool contributions as accepted.
2. Runs Hare-Niemeyer largest-remainder commission arithmetic to calculate farmer payables to the exact paisa.
3. Inserts records into `farmer_payables`.

### `POST /paypal-webhook`
Public webhook endpoint for asynchronous PayPal events (`PAYMENT.CAPTURE.COMPLETED`, `CHECKOUT.ORDER.APPROVED`).
- Validates PayPal transmission signature headers.
- Idempotently verifies capture references and settles pools.

---

## 6. Farmer Settlements & Payouts (`payouts/`)

### `POST /payouts/list`
Lists farmer payable records with gross, fee, net, and payout status.

### `POST /payouts/approve`
Admin approval for farmer disbursement. Dispatches batch via PayPal Payouts API or marks `"Simulated"` in sandbox.

---

## 7. Collection Points & Routing (`collection-points/`)

### `POST /collection-points/suggest`
Finds the optimal drop-off mandi or collection center.

### `POST /collection-points/route`
Runs TSP 2-opt local search and partitions stops by vehicle capacity (e.g. 5,000 kg).

---

## 8. Scheduled Cron Dispatch (`cron-dispatch/`)

Invoked automatically by `pg_cron` via `pg_net` or manually with `X-Cron-Secret`:
- `pool-deadline-check`: Transitions expired pools.
- `seasonal-harvest-alerts`: Alerts farmers before peak stubble burning periods.
- `dropoff-reminder`: Reminds farmers 24h before drop-off deadline.
- `payment-reconciliation`: Reconciles unconfirmed orders.
- `stale-data-cleanup`: Purges old idempotency keys.

