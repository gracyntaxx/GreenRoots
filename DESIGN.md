# GreenRoots: UI/UX & System Architecture Specification

GreenRoots is an AI-assisted marketplace and transaction settlement platform that connects agricultural producers (farmers) with industrial processing plants, commercial aggregators, and local buyers to monetize agricultural biomass residue (straw, husk, stubble) rather than burn it.

## 1. System Architecture & Integrated Services

The platform pairs a lightweight, mobile-first client for agricultural operations with a data-dense web portal for industrial supply chain management. Selected third-party services are integrated where they directly serve core functional needs:

```
                      ┌────────────────────────────────────────────────────────┐
                      │                     Client Surface                     │
                      │  • Mobile: React Native / Expo (Farmers & Local Buyers)│
                      │  • Web: React / Vite + AG Grid (Enterprises & Admins)  │
                      └───────────────────────────┬────────────────────────────┘
                                                  │ HTTPS / WSS
                                                  ▼
                      ┌────────────────────────────────────────────────────────┐
                      │              Orchestration & Gateway Layer             │
                      │  • Supabase Edge Functions (Auth, Storage, Realtime)   │
                      │  • Node.js Backend on Render (Webhooks & Transactions) │
                      │  • Postman (API Contract QA & Webhook Testing Suite)   │
                      └─────────────┬───────────────────────────┬──────────────┘
                                    │                           │
                    ┌───────────────▼───────────┐   ┌───────────▼──────────────┐
                    │     AI & Search Layer     │   │     Financial Layer      │
                    │  • Gemini 1.5 Multimodal  │   │  • PayPal Checkout APIs  │
                    │    (Audio & Extraction)   │   │  • PayPal Payouts        │
                    │  • Elastic (Geo & Search) │   │  • Verified Webhooks     │
                    └───────────────────────────┘   └───────────┬──────────────┘
                                                                │
                                                                ▼
                                                    ┌──────────────────────────┐
                                                    │ Security & State Engine  │
                                                    │  • Webhook Signature Verif│
                                                    │  • Idempotent Event Log  │
                                                    │  • PostgreSQL DB Engine  │
                                                    └──────────────────────────┘
```

### 1.1 Core Stack & Service Mapping

| Service / Tool | Layer | Justification & Responsibility |
| :--- | :--- | :--- |
| **Render** | Backend Compute | Hosts the centralized Node.js/TypeScript transaction orchestration microservice and the persistent webhook intake listener. |
| **Elastic** | Search & Discovery | Powers geo-indexed, radius-filtered residue matching and semantic search across active listings and industry pools. |
| **AG Grid** | Enterprise Web Portal | Renders high-performance tabular dashboards for industries and admins: bulk pool commitments, weighbridge logs, and payout ledgers. |
| **Postman** | QA & API Verification | Pre-configured API collections for contract testing edge endpoints, mocking PayPal webhook payloads, and validating AI gateway responses. |
| **Supabase** | Data & Identity | Managed PostgreSQL database, authentication, row-level security (RLS), file storage, and lightweight serverless Edge Functions. |
| **Gemini 1.5** | Multimodal Intelligence | Converts spoken regional audio into structured JSON listing drafts, verifies residue descriptions, and generates demand explanations. |

## 2. Mobile Client Technical Specifications

* **Runtime:** React Native (v0.74+) powered by Expo SDK (v51+) with file-based routing via `Expo Router v3`.
* **Styling Engine:** `NativeWind v4` (compiled Tailwind utility primitives mapped to native styling).
* **Target Hardware:** Android 8.0+ (API 26+) optimized for entry-to-mid tier devices (₹8,000–₹16,000 price point, 3 GB–4 GB RAM).
* **Caching & State:** TanStack React Query v5 with local AsyncStorage persistence for resilient offline viewing of cached listings and active pools.
* **Audio & Speech Pipeline:**
  $$
  \text{Expo Audio Capture} \longrightarrow \text{Base64 Audio Stream} \longrightarrow \text{Backend on Render} \longrightarrow \text{Gemini API} \longrightarrow \text{Structured JSON Draft}
  $$
* **Localization (`i18n`):** Multi-dialect localization via `i18next` supporting English, Hindi, Punjabi, Marathi, Telugu, and Tamil.
* **Device APIs:** Geolocation (GPS coordinate clustering), Camera (residue photo capture), Microphone (voice listing input), and Expo Notifications (FCM).

## 3. Design System & UI/UX Guidelines

Designed specifically for outdoor legibility under direct sunlight, simple single-hand navigation, and clear financial transaction states.

### 3.1 Color Palette

```
  Primary Brand & Environmental
  ├── Forest Core:        #15803D (Deep Green - primary actions, status banners)
  ├── Vivid Growth:       #22C55E (Active Mint - verified transactions, fulfilled pools)
  └── Soft Meadow:        #DCFCE7 (Light Foliage - background chip highlights)

  Financial Status & Trust
  ├── Escrow Blue:        #0070BA (PayPal checkout flows, secured funds)
  ├── Trust Navy:         #003087 (Financial headers, verified certificates)
  ├── Settlement Amber:   #F59E0B (Pending weight checks, escrow clearances)
  └── Error Red:          #DC2626 (Validation discrepancies, expired offers)

  High-Contrast Field Neutrals
  ├── Background Canvas:  #F8FAFC (Low-glare field slate)
  ├── Surface Card:       #FFFFFF (Pure white surface with 1.5px high-contrast borders)
  └── High-Contrast Text: #0F172A (Deep Slate - maximum sunlight contrast)
```

### 3.2 Typography System

* **Primary Font:** Inter / Roboto (system default on target Android devices to eliminate remote font load latency).
* **Financial & Numerical Data:** Space Grotesk / Chivo Mono (tabular figures for currency amounts, crop weights, and metrics).

| Scale | Size | Weight | Primary Use |
| :--- | :--- | :--- | :--- |
| **Display Header** | 24sp | Bold (700) | Available Payout Balances, Screen Titles |
| **Section Header** | 18sp | SemiBold (600) | Waste Item Names, Pool Progress Ratios |
| **Body Standard** | 15sp | Regular (400) | Explanatory text, contextual instructions |
| **Action Strong** | 15sp | Bold (700) | Button labels, unit price tags |
| **Metadata Tag** | 12sp | Medium (500) | Distance indicators, vehicle IDs, timestamps |

### 3.3 Touch Targets & Ergonomic Elements

* **Standard Touch Target:** Minimum $56 \times 56\text{ dp}$ across all buttons, form fields, and interactive chips.
* **Voice Action Center (VAC):** Centered floating mic button ($68\text{ dp}$) with dynamic visual pulse rings for one-tap voice interaction.
* **Outdoor Visibility:** All actionable cards feature an explicit `1.5px` solid border (`#CBD5E1`) and subtle elevation (`elevation: 3`) to prevent glare washout.

## 4. User Interaction Flows & State Machines

### 4.1 AI-Assisted Voice-to-Listing Pipeline

```
  [Farmer Dashboard]
        │
        ▼
  [Tap Floating Mic Button]
        │
        ▼
  [Farmer Speaks]: "I have 50 quintals of mustard stubble in Rewari at 1200 per quintal"
        │
        ▼
  [Gemini Multimodal Parser]: Extracts crop type, volume, unit, price, and hub location
        │
        ▼
  [Draft Review Card Displayed]:
  ┌────────────────────────────────────────────────────────┐
  │ Waste Type: Mustard Stubble                            │
  │ Quantity: 5,000 kg (50 Quintals)                       │
  │ Desired Rate: ₹1,200 / Quintal                         │
  │ Drop Point: Rewari Central Hub                         │
  └────────────────────────────────────────────────────────┘
        │
        ├── User modifies values via direct tap (if needed)
        └── Audio readout option (TTS) for verbal confirmation
        │
        ▼
  [Farmer Confirms] ──> Indexed in Database & Elastic Search Engine
```

### 4.2 Aggregation Pool Lifecycle & Transaction Flow

```
  [Industry Posts Aggregation Pool]: 100 Metric Tons of Paddy Straw Required
        │
        ▼
  [Elastic Geospatial Engine]: Identifies and alerts eligible farmers within 35 km
        │
        ▼
  [Farmer Commits Volume]: Commits 10 Metric Tons to Pool
        │
        ▼
  [Pool Reaches Target Volume]: Order locks against further commitments
        │
        ▼
  [Industry Deposits Funds]: Payment captured via PayPal Checkout
        │
        ▼
  [Physical Drop-off & Weighing]: Validated at Village Collection Hub
        │
        ▼
  [Proportional Settlement Calculation]:
    Farmer Share = (Accepted Metric Tons / Total Metric Tons) * Net Pool Amount
        │
        ▼
  [Admin Payout Approval] ──> Disbursements Initiated via PayPal Payouts
```

## 5. Screen Inventory & Interface Architecture

### 5.1 Mobile Application Screens (Farmer & Local Buyer)

1. **Operations Dashboard (`/screens/dashboard`)**
   * Real-time seasonal earnings card with clear payout history.
   * Active Aggregation Pools with linear progress indicators: `Committed` $\rightarrow$ `Ready for Pickup` $\rightarrow$ `Settled`.
   * Elastic-ranked nearby demand cards ("High Demand in Your Sector").
   * Centered Floating Mic button for voice input.

2. **AI Voice & Draft Validation Modal (`/components/voice-modal`)**
   * Real-time audio waveform animation during speech recording.
   * Auto-populated review card generated from Gemini structured output.
   * One-touch Text-to-Speech playback for verbal verification in regional dialect.
   * Single-action "Confirm & List" button.

3. **Pool Commitment & Allocation Screen (`/screens/pools/[id]`)**
   * Target weight vs. committed weight progress bar.
   * Village collection hub selection with interactive map view.
   * Interactive volume slider calculating real-time net earnings:
     $$
     \text{Net Payout} = (\text{Committed Weight} \times \text{Agreed Rate}) - \text{Platform Fee}
     $$

4. **Order Settlement & History Screen (`/screens/orders/[id]`)**
   * Three distinct status chips: Logistics Status, Payment Status, and Payout Status.
   * Digital drop-off confirmation slip with verification QR code.

### 5.2 Enterprise Web Portal (Industries & Operations Admin)

1. **Procurement & Demand Board (`/enterprise/demand`)**
   * **AG Grid Data Console:** Fast tabular ledger of incoming biomass, verified weighbridge weights, moisture content %, and farmer payout allocations with instant filtering and CSV/Excel export.
   * View toggles between gross tonnage, moisture-adjusted dry matter, and effective unit cost.

2. **Settlement Governance Console (`/admin/settlements`)**
   * Discrepancy detector flagging differences between declared weight and verified hub weighbridge measurements.
   * Payout management screen for reviewing and triggering scheduled PayPal Payout disbursements.

## 6. Security Architecture, Idempotency & Governance

```
                    ┌────────────────────────────┐
                    │ Client Application Bundle  │
                    │ (Zero Embedded Secrets)    │
                    └─────────────┬──────────────┘
                                  │ HTTPS / Signed JWT
                                  ▼
                    ┌────────────────────────────┐
                    │ Protected Backend (Render) │
                    │ (Validation & Auth Checks) │
                    └──────┬──────────────┬──────┘
                           │              │
       PayPal API REST     │              │ Sanitized Prompts
       (Environment Secret)│              │ (No Identity/Financial PII)
                           ▼              ▼
                    ┌────────────┐  ┌────────────┐
                    │ PayPal     │  │ Gemini API │
                    │ Gateway    │  │ Gateway    │
                    └─────┬──────┘  └────────────┘
                          │ Signed Webhook
                          ▼
                    ┌────────────────────────────┐
                    │ Signature Verification     │
                    │ (HMAC / Nonce Validation)  │
                    └─────────────┬──────────────┘
                                  ▼
                    ┌────────────────────────────┐
                    │ Idempotent Event Ledger    │
                    │ (Atomic PostgreSQL States) │
                    └────────────────────────────┘
```

1. **Zero Client-Side Credentials:**
   * All PayPal Client Secrets, Gemini API keys, and Supabase Service Role keys are held exclusively in server-side environment variables on Render and Supabase.
   * The client bundle (mobile and web) contains zero private keys or secrets.

2. **Decoupled Three-Pillar Lifecycle State:**
   To guarantee data accuracy and prevent false representations of instant settlement, all transactions track three independent state dimensions:
   * **Fulfillment:** `INITIATED` $\rightarrow$ `COMMITTED` $\rightarrow$ `COLLECTED` $\rightarrow$ `DELIVERED`
   * **Payment Capture:** `CREATED` $\rightarrow$ `APPROVED` $\rightarrow$ `CAPTURED` $\rightarrow$ `REFUNDED`
   * **Disbursement:** `UNALLOCATED` $\rightarrow$ `PENDING_AUDIT` $\rightarrow$ `PROCESSING` $\rightarrow$ `PAID`

3. **Webhook Verification & Idempotency:**
   * Incoming PayPal webhooks are cryptographically validated using PayPal's webhook verification API before changing any internal state.
   * All event payloads are written to an append-only event table using the PayPal event ID as an idempotency key to prevent double processing.