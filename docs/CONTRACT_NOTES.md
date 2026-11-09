# GreenRoots Backend: Contract Notes & Harmonization

This document records the exact contract decisions and harmonization between the frontend (`src/types/`, `src/services/`, `src/mocks/`) and the SRS / prompt specification, following the non-negotiable rule: **The frontend wins**.

---

## 1. Status Enums & Case Consistency

The SRS specification in some sections uses uppercase status strings (`OPEN`, `ACTIVE`, `CAPTURED`), while the frontend TypeScript types (`src/types/index.ts`) and mock data rely strictly on Title Case strings (`"Active"`, `"Open"`, `"Ready for Pickup"`, `"Captured"`, `"Simulated"`).

To guarantee zero frontend regressions:
- **`FulfilmentStatus`**: `"Pending"`, `"Ready for Pickup"`, `"Completed"`, `"Cancelled"`
- **`PaymentStatus`**: `"Initiated"`, `"Awaiting Approval"`, `"Approved"`, `"Captured"`, `"Failed"`, `"Cancelled"`, `"Refunded"`
- **`PayoutStatus`**: `"Not Yet Due"`, `"Pending"`, `"Processing"`, `"Completed"`, `"Failed"`, `"Simulated"`
- **`Listing["status"]`**: `"Active"`, `"Reserved"`, `"Sold"`, `"Paused"`, `"Removed"`
- **`Requirement["status"]`**: `"Draft"`, `"Open"`, `"Fulfilled"`, `"Expired"`, `"Closed"`, `"Removed"`
- **`Pool["status"]`**: `"Open"`, `"Ready for Pickup"`, `"Settled"`, `"Expired"`, `"Completed"`, `"Cancelled"`
- **`IndustryVerification["status"]`**: `"Pending"`, `"Verified"`, `"Rejected"`
- **`ModerationFlag["status"]`**: `"Open"`, `"Dismissed"`, `"Warned"`, `"Removed"`
- **`Forecast["confidence"]`**: `"High"`, `"Medium"`, `"Low"`, `"Insufficient"`

The database schema and Edge Functions store and return these exact strings.

---

## 2. API Endpoints & Dual Routing

The frontend service layer (`src/services/`) sends requests via `call(path, ...)` to `/functions/v1/${path}`:
- `auth/*` (`demo-login`, `request-otp`, `login-phone`, `login-email`, `signup`)
- `listings/*` (`list`, `get`, `create`, `update`, `delete`, `recommend`)
- `requirements/*` (`list`, `get`, `create`, `publish`, `cancel`, `get_reach`, `decide_proposal`)
- `pools/*` (`list`, `get`, `contributions`, `mine`, `commit`, `expand`, `extend`)
- `orders/*` (`list`, `get`, `create`)
- `payments/*` (`create-order`, `confirm`, `status`, `list`)
- `payouts/*` (`list`, `approve`)
- `collection-points/*` (`list`, `get`, `suggest`, `save`)
- `forecasts/*` (`list`, `get`, `for-season`)
- `moderation/*` (`list`, `decide`)
- `admin/*` (`verifications`, `verify-industry`, `users`, `listings`, `requirements`, `remove-listing`, `remove-requirement`, `collection-points`, `payables`)
- `ai/*` (`parse-listing`, `parse-requirement`, `explain-pool`, `explain-forecast`, `explain-match`)
- `notifications/*` (`list`, `read`, `read-all`)
- `audit/*` (`list`)

Simultaneously, the prompt specifies named Edge Functions:
`paypal-create-order`, `paypal-capture-order`, `paypal-order-status`, `paypal-webhook`, `ai-assistant`, `matching`, `cron-dispatch`.

**Harmonization:**
All shared business logic lives in `_shared/`. The Edge Functions support both the frontend paths (e.g. `payments/create-order` and `payments/confirm`) as well as the prompt's standalone function names (`paypal-create-order`, `paypal-capture-order`, `paypal-order-status`, `paypal-webhook`, `ai-assistant`).

---

## 3. Currency & PayPal Sandbox Constraints

- **Application Representation:** Canonical money in India is Indian Rupee (INR / ₹) with prices and gross amounts stored in paise (`bigint`).
- **PayPal Sandbox Requirement:** PayPal Sandbox REST apps often require `USD` or specific supported currencies when testing without an Indian PayPal merchant agreement.
- **Backend Bridge:** The payment row snapshots `charge_amount_minor`, `charge_currency` (default `USD`), and `fx_rate` (default `84.0`). The frontend displays ₹ while the server interacts with PayPal in the configured sandbox currency.
- **Labeling:** All payment rows, responses, and receipts carry `environment: 'sandbox'`.

---

## 4. Platform Commission Split

Platform fee is configurable in `platform_settings.fee_bps` (default 500 bps = 5.00%).
When a pool is finalised:
1. `commission_total = round(gross_total * fee_bps / 10000)`
2. Individual farmer commissions are calculated using the **largest-remainder method** so that `sum(commission_i) == commission_total` and `sum(net_i) + commission_total == gross_total` exactly to the paisa.

---

## 5. Security & Isolation

- Gemini never receives phone numbers, emails, bank accounts, or financial credentials.
- All AI drafts require an explicit human confirmation step via a separate authenticated endpoint.
- Webhook signature verification is enforced in `paypal-webhook`.
- Audit logs and payment status histories are append-only; database triggers prevent modification.

