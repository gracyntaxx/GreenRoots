# GreenRoots Security Architecture & Threat Model

This document outlines the security architecture, authorization guarantees, and financial controls implemented in the GreenRoots backend.

---

## 1. Threat Model & Trust Boundaries

```
[ Client Browser / Mobile Web ]
             │
             │ HTTPS (TLS 1.3)
             ▼
[ Supabase Edge Functions (Deno Runtime) ] ── (Server-Side OAuth) ──► [ PayPal Sandbox API ]
             │                                (Strict JSON Schema) ──► [ Google Gemini API ]
             │ Internal Service Role / RLS
             ▼
[ PostgreSQL Database (PostGIS + RLS) ]
```

### Key Principles
1. **The Client Is Untrusted:** The frontend cannot be trusted to calculate fees, declare payment status, or bypass industry verification.
2. **AI Never Acts On Its Own:** Gemini produces structured proposals only. No database mutations occur until a human actor explicitly reviews, confirms, or submits the proposed action.
3. **Browser Redirect Is Not Proof of Payment:** The frontend reporting that PayPal returned `status: approved` is treated purely as a hint. Funds are verified and captured server-side before orders are fulfilled or pools settled.

---

## 2. Row Level Security (RLS) Matrix

RLS is enabled on every public table. Policies enforce tenant isolation:

| Table | Farmer | Buyer | Industry | Admin | Service Role |
|---|---|---|---|---|---|
| `profiles` | Read all public; Update own | Read all public; Update own | Read all public; Update own | Full Access | Full Access |
| `listings` | Read active; CRUD own | Read active | Read active | Delete/Moderate | Full Access |
| `requirements` | Read open | Read open | CRUD own (if verified) | Delete/Moderate | Full Access |
| `pools` | Read open | Read open | Read own | Full Access | Full Access |
| `pool_contributions` | Create own, view pool's | None | View own pool's | Full Access | Full Access |
| `orders` | View sold orders | Create & view own | None | Full Access | Full Access |
| `payments` | None | View own | View own | Full Access | Full Access |
| `farmer_payables` | View own payables | None | None | Approve & View | Full Access |
| `audit_log` | Insert through actions | Insert through actions | Insert through actions | View all (read-only) | Insert |
| `moderation_flags` | Create flag | Create flag | Create flag | Full Access | Full Access |

---

## 3. Financial Integrity Controls

### 3.1 Monotonic Payment State Machine
Payment transitions are enforced at the database trigger level:
```
Initiated ──► Awaiting Approval ──► Approved ──► Captured
    │                │                  │
    └────────────────┴──────────────────┴──────► Cancelled / Failed
```
Any attempt to downgrade a `Captured` payment back to `Initiated` or `Pending` raises an immediate SQL `EXCEPTION`, preventing double-spending or replay attacks.

### 3.2 Hare-Niemeyer Exact-Paisa Commission Splitting
- All financial calculations occur in **paise (integer arithmetic)**. Floating-point rupees are never used for settlements.
- In multi-farmer pool settlements, proportional splits frequently produce fractional paise. We use the **Hare-Niemeyer (Largest Remainder) algorithm** to allocate remainder paise deterministically based on contribution size:
  $$\sum \text{Farmer Net} + \text{Platform Fee} \equiv \text{Total Buyer Payment}$$
  Zero paise are created or lost to rounding.

### 3.3 Zero Sensitive Credential Storage
GreenRoots does not store credit card numbers, debit card details, CVVs, or UPI PINs. Payouts are routed through verified PayPal receiver emails or simulated Sandbox tokens.

---

## 4. Tamper-Evident Audit Logging

The `audit_log` and `ai_action_audit` tables are protected by PostgreSQL append-only triggers:
```sql
CREATE OR REPLACE FUNCTION prevent_update_or_delete()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Audit tables are append-only. Modification or deletion is strictly forbidden.';
END;
$$ LANGUAGE plpgsql;
```
Even users with elevated database credentials cannot edit or remove historical audit records without dropping database triggers.

---

## 5. Webhook Signature Verification

Incoming PayPal webhooks (`/functions/v1/paypal-webhook`) require five transmission validation headers:
- `paypal-auth-algo`
- `paypal-cert-url`
- `paypal-transmission-id`
- `paypal-transmission-sig`
- `paypal-transmission-time`

The function validates these headers directly against PayPal's verification endpoint before processing any state change.

