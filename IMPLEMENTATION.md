# GreenRoots — Implementation Guide

> **Document type:** Implementation plan and technical build guide  
> **Project:** Agriculture Waste Management System (GreenRoots)  
> **Basis:** `README.md` (Software Requirements Specification), `ARCHITECTURE.md` (System Architecture), and `DESIGN.md` (UI/UX and System Architecture Specification)  
> **Status:** Implementation blueprint for the hackathon prototype

---

## 1. Purpose and implementation approach

This document translates the GreenRoots requirements, architecture decisions and UI/UX specification into an actionable implementation plan. It describes how the team should organise the codebase, implement the mobile and web applications, design the database, connect Gemini and PayPal, secure the transaction lifecycle, test the system and prepare the hackathon demonstration.

GreenRoots connects farmers, industries and general buyers to enable the discovery, collection and sale of agricultural waste such as straw, husk and stubble. It supports two marketplace paths:

1. **Individual listings:** A farmer lists available agricultural waste and a buyer places an order.
2. **Industry aggregation pools:** An industry publishes a requirement, multiple farmers contribute quantities, and the combined supply fulfils the requirement.

The hackathon implementation must make AI and PayPal part of these marketplace journeys. Gemini helps users interpret requests, prepare listings or requirements, discover matches and understand transaction information. PayPal Sandbox provides the payment approval and payment-processing workflow. The backend, not the AI model or frontend, remains authoritative for application data and payment state.

### 1.1 Implementation principles

- Build one GitHub monorepo with separate Android and web applications.
- Share TypeScript domain types, validation and platform-neutral services; do not force the two platforms to share their UI or navigation.
- Use one Supabase project for PostgreSQL, Auth, Realtime, Storage and Edge Functions.
- Call Gemini and PayPal from protected backend functions. Do not expose private credentials in either client.
- Treat AI output as a proposal that must be validated. Require user review and explicit confirmation before a listing, contribution, requirement, order or payment-related action is committed.
- Treat Supabase PostgreSQL as the authoritative source for marketplace and transaction state.
- Verify payment outcomes through PayPal APIs and verified Webhooks. A redirect, client-side message or AI response is not proof of payment.
- Track fulfilment, payment capture and farmer disbursement independently.
- Implement the smallest reliable end-to-end transaction journey before adding optional integrations or secondary features.

### 1.2 Technology and architecture resolution

The three source documents contain a few different technology sketches. The implementation baseline is resolved as follows:

| Area | Implementation baseline | Notes |
|---|---|---|
| Repository | GitHub monorepo | One repository, separate build and deployment targets. |
| Android | React Native + Expo, Expo Router, NativeWind, TanStack Query | Primary experience for farmers and local buyers. |
| Web | React + Vite, Tailwind CSS, shadcn/ui, React Router, TanStack Query | Primary experience for industries and admins. |
| Shared code | TypeScript packages | Share types, constants, validation and compatible services. |
| Backend | Supabase Cloud and Supabase Edge Functions | This is the confirmed default. A separate Express/Node.js service is not required unless a specific implemented requirement cannot be handled suitably by Edge Functions. |
| Database and identity | Supabase PostgreSQL and Supabase Auth | RLS and backend checks enforce access. |
| AI | Gemini API through backend functions | The Design document mentions Gemini 1.5; the architecture commits to Gemini API generally. Select and verify the model identifier during implementation rather than hard-coding an unconfirmed model version here. |
| Payments | PayPal Checkout, REST APIs and Webhooks in Sandbox | Backend creates and verifies transactions. PayPal Payouts are conditional on Sandbox/account support. |
| Mobile delivery | EAS Build | Produces the configured Android APK or other Android build. |
| Web delivery | Vercel or Netlify | Final provider is a team decision. |
| Backend delivery | Supabase Cloud / Supabase CLI | Migrations and Edge Functions are deployed independently. |

`DESIGN.md` also depicts a Node.js backend hosted on Render and an Elastic search/geospatial layer. These are not part of the confirmed baseline in `ARCHITECTURE.md`; the SRS/README also describes Render as optional. Start with Supabase Edge Functions and PostgreSQL-backed filtering/matching. Add Render or Elastic only if the team makes and documents a specific implementation decision. Likewise, AG Grid, Postman, the PayPal Agent Toolkit, the PayPal MCP Server, WhatsApp/SMS and other sponsor tools are optional. Include them in the final technology list only if they are actually integrated and tested.

---

## 2. Repository setup and code organisation

Use a workspace-aware package manager and maintain a single repository. The exact package manager and task runner are not prescribed by the architecture; choose one, configure it consistently and document its commands in the root README.

### 2.1 Proposed repository structure

```text
GreenRoots/
├── apps/
│   ├── mobile/                     # React Native + Expo Android app
│   │   ├── app/                    # Expo Router routes
│   │   ├── components/             # Shared mobile UI components
│   │   ├── features/               # Auth, listings, pools, orders, AI, etc.
│   │   ├── hooks/
│   │   ├── services/               # Native adapters and mobile-only services
│   │   ├── locales/                # i18next translation JSON files
│   │   └── ...
│   └── web/                        # React + Vite web portal
│       ├── src/
│       │   ├── pages/
│       │   ├── components/
│       │   ├── features/           # Industry, admin, demand, settlements
│       │   ├── hooks/
│       │   ├── services/
│       │   └── ...
│       └── ...
├── packages/
│   ├── shared/                     # Domain types, constants and status models
│   ├── services/                   # Platform-neutral data/service functions
│   └── validation/                 # Shared input and domain validation
├── supabase/
│   ├── migrations/                 # Version-controlled database migrations
│   ├── functions/
│   │   ├── ai-assistant/
│   │   ├── paypal-create-order/
│   │   ├── paypal-capture-order/
│   │   ├── paypal-webhook/
│   │   ├── marketplace-operation/  # Optional protected business operations
│   │   └── ...
│   ├── seed.sql                    # Optional development/demo data
│   └── config.toml
├── .env.example
├── .gitignore
├── package.json
├── README.md
├── ARCHITECTURE.md
├── DESIGN.md
└── IMPLEMENTATION.md
```

This is a proposed organisation, not a claim that all folders or functions already exist. The team may adjust names to match the actual codebase.

### 2.2 What belongs in each layer

| Layer | Responsibilities | Must not contain |
|---|---|---|
| `apps/mobile` | Android screens, Expo Router navigation, microphone/audio capture, regional-language UI, notifications, mobile-specific adapters | PayPal Client Secret, Gemini API key, Supabase service-role key, privileged payment logic |
| `apps/web` | Industry/admin screens, desktop dashboards, requirement forms, settlement views, browser-specific interactions | Private API credentials or trusted payment-state decisions |
| `packages/shared` | User roles, domain interfaces, waste categories, status constants, common DTOs | Platform-specific UI or native/browser APIs |
| `packages/validation` | Quantity, price, required-field and domain validation shared by clients | The only security validation; backend validation is still mandatory |
| `packages/services` | Platform-neutral Supabase/data-access functions and service contracts where compatible | Platform-dependent audio/device code or privileged secret-bearing operations |
| `supabase/migrations` | Database schema, constraints, indexes, RLS policies and database functions | Unversioned manual-only schema changes |
| `supabase/functions` | Protected Gemini calls, PayPal calls, webhook verification, privileged marketplace operations | Client-only UI code |

Keep the shared packages platform-neutral. Native microphone permissions and audio recording belong in the mobile adapter. Browser navigation and desktop dashboards belong in the web application. Both clients should use the same domain contracts and backend rules.

### 2.3 Workspace and local configuration

1. Install the selected Node.js LTS release and the chosen workspace package manager.
2. Configure the root workspace so `apps/mobile`, `apps/web` and `packages/*` resolve consistently.
3. Configure TypeScript path/workspace references so each app can import shared packages without copying source files.
4. Add root scripts for the commands the team actually supports, such as running the mobile app, running the web app, type-checking, linting and building.
5. Install and configure the Supabase CLI for local database and Edge Function development/deployment.
6. Add `.env.example` containing variable names and placeholder values only. Add `.env` and secret-bearing files to `.gitignore`.

Do not assume a specific package manager or task runner from the source documents. The team must choose and document it.

---

## 3. Environment and service configuration

Use separate configuration for local development, hosted web, Android builds and Supabase server-side functions. Keep Sandbox configuration separate from any future production configuration.

### 3.1 Configuration categories

The following names are examples. Align the final names with the code and deployment provider:

| Variable/category | Used by | Visibility |
|---|---|---|
| Supabase project URL | Mobile and web clients | Public client configuration |
| Supabase anon/publishable key | Mobile and web clients | Public client configuration; RLS must still protect data |
| Gemini API key | Supabase Edge Functions | Server-side secret only |
| PayPal Client ID | Checkout client integration, if required; also backend configuration as needed | Not a private secret, but expose only where the selected SDK requires it |
| PayPal Client Secret / access credentials | PayPal Edge Functions | Server-side secret only |
| PayPal Sandbox base URL and webhook ID | PayPal Edge Functions | Server-side configuration; webhook ID is configuration, not a client credential |
| Notification provider credentials | The protected service that sends notifications | Server-side secret |

Example `.env.example` structure (placeholders only):

```dotenv
# Public client configuration — use the appropriate prefix for each app
EXPO_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# Supabase Edge Function secrets — configure in the Supabase project
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
PAYPAL_CLIENT_ID=YOUR_PAYPAL_SANDBOX_CLIENT_ID
PAYPAL_CLIENT_SECRET=YOUR_PAYPAL_SANDBOX_CLIENT_SECRET
PAYPAL_BASE_URL=YOUR_PAYPAL_SANDBOX_API_BASE_URL
PAYPAL_WEBHOOK_ID=YOUR_PAYPAL_WEBHOOK_ID
```

Do not copy real secret values into `.env.example`. Do not use Vite or Expo public environment-variable prefixes for private credentials. The Supabase service-role key must never be bundled into either frontend.

### 3.2 Sandbox setup

1. Create and configure the PayPal Developer Sandbox resources required by the chosen checkout flow.
2. Configure a Sandbox payer account and the relevant business/merchant account for testing.
3. Configure the PayPal application and obtain the credentials required by the backend.
4. Register the backend webhook endpoint with PayPal and store the corresponding webhook ID in server-side configuration.
5. Confirm which currency and checkout/capture flow the team will use.
6. Test the complete create-order, buyer-approval, capture/confirmation and webhook path before integrating it into the full UI.
7. Label all Sandbox transactions clearly as test transactions in the application and demo.

The exact currency, PayPal product capabilities and availability of Payouts must be confirmed against the configured Sandbox account. Do not assume marketplace split payments, automatic escrow or instant farmer withdrawals.

---

## 4. Database implementation

Supabase PostgreSQL is the authoritative store for users, listings, requirements, pools, contributions, orders, payments, payouts and audit records. The architecture defines logical entities rather than a final SQL schema, so final table names, columns, enum values, indexes and RLS policies must be decided in migrations and tested.

### 4.1 Initial logical entities

The implementation should cover the following logical records. The names below are suggested names, not prescribed SQL identifiers.

| Suggested table/entity | Main purpose and relationships |
|---|---|
| `profiles` | References the Supabase Auth user; stores display name, role, location/profile details and reputation reference/summary. |
| `industry_verifications` | Stores industry verification status and review metadata. A verified industry is required before it can publish requirements. |
| `listings` | Farmer-owned listing with waste type, quantity, unit, price, location and availability/status. |
| `requirements` | Industry-owned requirement with waste type, required quantity, agreed price/rate, location, deadline and status. |
| `pools` | Pool associated with one requirement; stores target quantity and current progress/status. |
| `pool_contributions` | Links a farmer to a pool and records offered, committed and accepted quantity/status as required by the workflow. |
| `collection_points` | Village collection-point details, location and active status; maintained by admins. |
| `orders` | Buyer/order reference to a listing or pool, quantity, amount and fulfilment status. |
| `payments` | GreenRoots transaction reference, related order/pool, PayPal order/capture references, amount, currency and payment status. |
| `farmer_payables` | Farmer-wise payable amount based on accepted contribution or completed direct order, with transparent platform commission allocation. |
| `payouts` | Payout request/reference, recipient, amount and payout status; real PayPal payout data only when supported. |
| `payment_webhook_events` | PayPal event ID, event type, associated transaction, verification/processing state and timestamps. Enforce uniqueness for the PayPal event ID. |
| `reputation_records` | Auditable transaction-derived factors or score history. |
| `forecasts` | Region, forecast period, source-data period, estimated demand/availability and explanation. |
| `notifications` | Recipient, event, channel and delivery/status metadata. |
| `ai_action_audit` | AI-prepared action, relevant user, reviewed proposal, confirmation, backend result and related transaction reference. |

### 4.2 Relationships and data rules

- A pool belongs to an industry requirement.
- A pool can contain contributions from multiple farmers.
- Every contribution must identify the farmer and the quantity associated with that farmer.
- A listing belongs to its farmer. An order must retain the relevant listing or pool reference and buyer.
- A payment must reference the GreenRoots order or pool it pays for and retain the PayPal identifiers returned by the verified workflow.
- A farmer payable must be derived from the verified accepted contribution or completed order and the agreed rate/price.
- Platform commission and farmer-wise payable amounts must be recorded transparently.
- Order fulfilment status, payment status and farmer payout status must be independent fields/records. Do not combine them into one generic status.
- Store quantities with explicit units and prices with explicit currency. Validate conversions, such as quintals to kilograms, consistently before saving or matching.
- Use database constraints and backend validation to prevent invalid or excessive contributions, duplicate references and inconsistent totals.
- Preserve transaction references and status history needed to reconcile delayed or repeated PayPal events.
- Never store card or bank credentials. PayPal handles those payment credentials.

### 4.3 Transaction state separation

Use three independent lifecycle dimensions. The exact enum values should be finalised against the implemented workflow, but the source documents suggest the following states:

| Dimension | Suggested states | Meaning |
|---|---|---|
| Fulfilment | `PENDING` / `INITIATED` → `COMMITTED` → `READY_FOR_PICKUP` → `COLLECTED` → `DELIVERED` / `COMPLETED`; `CANCELLED` where supported | Physical marketplace/order progress. |
| Payment | `INITIATED` → `AWAITING_APPROVAL` → `APPROVED` → `CAPTURED` / `COMPLETED`; `FAILED`, `CANCELLED`, `REFUNDED` where supported | PayPal payment state verified by backend. |
| Farmer payout | `NOT_ELIGIBLE` / `UNALLOCATED` → `PENDING` / `PENDING_AUDIT` → `PROCESSING` → `COMPLETED`; `FAILED`; `SIMULATED` only for a clearly labelled simulation | Amount payable/disbursed to each farmer. |

A pool/order can be paid but not yet delivered. It can also be delivered while a farmer payout remains pending. A payout must not be marked completed until a successful PayPal result or verified status has been received. A simulated payout must never be displayed as an actual completed payment.

### 4.4 Migrations, indexes and Row Level Security

1. Create the initial schema through version-controlled Supabase migrations.
2. Add foreign keys, not-null constraints, unique constraints and checks for valid positive quantities and amounts.
3. Add indexes based on actual query patterns, especially foreign keys and commonly filtered status, waste type, region/location and time fields.
4. Enable RLS on tables containing user, marketplace or transaction data.
5. Write policies for farmer, buyer, industry and admin roles. Users should only read or modify records permitted by their role and relationship to the record.
6. Prevent users from changing verified payment results, PayPal references, admin-only fields or another user's records directly from a client.
7. Ensure admin authority is enforced in database/backend policy, not only by hiding UI controls.
8. Seed only non-sensitive demo data in development environments.
9. Test each RLS policy using separate accounts for each role, including unauthorised access attempts.

The exact role/permission matrix and RLS policies remain implementation decisions and must be recorded in migrations and tested.

---

## 5. Authentication and role-based access

Use Supabase Auth for GreenRoots registration, login, logout and session management. Keep GreenRoots identity separate from PayPal account approval and payment approval.

### 5.1 Roles

The application supports four primary roles:

- **Farmer:** Creates and manages listings, discovers industry requirements, commits quantities to pools, selects collection points and views orders/payments/payouts associated with their activity.
- **Buyer:** Browses listings, places orders and completes the supported PayPal checkout workflow.
- **Industry:** Manages its industry profile, passes verification, publishes requirements, monitors pools and completes the relevant PayPal checkout workflow.
- **Admin:** Verifies industry accounts, manages users/listings/requirements/collection points, reviews suspicious activity and payout requests, and makes final moderation/payout approval decisions where the workflow requires it.

### 5.2 Authentication flow

1. User registers or signs in through Supabase Auth.
2. The application loads the associated profile and role.
3. Protected screens are rendered according to the role, but backend/database policies remain the security boundary.
4. Industry users may browse the portal before verification, but requirement publication must be rejected until verification succeeds.
5. Expired sessions or unauthorised operations must return clear errors and require re-authentication or appropriate access.
6. Logging out clears the client session and any user-specific cached data that should not remain available to another user of the device.

Do not allow an ordinary user to self-assign the admin role. Do not assume every farmer needs to link a PayPal account unless the selected, supported payout flow requires it.

---

## 6. Mobile application implementation

### 6.1 Stack and target

- React Native with Expo.
- Expo Router for file-based navigation.
- NativeWind for mobile styling.
- TanStack Query for server-state fetching, caching, mutation and retry behaviour.
- i18next for regional-language interface translations.
- `expo-speech-recognition` or the selected Expo audio-capture approach for voice input.
- Expo Notifications with the configured Firebase Cloud Messaging setup.
- Android 8.0 or above as the stated target environment.

The mobile application primarily serves farmers and local buyers. Optimise the interface for outdoor use, lower-end devices, clear status information and simple one-hand interactions.

### 6.2 Suggested mobile feature areas and screens

| Screen/feature | Implementation responsibilities |
|---|---|
| Operations dashboard (`/screens/dashboard` or equivalent route) | Show seasonal earnings/payout information, active pools, progress, nearby demand and the floating voice action. |
| AI voice/draft modal (`/components/voice-modal` or equivalent) | Capture speech, show recording state/waveform, display Gemini-extracted fields, allow edits, provide text-to-speech readout where supported and require explicit confirmation. |
| Listings | Create, edit, delete and view farmer listings; support typed and voice-assisted input. |
| Marketplace browse/search | Search and filter available listings by keyword, waste type, location, quantity and price. Show AI-assisted suggestions only when grounded in current database records. |
| Pool commitment (`/screens/pools/[id]` or equivalent) | Show target and committed quantity, available contribution, collection point selection, estimated earnings and explicit contribution confirmation. |
| Order settlement/history (`/screens/orders/[id]` or equivalent) | Display fulfilment, payment and payout states separately; show payment references/status and drop-off confirmation details where implemented. |
| Profile/settings | Display name, role, location, reputation and language preferences. Avoid exposing sensitive payment credentials. |
| Notifications | Display relevant requirement, pool, order, payment and seasonal alerts. |

The route names shown in `DESIGN.md` are UI design references. The team may use Expo Router file-based route names consistent with the actual app structure.

### 6.3 Voice-to-listing implementation

Implement the following sequence:

1. Farmer opens the dashboard and taps the floating microphone action.
2. App requests microphone permission if needed and captures audio using the selected Expo audio library. If voice input is unavailable, the farmer can type the request.
3. The app sends the audio/text and authenticated request to the protected `ai-assistant` Edge Function. Do not send the Gemini API key from the device.
4. The Edge Function calls Gemini for transcription/understanding and structured extraction.
5. The backend validates the output shape and returns a structured draft containing the fields that can be confidently extracted, such as waste type, quantity, unit, rate/price and location.
6. The app displays an editable preview. Missing or unclear values are highlighted and requested from the farmer.
7. The app may read the proposed details aloud using the selected text-to-speech capability.
8. The farmer corrects the details and explicitly selects **Confirm & List**.
9. The application sends the confirmed fields to the authorised listing operation. That operation revalidates all fields and persists the listing in PostgreSQL.
10. The app displays the saved listing only after the backend confirms persistence.

Example from the design specification: a farmer says they have 50 quintals of mustard stubble in Rewari at ₹1,200 per quintal. The application should preserve the spoken unit and make any conversion (for example, 50 quintals to 5,000 kg) visible and reviewable. Do not silently change quantity units or pricing units.

### 6.4 Pool contribution interaction

- Show requirement waste type, target quantity, already committed quantity, remaining quantity, agreed rate, deadline and location.
- Let the farmer choose a contribution amount within the available/eligible quantity.
- Show the estimated gross amount and any platform fee/estimated net amount if the fee formula has been defined.
- Show the selected collection point where applicable.
- Require the farmer to review and confirm the exact quantity before the backend commits it.
- After a successful backend response, refresh the pool and subscribe to Realtime updates where enabled.

The net payout illustration in `DESIGN.md` is `Committed Weight × Agreed Rate − Platform Fee`. The actual fee formula and rounding rules are not defined in the source documents and must be finalised before implementation. Do not display a calculated value as guaranteed payout until accepted quantity and applicable fees are verified.

### 6.5 Offline and resilience behaviour

TanStack Query and local AsyncStorage persistence may be used to retain cached listings and pool information for resilient viewing. Cached information must be identified as potentially stale. Do not allow stale cached data to authorise a contribution, order or payment. Critical mutations require a current backend validation and a confirmed response.

---

## 7. Web portal implementation

### 7.1 Stack and target

- React with Vite.
- Tailwind CSS and shadcn/ui for responsive interface components.
- React Router for navigation.
- TanStack Query for server-state management.
- AG Grid may be used for high-volume tables if the team chooses to integrate it; it is not required by the confirmed baseline architecture.

The web portal primarily serves industry users and admins on desktop/laptop browsers. It should remain responsive at smaller supported browser sizes.

### 7.2 Industry portal

Implement the following capabilities:

1. Industry profile and verification status.
2. Requirement creation with waste type, required quantity, unit, price/rate, location and deadline.
3. Optional natural-language requirement input. Gemini extracts the fields into a structured draft; the industry user reviews and confirms publication.
4. Requirement and pool overview, including target quantity, contributions and remaining requirement.
5. Farmer matches based on deterministic eligibility and ranking; AI can explain or refine recommendations.
6. Suggestions for area expansion or deadline extension. Any change to the requirement must be approved by the industry.
7. Payment summary and PayPal Checkout for the relevant order/pool workflow.
8. Region- and season-based availability/demand forecast views, with the data period and limitations displayed.

### 7.3 Admin portal

Implement the following capabilities:

1. Review and verify industry accounts.
2. Manage users, listings and industry requirements.
3. Add, update or deactivate village collection points.
4. Review suspicious listings, duplicate activity and unusual payment/payout patterns flagged by rules or AI.
5. Make the final moderation decision; AI flags alone must not automatically establish fraud or permanently remove a user.
6. Review farmer payables, payout requests and relevant audit records.
7. Approve payout initiation where a supported PayPal payout flow is enabled.

### 7.4 Design-console extensions

`DESIGN.md` describes an enterprise procurement board with AG Grid, gross tonnage, moisture-adjusted dry matter, effective unit cost, weighbridge records, CSV/Excel export and payout allocation views. These are useful extensions for industrial operations, but the README/SRS and architecture do not establish all of them as mandatory hackathon-critical functions. Implement them only when the team has the required source data and time. Do not invent verified weighbridge weights, moisture values or payout allocations.

---

## 8. Gemini AI implementation

Gemini is an assistant for GreenRoots marketplace workflows, not an unrestricted chatbot or payment authority. All AI requests that contain protected context or need server-side credentials must pass through Supabase Edge Functions.

### 8.1 Supported AI capabilities

Implement AI functionality around concrete product tasks:

- Interpret typed or voice-derived farmer requests.
- Extract listing fields: waste type, quantity, unit, price/rate and location.
- Extract industry requirement fields: waste type, required quantity, price/rate, location and deadline.
- Recommend relevant farmer listings, buyers, sellers or pool opportunities.
- Explain pool progress and remaining quantity from authorised application records.
- Prepare an order/payment summary from the validated GreenRoots record.
- Explain verified order, payment and payout status.
- Explain regional demand/availability forecasts and their data limitations.
- Flag unusual activity for admin review when implemented.

### 8.2 Controlled application functions

The SRS suggests the following application-level functions. These are GreenRoots functions, not built-in PayPal/Gemini endpoints:

| Function | Responsibility |
|---|---|
| `create_listing_draft` | Return a validated proposed listing structure; do not publish it automatically. |
| `search_listings` | Search real available listings using current database data and the user's authorised scope. |
| `find_pool_matches` | Retrieve eligible pools/farmers using deterministic criteria and return a ranked/explained result. |
| `get_order_status` | Read the status of an order the user is authorised to access. |
| `prepare_paypal_checkout` | Prepare a payment summary and request checkout creation only after the required confirmation flow. |
| `request_farmer_payout` | Prepare/submit a payout request only after role, eligibility, amount and explicit approval checks. |

Expose only the minimum set of functions required by the implemented workflow. Each function must validate the authenticated user, role, record ownership, input arguments, amount/quantity and allowed transaction state. The model must not receive unrestricted database access, Supabase service credentials or PayPal secrets.

### 8.3 AI assistant request flow

1. The user submits text or audio from the Android or web client.
2. The client calls the protected Edge Function with the authenticated session.
3. The Edge Function validates the caller and constructs a minimum-necessary request for Gemini.
4. Gemini returns an intent, structured draft, recommendation or explanation.
5. The Edge Function validates the output structure and rejects unsupported operations or malformed values.
6. The client displays the result as a draft or advisory response.
7. The user edits and explicitly confirms any consequential action.
8. A separate authorised backend operation validates the confirmed fields against current PostgreSQL records and performs the write.
9. The outcome and user confirmation are recorded in `ai_action_audit` where appropriate.

Do not let generated text directly become SQL, arbitrary tool arguments or a trusted payment result. AI output cannot override verified database or PayPal status.

### 8.4 Matching and recommendations

Use a layered implementation:

1. Apply deterministic filters for waste type, location/proximity, available quantity, price/budget and active status.
2. Exclude ineligible, unavailable or unauthorised records.
3. Rank the eligible records with a defined and testable scoring rule using the parameters identified in the SRS: proximity, frequency/popularity, trust, previous deals and price fit where data exists.
4. Optionally use Gemini to explain the result or answer a natural-language query.
5. Revalidate the selected record against the current database state before committing an order or contribution.

The exact matching score is not defined in the source documents. The team must document the factors, weights, tie-breakers and missing-data behaviour. Start with PostgreSQL-backed filters and ranking. Elastic is an optional extension, not a baseline dependency.

### 8.5 Demand forecasting

- Use available historical listings, completed transactions, pool demand, crop/harvest season information and region-level data.
- Store the target region, forecast period and source-data period with the result.
- Present the result as an estimate rather than a guaranteed quantity.
- Ask Gemini to explain the estimate in plain language when useful; do not let a generated explanation change the underlying numeric forecast.
- If historical data is insufficient, label the forecast as limited or unavailable.
- Forecasts can support planning and notifications, but must not create a purchase commitment, listing, pool contribution or payment.
- Schedule refreshes/seasonal alerts with `pg_cron` or another configured mechanism only if that functionality is implemented.

### 8.6 AI fallback and privacy

- Maintain manual text-entry and manual marketplace paths when Gemini is unavailable.
- For unclear speech or missing fields, request clarification or allow manual correction.
- Show loading/progress feedback and handle timeout/quota/provider errors.
- Avoid sending unnecessary identity, personal or financial information to Gemini.
- Do not send PayPal credentials or private payment data to the model.
- Keep AI flags advisory; admins make final moderation decisions.

---

## 9. PayPal Sandbox implementation

PayPal is a mandatory core hackathon integration. The minimum successful implementation is a real Sandbox checkout, server-side order creation/capture or confirmation, verified backend payment state and webhook processing.

### 9.1 Responsibility split

**Client responsibilities**

- Display the GreenRoots order/pool summary and amount retrieved from the backend.
- Let the user choose PayPal checkout.
- Present the PayPal-supported approval experience for the selected platform.
- Return the approval information needed by the backend where required by the chosen flow.
- Display the verified status returned by GreenRoots.
- Never store card/bank credentials or include the PayPal Client Secret.

**Supabase Edge Function responsibilities**

- Authenticate the GreenRoots user and verify role/ownership.
- Load the authoritative order/pool and calculate or validate the amount server-side.
- Create the PayPal order using server-side credentials.
- Return the PayPal approval details required by the client.
- Capture/confirm the PayPal order through the supported REST API flow.
- Verify webhook authenticity using PayPal's supported verification procedure.
- Process webhook events idempotently.
- Confirm amount, currency and association with the expected GreenRoots transaction.
- Persist PayPal references and verified status history.
- Return the current authoritative payment state to the client.

### 9.2 Checkout implementation sequence

1. Buyer or industry user reviews the order/pool summary, including quantity, price, fees where applicable, total amount and currency.
2. User explicitly confirms that they want to continue to PayPal checkout.
3. Client calls the `paypal-create-order` Edge Function with the GreenRoots order/pool reference, not an arbitrary trusted amount.
4. Backend validates the authenticated user, role, ownership, transaction state and order details from PostgreSQL.
5. Backend creates a PayPal Sandbox order using the server-side Client ID/Secret and stores the PayPal order reference with an `INITIATED` or `AWAITING_APPROVAL` payment state.
6. Client launches the PayPal-supported approval experience for the selected platform.
7. After approval, client calls the `paypal-capture-order` function with the relevant GreenRoots/PayPal reference as required by the selected flow.
8. Backend verifies that the PayPal order belongs to the intended GreenRoots transaction and performs the supported capture/confirmation request.
9. Backend validates the returned amount, currency, status and identifiers, then updates the payment record.
10. PayPal sends webhook events to the configured `paypal-webhook` Edge Function.
11. The webhook function verifies the event using PayPal's supported webhook verification procedure, records the event idempotently and reconciles the payment state.
12. Client refreshes/fetches the GreenRoots transaction and displays the verified backend result.

A browser redirect or client-side success message must never be treated as proof of payment. Backend verification and webhook reconciliation determine the authoritative state. The implementation must handle events arriving late or more than once.

### 9.3 Webhook verification and idempotency

- Verify PayPal webhook authenticity before changing payment or payout state.
- Store the PayPal event ID and enforce uniqueness so a repeated delivery cannot process the same event twice.
- Keep processing state/status and timestamps so failed or interrupted event handling can be reconciled.
- Validate that the event refers to a known PayPal order/capture and the correct GreenRoots order or pool.
- Compare amount and currency against the expected transaction values.
- Store the relevant PayPal order and capture IDs and status history.
- Handle pending, failed, cancelled, captured/completed and refunded states where supported by the implemented flow.
- Do not assume event order. A delayed event must not incorrectly roll a transaction back from a newer verified state.
- Reconcile uncertain capture results with PayPal before retrying; avoid duplicate captures.

### 9.4 Farmer payment allocation and payouts

For an industry pool:

1. Record each farmer's contribution.
2. After collection/acceptance, record the accepted quantity for each farmer.
3. Calculate farmer-wise payable amounts from the accepted quantity and agreed price/rate.
4. Calculate and record the platform commission transparently.
5. Associate the industry's verified PayPal payment with the correct pool.
6. Determine farmer payout eligibility only after the relevant delivery/acceptance conditions are met.
7. If the configured PayPal Sandbox account supports the required recipient payout workflow, prepare a payout summary and request explicit approval from the authorised user/admin.
8. Initiate the supported payout through the protected backend and record the PayPal payout reference/result.
9. Mark payout completed only after a successful PayPal result or verified status is received.

For direct farmer listings, preserve separate order, payment and farmer payout states as well. The exact direct-order settlement timing must match the actual implemented checkout/fulfilment process.

**Critical limitation:** The source documents do not establish automatic escrow, guaranteed marketplace split payments or guaranteed instant withdrawals. If the Sandbox/account does not support the complete farmer-recipient payout flow, implement the real supported checkout and maintain the farmer-payable amount as pending. Any simulated payout must be explicitly labelled `SIMULATED` and must not be presented as a completed PayPal transfer.

---

## 10. Core marketplace workflows

### 10.1 Farmer listing workflow

```text
Farmer opens dashboard
        ↓
Enters text or records voice
        ↓
Client sends input to protected AI Edge Function
        ↓
Gemini extracts listing fields
        ↓
Backend validates output structure
        ↓
App shows editable listing preview / optional readout
        ↓
Farmer corrects and confirms
        ↓
Backend revalidates and saves listing in PostgreSQL
        ↓
Listing appears in farmer dashboard and buyer discovery
```

The listing is not created just because Gemini returned a draft. The farmer's explicit confirmation and successful backend write are required.

### 10.2 Industry requirement and aggregation pool workflow

```text
Verified industry creates requirement
        ↓
AI optionally extracts requirement fields
        ↓
Industry reviews and confirms publication
        ↓
Backend saves requirement and creates associated pool
        ↓
Deterministic matching identifies eligible farmers
        ↓
Relevant farmers receive configured notifications
        ↓
Farmer reviews pool and confirms contribution quantity
        ↓
Backend validates and records contribution
        ↓
Pool progress updates in PostgreSQL / Realtime
        ↓
Pool reaches target → Ready for Pickup
        ↓
Collection and accepted-quantity verification
        ↓
Industry completes supported PayPal payment workflow
        ↓
Farmer payables and payout states are calculated/tracked
```

Additional rules:

- If a pool is not filled, the system may recommend expansion to other providers/areas or a deadline extension.
- Changes that affect the industry's requirement must be approved by the industry.
- Do not extend an area or deadline solely because AI recommended it.
- When the target quantity is reached, prevent further contributions beyond the remaining eligible quantity using backend/database checks.

### 10.3 Direct listing purchase workflow

1. Buyer browses and filters actual available listings.
2. AI may rank or explain relevant results using authorised application data.
3. Buyer selects a listing and quantity.
4. Backend validates listing status, available quantity and price.
5. Buyer reviews the order summary and explicitly confirms checkout.
6. Backend creates the PayPal Sandbox order.
7. Buyer approves through the supported PayPal Checkout experience.
8. Backend captures/confirms and verifies payment; webhook events are reconciled.
9. GreenRoots updates payment status from verified PayPal information.
10. Fulfilment proceeds independently and is updated when the order is collected/delivered/completed as implemented.
11. Eligible farmer payout is processed only when the fulfilment conditions and supported payout flow allow it.

### 10.4 Collection-point workflow

- Admin creates, updates or deactivates village collection points.
- Farmer views available points and selects a point for drop-off/pickup where applicable.
- The application may show collection points on a map.
- AI may recommend a point or explain a route based on available location, quantity and vehicle constraints.
- Route calculation can remain deterministic. The SRS mentions a travelling-salesperson-style approach for collection routing, but does not prescribe a particular routing provider or algorithm implementation.
- Confirm any selection/change that affects an order or collection commitment.

### 10.5 Reputation and moderation

- Calculate reputation from defined, auditable transaction records and rules.
- Record the data factors used to calculate or update the score.
- AI may explain the factors or flag unusual patterns for review.
- Do not let AI invent transaction history or automatically make a final moderation decision.
- Admin makes the final decision on flagged users, listings or requirements.

---

## 11. Notifications and realtime updates

Use Supabase Realtime for relevant live updates such as pool progress and order/payment status where enabled. Use TanStack Query for server-state caching, loading states, controlled refetching and mutation handling in both clients.

Potential notification events:

- New nearby industry requirement.
- Pool progress or pool reaching its target.
- Approved requirement-area expansion or deadline change.
- Order, payment or payout status change.
- Seasonal demand/availability alert.

The SRS identifies Expo Notifications with Firebase Cloud Messaging through the Expo setup, and also mentions WhatsApp/SMS as possible update channels. Configure and demonstrate only the channels actually integrated. Do not claim WhatsApp or SMS delivery unless those providers are implemented and tested.

Use `pg_cron` or another configured scheduled mechanism for recurring forecast/seasonal-alert jobs only where those jobs are implemented. The underlying marketplace event should remain persisted even if a notification provider is unavailable.

---

## 12. UI design-system implementation

Implement the design system in shared tokens where practical, while mapping tokens to the different styling systems used by NativeWind and Tailwind/shadcn.

### 12.1 Colour palette

| Token | Colour | Intended use |
|---|---|---|
| Forest Core | `#15803D` | Primary actions and key environmental actions |
| Vivid Growth | `#22C55E` | Positive/fulfilled states and active highlights |
| Soft Meadow | `#DCFCE7` | Light success/selection backgrounds |
| Escrow Blue | `#0070BA` | PayPal checkout and payment-related UI |
| Trust Navy | `#003087` | Financial headers and trust/verification information |
| Settlement Amber | `#F59E0B` | Pending review, weight checks or settlement-pending states |
| Error Red | `#DC2626` | Validation errors, discrepancies and expired offers |
| Background Canvas | `#F8FAFC` | Main page background |
| Surface Card | `#FFFFFF` | Card surfaces |
| High-Contrast Text | `#0F172A` | Primary readable text |
| Card Border | `#CBD5E1` | High-contrast card and control borders |

Use colour together with text/icons so transaction states are not communicated by colour alone.

### 12.2 Typography

- Primary text: Inter or the Roboto/system font available on target Android devices.
- Financial/numerical data: Space Grotesk or Chivo Mono where available, using tabular figures for currency, crop weights and metrics.
- Display heading: 24sp, bold (700).
- Section heading: 18sp, semibold (600).
- Standard body: 15sp, regular (400).
- Strong action text: 15sp, bold (700).
- Metadata: 12sp, medium (500).

Use sensible fallbacks where the specified font is not bundled or available. Avoid remote font loading as a requirement for the initial mobile screen.

### 12.3 Touch targets and outdoor legibility

- Target a minimum touch area of 56 × 56 dp for buttons, fields and interactive chips.
- Use a centered floating voice button of approximately 68 dp where that interaction is available.
- Use clear card borders (1.5 px as specified) and subtle elevation to distinguish actions under bright outdoor conditions.
- Keep labels understandable, navigation shallow and key actions available without requiring long text input.
- Display the financial summary and transaction states prominently before any confirmation.

### 12.4 Required transaction/status presentation

On the order/settlement screen, display three separate status indicators:

1. **Logistics/Fulfilment status** — where the physical waste/order is in its collection and delivery lifecycle.
2. **Payment status** — what PayPal has verified about the buyer/industry payment.
3. **Payout status** — whether the farmer payable is not yet eligible, pending, processing, completed, failed or simulated.

The interface must clearly identify Sandbox/test transactions. A payment being captured does not imply the waste has been delivered or the farmer has been paid.

---

## 13. Error handling and recovery

Show clear, user-friendly messages and preserve safe retry behaviour. Detailed technical errors should be logged server-side without exposing credentials or stack traces to clients.

| Area | Failure case | Expected handling |
|---|---|---|
| Authentication | Invalid credentials or expired session | Explain the issue; allow retry or sign-in again. |
| Network | Offline state or request timeout | Show connection status; preserve safe drafts; avoid duplicate submissions. |
| Database | Read/write failure | Do not show unsaved data as persisted; display retry guidance. |
| RLS/permissions | User lacks access | Reject the operation and show a permission-appropriate message. |
| Voice | Permission denied or recording failure | Explain the issue and offer manual text input. |
| AI service | Timeout, quota or provider unavailable | Offer retry/manual fallback; do not create a record from an incomplete result. |
| AI extraction | Missing or implausible fields | Ask the user to repeat or correct fields in the editable preview. |
| Realtime | Connection interrupted | Refetch current state; identify stale cached data and do not assume it is current. |
| PayPal create order | API error | Keep payment in a non-success state and show safe retry guidance. |
| PayPal approval | User cancels or closes checkout | Retain the correct pending/cancelled state and allow a safe retry. |
| PayPal capture | Timeout or uncertain result | Reconcile with PayPal before retrying; avoid duplicate capture. |
| Webhook | Invalid signature or unsupported event | Reject/ignore safely, log the event and do not update payment state. |
| Duplicate webhook | Same event received more than once | Process idempotently. |
| Payout | Unsupported or failed recipient flow | Keep farmer payable/payout pending or failed; never claim the farmer is paid. |
| Notification | Provider unavailable | Preserve the marketplace event; retry or show it in-app where implemented. |

General rules:

- Keep payment, order and payout states independently recoverable.
- Keep a user-entered draft when possible if an AI/network call fails.
- Show loading/progress feedback for longer AI and payment operations.
- Never interpret an AI answer, browser redirect or local UI state as proof of a database write or successful payment.
- Use idempotency or safe duplicate checks for critical submissions.

---

## 14. Security and audit requirements

### 14.1 Client security

- Use Supabase Auth sessions.
- Keep PayPal Client Secret, Gemini API key and Supabase service-role key out of client bundles.
- Do not collect or store card/bank credentials.
- Treat client validation as usability support only; repeat all critical validation in the backend/database.
- Require explicit user confirmation for consequential marketplace actions and money movement.

### 14.2 Backend/database security

- Enable and test RLS on protected tables.
- Verify the logged-in user, role, ownership, amount, quantity and allowed transaction state for privileged operations.
- Perform PayPal order creation, capture, payout initiation and webhook verification only through protected backend functions/services.
- Verify webhook authenticity before changing payment/payout state.
- Use idempotent webhook/event processing.
- Restrict AI to minimum-necessary approved application functions and authorised data.
- Record the user who confirmed a payment/payout action, the action performed and the related PayPal reference.
- Avoid sending unnecessary identity, personal or financial data to Gemini.
- Do not store PayPal secrets or payment credentials in application tables.

### 14.3 Repository and demo security

- Commit `.env.example` with placeholder values only.
- Keep `.env`, private keys, access tokens, PayPal secrets and sensitive user data out of Git.
- Use separate Sandbox configuration for the hackathon prototype.
- Label Sandbox transactions in the UI and video.
- Do not make Aadhaar/DigiLocker verification a dependency of AI or payment workflows. The README identifies it as an optional project assumption, not a mandatory hackathon requirement. Implement it only if the team has a permitted integration and sufficient time, and avoid unnecessary sensitive identity-data storage.

### 14.4 AI action audit

For AI-prepared consequential actions, preserve an audit trail sufficient to establish:

- Which authenticated user requested the action.
- What action/draft was prepared by AI.
- What final values the user reviewed and confirmed.
- When the confirmation occurred.
- Which backend operation was executed and its result.
- Which GreenRoots order/pool and PayPal reference were involved, where applicable.

Do not store secrets or unnecessary personal/financial information in the audit record.

---

## 15. Testing strategy and acceptance checks

Test the real application flows and failure paths, not just isolated screens. Use an Android device for primary mobile testing, an Android Studio emulator if useful, a modern browser for the web portal and Postman for API/webhook testing if selected.

### 15.1 Test coverage

| Area | Required checks |
|---|---|
| Mobile | Navigation, forms, microphone permissions, voice capture, editable previews, explicit confirmation and device responsiveness. |
| Web | Industry/admin workflows, responsive layout and role-based access. |
| Shared packages | Type correctness, validation rules, status constants and service behaviour. |
| Authentication | Registration, login, logout, role access and expired sessions. |
| Database | Migrations, RLS, constraints, foreign keys and data integrity. |
| Marketplace | Listing creation/edit/delete, search/filter, requirement creation and pool contribution limits. |
| Realtime | Pool progress and relevant order/status refresh. |
| AI | Structured extraction, unsupported/missing fields, invalid output, timeout, quota failure and manual fallback. |
| PayPal | Order creation, approval, capture, cancellation, failure, amount/currency mismatch and webhook verification. |
| Reliability | Duplicate submissions, repeated webhooks, delayed events and uncertain capture responses. |
| Security | No secret exposure, unauthorised record access, ownership checks and amount validation. |

### 15.2 Minimum end-to-end acceptance criteria

The hackathon prototype should not be considered demo-ready until the team can demonstrate all of the following in the deployed/test environment:

- [ ] A farmer can authenticate and create a listing using typed or voice input.
- [ ] Gemini returns structured listing fields that the farmer can review and edit.
- [ ] The listing is only persisted after the farmer explicitly confirms it.
- [ ] A buyer or industry can discover a real listing/pool using data stored in GreenRoots.
- [ ] The buyer/industry can review an order/pool amount and approve PayPal Sandbox checkout.
- [ ] The backend creates and verifies the PayPal transaction using the supported API flow.
- [ ] The PayPal webhook endpoint verifies authenticity and handles duplicate events idempotently.
- [ ] The UI displays a verified payment status and the corresponding GreenRoots order/pool reference.
- [ ] Fulfilment, payment and farmer payout are displayed as independent states.
- [ ] Unsupported or simulated payout handling is labelled accurately.
- [ ] Manual marketplace fallback remains usable when Gemini is unavailable.
- [ ] Test users cannot access or modify another user's protected records.

A successful end-to-end Sandbox checkout and verified backend status update are more important than implementing a large number of partially tested payment features.

---

## 16. Deployment implementation

Deploy the mobile app, web app and Supabase backend independently from the same monorepo.

### 16.1 Deployment targets

| Part | Deployment method | Output |
|---|---|---|
| Android app | EAS Build targeting `apps/mobile` | Android APK or configured Android distribution build. |
| Web portal | Vercel or Netlify targeting `apps/web` | Public web URL. |
| Database schema | Supabase migrations / CLI | Supabase PostgreSQL schema. |
| Edge Functions | Supabase CLI | Hosted protected backend functions. |
| Auth, Realtime and Storage | Supabase project configuration | Hosted Supabase services. |
| Gemini integration | Calls from protected Edge Functions | No separate frontend AI deployment. |
| PayPal integration | Backend API calls and registered webhook endpoint | PayPal Sandbox checkout and verified backend events. |

### 16.2 Monorepo deployment configuration

- Configure Vercel or Netlify to use `apps/web` as the web app root and install/build any workspace packages imported by the web app.
- Configure EAS Build for the Expo project under `apps/mobile`, ensuring workspace packages are available during the build.
- Deploy database migrations and Edge Functions from the `supabase/` directory using the Supabase CLI and the team's configured project.
- Configure public client variables only in the frontend deployment environments.
- Configure Gemini and PayPal private credentials as Supabase server-side secrets/environment variables.
- Configure the PayPal webhook to target the deployed webhook Edge Function and verify the deployed endpoint using Sandbox events.

### 16.3 Demo access package

Prepare the following for judging:

- Public web deployment URL.
- Android APK or clear installation instructions.
- Judge/test account instructions if authentication is required.
- PayPal Sandbox buyer/business test setup instructions as needed.
- Required environment-variable names and configuration steps, without publishing secret values.
- Database migration and local setup instructions.
- Screenshots and the demo video URL.

---

## 17. Recommended implementation order

The team should prioritise one complete, reliable transaction journey over broad but incomplete functionality.

### Phase 1 — Repository and backend foundation

- [ ] Create/configure the monorepo and workspace tooling.
- [ ] Set up `apps/mobile`, `apps/web`, `packages/*` and `supabase/`.
- [ ] Configure TypeScript and shared package imports.
- [ ] Create the Supabase project and connect both clients.
- [ ] Implement Auth, profiles, roles and the first migration/RLS policies.

### Phase 2 — Core marketplace

- [ ] Implement farmer listing CRUD.
- [ ] Implement buyer listing discovery/search/filter.
- [ ] Implement industry verification and requirement creation.
- [ ] Create a pool for each requirement.
- [ ] Implement farmer pool contributions and pool progress validation.
- [ ] Implement order and fulfilment status records.

### Phase 3 — AI workflow

- [ ] Implement the protected `ai-assistant` Edge Function.
- [ ] Implement typed listing extraction and structured preview.
- [ ] Add mobile voice capture and manual text fallback.
- [ ] Add review/edit/explicit confirmation before listing creation.
- [ ] Add AI-assisted listing/pool matching or transaction explanation using real authorised records.
- [ ] Add timeout, invalid-output and service-unavailable handling.

### Phase 4 — PayPal Sandbox workflow

- [ ] Configure PayPal Sandbox credentials and webhook registration.
- [ ] Implement backend order creation.
- [ ] Implement the platform-appropriate PayPal approval experience.
- [ ] Implement server-side capture/confirmation.
- [ ] Implement webhook signature verification and event idempotency.
- [ ] Persist PayPal references and status history.
- [ ] Display verified payment state in GreenRoots.

### Phase 5 — Payables, payouts and operational features

- [ ] Calculate farmer-wise payable amounts from accepted quantities and agreed prices.
- [ ] Record platform commission transparently.
- [ ] Verify whether the configured Sandbox supports the required farmer payout flow.
- [ ] Implement actual payouts only if supported and approved; otherwise keep the payable pending or label any simulation.
- [ ] Add collection points, relevant Realtime updates and configured notifications.
- [ ] Add forecasting/reputation enhancements if reliable data and time are available.

### Phase 6 — Hardening and hackathon submission

- [ ] Test all roles and RLS policies.
- [ ] Test AI fallback and PayPal cancellation/failure/delayed webhook scenarios.
- [ ] Check duplicate payment and webhook handling.
- [ ] Check the client bundles and Git history for leaked credentials.
- [ ] Deploy the web portal, Edge Functions and Android build.
- [ ] Prepare judge access, Sandbox instructions, public repository and licence.
- [ ] Record the actual working demo and document which features were newly implemented during the hackathon.

---

## 18. Recommended hackathon demonstration

The README recommends demonstrating one complete journey in which AI helps create and discover a transaction and PayPal enables the corresponding payment. Use the following sequence as the primary demo:

1. A farmer signs in to the Android app.
2. The farmer says or types: **“I have 200 kg of rice husk available at this location.”**
3. Gemini extracts the waste type, quantity and available listing details.
4. GreenRoots displays the editable listing draft; the farmer corrects it if needed and confirms publication.
5. An industry user or buyer searches for waste and receives relevant results/matches based on actual application data.
6. The buyer/industry reviews the selected quantity, price and total amount.
7. The buyer/industry selects PayPal Checkout and approves the payment in PayPal Sandbox.
8. GreenRoots verifies the payment through backend PayPal APIs and Webhooks and updates the correct order/payment record.
9. GreenRoots shows the verified payment result, fulfilment state and farmer-wise payable/payout state.
10. If the configured Sandbox supports payouts, demonstrate the explicitly approved and verified payout. Otherwise show the payable as pending or clearly simulated.

Keep the demonstration focused. A working listing-to-match-to-PayPal journey is stronger than a long feature tour with incomplete payment behaviour.

---

## 19. Decisions to finalise during implementation

The source documents intentionally leave some implementation details open. The team must decide, document and test these before presenting them as completed features:

- Workspace package manager and monorepo task runner.
- Final database table names, columns, relationships, indexes, status enums and RLS policies.
- Exact role/permission matrix.
- Function request/response contracts and error formats.
- PayPal currency and exact checkout/capture flow.
- Availability of PayPal Payouts for the configured Sandbox/account and recipient setup.
- Whether and how the mobile app launches the PayPal-supported approval experience.
- Exact Gemini model and supported audio input format/size.
- Whether audio is sent directly to Gemini or passes through a separate supported transcription step.
- Exact regional languages and tested speech capabilities. `DESIGN.md` lists English, Hindi, Punjabi, Marathi, Telugu and Tamil; the implemented language list must reflect what is actually translated and tested.
- Matching and reputation scoring formulas.
- Forecasting model, source data and minimum-data threshold.
- Notification channels actually configured (Expo/FCM, SMS or WhatsApp).
- Map provider and route optimisation implementation.
- Whether AG Grid, Elastic, Render, Postman automation, PayPal Agent Toolkit or PayPal MCP Server is actually used.
- Whether DigiLocker/Aadhaar verification is implemented; it is not a mandatory dependency for the AI/payment workflow.
- Final web deployment provider: Vercel or Netlify.

Only technologies and integrations that are implemented and demonstrated should be described as completed in the final project submission.

---

## 20. Hackathon submission checklist

- [ ] Functional application, not only a static website or design mock-up.
- [ ] Meaningful AI functionality demonstrated in a marketplace workflow.
- [ ] At least one complete PayPal Sandbox payment workflow demonstrated.
- [ ] Verified payment result and corresponding GreenRoots order state visible in the application.
- [ ] Public GitHub repository containing source code and required assets.
- [ ] Open-source `LICENSE` file, visible in the repository's About section as specified by the hackathon requirements.
- [ ] `.env.example` and `.gitignore` included; no real secrets committed.
- [ ] README includes problem, solution, features, technology stack, architecture, AI/PayPal integration, setup, environment configuration, Sandbox instructions, testing, screenshots and deployment/demo links.
- [ ] Public demo URL or complete setup instructions.
- [ ] Judge/test account instructions where login is required.
- [ ] Public YouTube demo video strictly under three minutes, showing the actual application and its AI + PayPal workflow.
- [ ] Clear evidence of the substantial changes implemented during the hackathon, separating pre-existing functionality from new work.
- [ ] No unsupported claims about escrow, automatic split payments, completed payouts, sponsor tools or integrations.

The five judging dimensions identified in the README should be visible in the final presentation: technological implementation, design, potential impact, innovation/idea and presentation. The strongest technical proof is a reliable AI-assisted transaction followed by a real PayPal Sandbox payment whose outcome GreenRoots verifies and displays correctly.

---

## 21. Implementation summary

GreenRoots should be implemented as one monorepo containing two platform-specific clients and one shared Supabase backend. React Native + Expo provides the Android experience for farmers and buyers; React + Vite provides the web portal for industries and admins. Shared TypeScript packages keep domain types, validation and compatible services consistent.

Supabase PostgreSQL stores authoritative marketplace and transaction data. Supabase Auth and RLS protect user and role access. Supabase Edge Functions securely orchestrate Gemini, PayPal, webhook processing and privileged marketplace operations. Gemini assists with natural-language listing/requirement creation, matching and explanations, while user review and confirmation remain mandatory for consequential actions. PayPal Sandbox handles the supported checkout flow; verified backend API responses and Webhooks determine the payment state. Fulfilment, payment and farmer payout remain separate lifecycle dimensions.

The implementation should focus first on a complete, testable farmer-listing-to-buyer/industry-checkout journey. Optional technologies and advanced operational features should be added only when they are genuinely required, supported and demonstrable.
