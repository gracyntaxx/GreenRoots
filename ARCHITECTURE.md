# GreenRoots --- System Architecture

> **Document type:** Technical Architecture\
> **Project:** Agriculture Waste Management System (GreenRoots)\
> **Basis:** GreenRoots Software Requirements Specification (SRS)\
> **Status:** Proposed architecture for the hackathon implementation

------------------------------------------------------------------------

## 1. Purpose and architectural goals

GreenRoots connects farmers, industries and general buyers for the
discovery, collection and sale of agricultural waste. It supports
individual farmer listings as well as pooled supply against industry
requirements.

This document translates the SRS and the team's confirmed implementation
choices into a practical architecture. The architecture is designed to:

-   Support Android users (primarily farmers and buyers) and desktop web
    users (primarily industries and admins).
-   Avoid duplicating business logic across the two frontends.
-   Use one common Supabase backend and PostgreSQL database.
-   Integrate Gemini for AI-assisted marketplace workflows.
-   Integrate PayPal Sandbox for a verifiable payment workflow.
-   Require user confirmation before consequential marketplace actions
    and money movement.
-   Keep the hackathon implementation deployable and demonstrable
    without introducing unnecessary infrastructure.

### Confirmed architectural decisions

  -----------------------------------------------------------------------
  Area                                Decision
  ----------------------------------- -----------------------------------
  Repository                          One GitHub monorepo

  Android frontend                    React Native with Expo

  Web frontend                        React with Vite

  Shared code                         TypeScript packages for shared
                                      types, services and validation

  Backend platform                    Supabase

  Server-side logic                   Supabase Edge Functions

  Database                            Supabase PostgreSQL

  Authentication                      Supabase Auth

  Realtime                            Supabase Realtime where live
                                      updates are needed

  Storage                             Supabase Storage where file storage
                                      is needed

  AI                                  Gemini API, called server-side

  Payments                            PayPal Checkout / REST APIs /
                                      Webhooks in Sandbox

  Android build/distribution          EAS Build (APK)

  Web hosting                         Vercel or Netlify

  Backend hosting                     Supabase Cloud
  -----------------------------------------------------------------------

The project does **not** require a separate Express/Node.js server by
default. Supabase Edge Functions are the server-side execution layer for
protected integrations and operations. A separate server should be
considered only if an implemented requirement cannot be handled suitably
by Supabase.

------------------------------------------------------------------------

## 2. High-level system architecture

GreenRoots uses two platform-specific user interfaces connected to a
common backend.

``` mermaid
flowchart TB
    subgraph Clients["Client applications"]
        Android["Android app<br/>React Native + Expo"]
        Web["Web portal<br/>React + Vite"]
    end

    subgraph Supabase["Supabase Cloud — common backend"]
        Auth["Supabase Auth"]
        DB[("PostgreSQL")]
        RT["Supabase Realtime"]
        Storage["Supabase Storage"]
        Edge["Supabase Edge Functions"]
        Cron["pg_cron / scheduled jobs"]
    end

    Gemini["Gemini API"]
    PayPal["PayPal Sandbox<br/>Checkout / REST APIs"]
    Webhook["PayPal Webhooks"]
    Notify["Expo Notifications / FCM"]

    Android --> Auth
    Web --> Auth
    Android --> DB
    Web --> DB
    Android <--> RT
    Web <--> RT
    Android --> Storage
    Web --> Storage
    Android --> Edge
    Web --> Edge
    Edge --> DB
    Edge --> Gemini
    Edge --> PayPal
    PayPal --> Webhook
    Webhook --> Edge
    Cron --> Edge
    Edge --> Notify
```

### Main responsibilities

  -----------------------------------------------------------------------
  Component                           Responsibility
  ----------------------------------- -----------------------------------
  Android app                         Farmer and buyer mobile workflows,
                                      voice capture, regional-language
                                      UI, listings, pool participation,
                                      browsing and order status

  Web portal                          Industry and admin workflows,
                                      requirement creation, pool
                                      monitoring, forecasts, moderation
                                      and management

  Shared packages                     Common TypeScript types, validation
                                      rules, service functions and
                                      reusable non-UI business logic

  Supabase Auth                       User authentication and session
                                      management

  PostgreSQL                          Authoritative marketplace, pool,
                                      order, payment, payout and audit
                                      data

  Realtime                            Updates such as pool progress and
                                      relevant order/status changes

  Storage                             Audio or other application files if
                                      the implementation requires
                                      persistent file storage

  Edge Functions                      Protected AI calls, PayPal
                                      operations, webhook processing and
                                      privileged business operations

  Gemini                              Natural-language understanding,
                                      structured extraction,
                                      recommendations and forecast
                                      explanations

  PayPal                              Buyer/industry checkout and
                                      supported payment operations

  Notifications                       Alerts to relevant users, including
                                      new requirements and seasonal
                                      notifications
  -----------------------------------------------------------------------

The database is the authoritative source for marketplace and transaction
state. AI output and client-side state do not override verified database
or PayPal state.

------------------------------------------------------------------------

## 3. Repository and code organisation

The project will use a **monorepo**: one GitHub repository containing
the Android app, web app, shared packages and Supabase backend
resources. A monorepo does not mean a single deployment; each
application and the backend are deployed through their respective
build/deployment processes.

### Proposed directory structure

``` text
GreenRoots/
├── apps/
│   ├── mobile/                  # React Native + Expo Android app
│   │   ├── app/                  # Expo Router routes
│   │   ├── components/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── services/             # Platform-specific adapters only
│   │   └── ...
│   │
│   └── web/                     # React + Vite web portal
│       ├── src/
│       │   ├── pages/
│       │   ├── components/
│       │   ├── features/
│       │   ├── hooks/
│       │   └── ...
│       └── ...
│
├── packages/
│   ├── shared/                  # Shared TypeScript types and constants
│   ├── services/                # Shared data-access/business service functions
│   └── validation/              # Shared input and domain validation
│
├── supabase/
│   ├── migrations/              # Version-controlled SQL schema changes
│   ├── functions/
│   │   ├── ai-assistant/
│   │   ├── paypal-create-order/
│   │   ├── paypal-capture-order/
│   │   ├── paypal-webhook/
│   │   └── ...                  # Other implemented protected functions
│   ├── seed.sql                 # Optional development/demo data
│   └── config.toml
│
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── ARCHITECTURE.md
```

This is a proposed organisation, not a claim that these folders or
functions already exist. Names can be adjusted to match the team's
implementation.

### What should be shared?

  -----------------------------------------------------------------------
  Code/data                           Sharing approach
  ----------------------------------- -----------------------------------
  Domain types and interfaces         Shared package

  Waste categories, status constants  Shared package
  and common rules                    

  Input validation                    Shared package

  Supabase data-access functions      Shared package where
                                      platform-compatible

  Authentication business rules       Shared logic; session handling may
                                      need platform-specific adapters

  AI orchestration                    Common backend Edge Functions

  PayPal order and webhook logic      Common backend Edge Functions

  UI components and navigation        Separate where platform experience
                                      differs

  Voice recording and speech APIs     Android-specific implementation,
                                      with common request/response types
  -----------------------------------------------------------------------

The shared packages should contain platform-neutral TypeScript. Avoid
importing browser-only APIs into mobile-shared modules or native-only
modules into the web app.

### Monorepo build and deployment configuration

-   Vercel or Netlify should use `apps/web` as the web app's root/build
    configuration, while also being configured to install and build any
    workspace packages it imports.
-   EAS Build should build the Expo project under `apps/mobile`, with
    workspace dependencies available.
-   Supabase CLI should be run from the repository root (or with the
    appropriate project directory/configuration) to manage migrations
    and deploy functions from `supabase/functions`.
-   Use a workspace-aware package manager and configure workspace/build
    settings consistently. The exact package manager and task runner are
    implementation choices and are not mandated by the SRS.

------------------------------------------------------------------------


## 4. Technology selection and justification

The following table explains the role of each technology and why it fits the GreenRoots requirements. The SRS identifies the proposed stack; the rationale below connects that stack to the product's mobile, web, marketplace, AI and payment workflows.

| Layer | Technology | Role in GreenRoots | Reason for selection |
|---|---|---|---|
| Android application | React Native + Expo | Build the farmer/buyer mobile app | Supports a dedicated mobile experience and Expo's tooling simplifies development and Android builds during the hackathon. |
| Android navigation | Expo Router | Screen and route management | Provides file-based navigation suited to an Expo application. |
| Android styling | NativeWind | Mobile UI styling | Enables utility-style styling while retaining React Native components. |
| Web application | React + Vite | Build the industry/admin portal | Supports a browser-first interface and a fast development/build workflow. |
| Web styling/components | Tailwind CSS + shadcn/ui | Responsive portal UI | Provides reusable, consistent UI primitives and efficient dashboard development. |
| Web routing | React Router | Web page navigation | Handles distinct industry and admin portal routes. |
| Server-state management | TanStack Query | Fetching, caching and mutations | Helps both clients manage remote data, loading states, retries and cache refreshes. |
| Shared language | TypeScript | Types across apps and shared packages | Helps keep data contracts consistent between Android, web and backend-facing code. |
| Shared validation | Shared TypeScript validation package | Reuse domain/input rules | Reduces inconsistent validation between the two frontends; server-side validation remains authoritative. |
| Backend platform | Supabase | Common backend services | Provides the database, authentication, realtime, storage and Edge Functions without requiring a separately managed server for the planned scope. |
| Database | PostgreSQL (Supabase) | Persistent application data | Stores relational marketplace entities and supports constraints and transactional consistency. |
| Authentication/access | Supabase Auth + PostgreSQL RLS | Identity and data access control | Centralises authentication and enforces row-level access at the data layer. |
| Server-side integrations | Supabase Edge Functions | Protected business operations and external API calls | Keeps private credentials off clients and provides a server-side place for validation and integration logic. |
| AI | Gemini API | Natural-language extraction, assistance and explanations | Supports the AI-assisted listing, requirement and marketplace workflows described in the SRS. |
| Payments | PayPal Sandbox / REST APIs / Webhooks | Checkout and payment-state verification | Enables a demonstrable payment flow while allowing the backend to verify payment outcomes. |
| Mobile build/distribution | EAS Build | Produce Android build artifacts | Provides the Expo-aligned build process for generating an APK or configured Android distribution build. |
| Web hosting | Vercel or Netlify | Publish the browser portal | Hosts the web build independently from the mobile app and Supabase backend. |
| Backend hosting | Supabase Cloud | Host database and backend services | Keeps the common backend available to both clients without operating another application server. |

### 5.1 Technology selection boundaries

- React Native + Expo is the Android application stack; React + Vite is the web application stack. They are not one shared UI codebase.
- TypeScript types, domain rules, validation and platform-neutral service logic are the main candidates for sharing.
- Native device features (such as microphone permissions, audio capture and push notification registration) belong in the mobile app's platform-specific layer.
- Browser-specific layout, dashboard interactions and web routing belong in the web app.
- Supabase is shared infrastructure: both clients use the same project, database and authorised backend functions.
- Gemini and PayPal secrets and privileged operations stay server-side in Edge Functions.

If the team later chooses a technology or library not listed in the SRS, record it as an implementation decision rather than implying it was required by the SRS.


## 5. Frontend architecture

### 5.1 Android application

**Stack from the SRS**

-   React Native with Expo
-   Expo Router
-   NativeWind
-   TanStack Query
-   i18next
-   `expo-speech-recognition` for voice input, or the selected Expo
    audio-capture approach
-   Expo Notifications with Firebase Cloud Messaging through the Expo
    notification setup

**Primary users:** Farmers and buyers.

**Responsibilities**

-   Sign up, sign in and profile management.
-   Regional-language interface and simple navigation.
-   Voice/text-assisted listing creation.
-   Listing preview, correction and explicit publication confirmation.
-   Browse/search/filter available agricultural-waste listings.
-   View industry requirements and nearby pool opportunities.
-   Commit a quantity to a pool after reviewing and confirming it.
-   Track pool progress, orders, payment status and payout status.
-   View collection points and select a suitable point where supported.
-   Receive relevant marketplace and seasonal notifications.

**Mobile interaction principles**

-   Keep common actions visible and simple, with clear labels and large
    touch targets.
-   Show extracted voice details in an editable preview before
    publishing or committing.
-   Provide a manual text-entry fallback if voice recognition, audio
    upload or AI processing fails.
-   Do not treat a spoken request as authorisation to create a listing,
    commit stock or initiate a payment.

### 5.2 Web portal

**Stack from the SRS**

-   React with Vite
-   Tailwind CSS
-   shadcn/ui
-   React Router
-   TanStack Query

**Primary users:** Industries and admins, mainly on desktop/laptop
browsers.

**Industry responsibilities**

-   Manage industry profile and verification status.
-   Create requirements with waste type, quantity, price and deadline.
-   Use AI to extract requirement fields from natural-language
    descriptions, review the draft and confirm publication.
-   View matched farmers and pool progress.
-   Review suggestions for geographic expansion or deadline extension.
-   Approve changes to requirements where needed.
-   Review payment summaries and complete the PayPal checkout workflow.
-   View regional/seasonal availability estimates and demand forecasts.

**Admin responsibilities**

-   Review and verify industry accounts.
-   Manage users, listings and requirements.
-   Manage village collection points.
-   Review suspicious activity or AI-generated moderation flags.
-   Make final moderation decisions.
-   Review relevant audit records and transaction states.

The web portal should be responsive for supported desktop/laptop screen
sizes. The SRS identifies desktop/laptop as the primary operating
environment for industries and admins.

### 5.3 Shared frontend data flow

Both clients use the same Supabase project and common domain/service
definitions. The UI remains platform-specific where required.

``` mermaid
flowchart LR
    M["Android UI"] --> MS["Shared services/types"]
    W["Web UI"] --> WS["Shared services/types"]
    MS --> SB["Supabase client / APIs"]
    WS --> SB
    SB --> AUTH["Supabase Auth"]
    SB --> DATA[("PostgreSQL")]
    SB --> FN["Edge Functions"]
```

Use TanStack Query for server-state fetching, caching, loading and error
states in both frontends. Mutations that affect critical marketplace or
payment records must be validated and authorised by the backend/database
policies, not trusted merely because the client has validated the form.

------------------------------------------------------------------------


### 5.4 Shared code versus platform-specific code

The two frontends share selected implementation layers, not their entire presentation layer.

| Concern | Shared between Android and web? | Implementation |
|---|---|---|
| Domain models and TypeScript interfaces | Yes | `packages/shared` |
| Waste categories, role names and status constants | Yes | `packages/shared` |
| Domain validation rules | Yes | `packages/validation` |
| Platform-neutral data/service functions | Yes, where compatible | `packages/services` |
| Supabase project and database | Yes | One Supabase project |
| Authentication and authorisation rules | Rules are common; session adapters may differ | Supabase Auth, RLS and shared auth helpers |
| Screen layouts and UI components | Generally no | Native mobile UI and browser UI are implemented separately |
| Navigation | No | Expo Router on mobile; React Router on web |
| Voice capture and device permissions | No | Mobile-specific adapter |
| Desktop dashboards and browser interactions | No | Web-specific components |
| Gemini and PayPal integration logic | Yes, through the backend | Supabase Edge Functions |

**Example:** the Android listing form and the web requirement form can look and behave differently, but both can import the same waste-category types, validation rules and service contracts. Both then communicate with the same Supabase project. This avoids duplicating business rules without forcing a desktop dashboard into a mobile UI framework.


## 6. Backend architecture

Supabase is the common backend platform. The system does not need a
separate traditional backend server for the planned SRS workflows.

### 6.1 Supabase services

  -----------------------------------------------------------------------
  Supabase component                  GreenRoots usage
  ----------------------------------- -----------------------------------
  PostgreSQL                          Store profiles, listings,
                                      requirements, pools, contributions,
                                      orders, payments, payouts,
                                      collection points, forecasts and
                                      audit data

  Auth                                Register/login users and establish
                                      authenticated sessions

  Row Level Security (RLS)            Restrict access to records based on
                                      authenticated identity and role

  Realtime                            Publish relevant changes such as
                                      pool progress and order/payment
                                      state changes

  Storage                             Store audio or application files
                                      only where required

  Edge Functions                      Run protected integrations and
                                      server-side business operations

  pg_cron                             Schedule supported periodic tasks
                                      such as seasonal/forecast or
                                      reminder jobs, if implemented
  -----------------------------------------------------------------------

### 6.2 Edge Function responsibilities

The following are proposed function responsibilities. They are not
existing deployed endpoints unless the team implements them.

  -----------------------------------------------------------------------
  Function responsibility             Purpose
  ----------------------------------- -----------------------------------
  AI assistant                        Call Gemini, interpret user intent
                                      and return structured drafts or
                                      explanations

  Create PayPal order                 Validate the GreenRoots order/pool
                                      and create a PayPal order
                                      server-side

  Capture/confirm PayPal order        Verify the relevant PayPal order
                                      and perform the supported
                                      server-side capture/confirmation

  PayPal webhook                      Verify webhook authenticity and
                                      process payment events idempotently

  Marketplace operation               Perform privileged operations that
                                      should not be trusted to the client

  Payout request                      Validate and request a supported
                                      PayPal payout after explicit
                                      approval, if enabled
  -----------------------------------------------------------------------

### 6.3 Authentication and authorisation

-   Supabase Auth authenticates GreenRoots users.
-   The application maintains role information for farmer, buyer,
    industry and admin.
-   Industry requirements can only be posted by an industry account that
    has passed the required verification.
-   RLS policies should limit users to the records they are allowed to
    read or modify.
-   Privileged actions must validate the authenticated user, role,
    ownership, amount and allowed transaction state on the backend.
-   Never expose the Supabase service-role key to either frontend.
-   Admin privileges must be enforced server-side/database-side, not
    merely by hiding UI controls.

The exact RLS policies and role schema must be defined in the database
migrations and tested.

------------------------------------------------------------------------

## 7. Data architecture

Supabase PostgreSQL is the authoritative store for GreenRoots
application data.

### 7.1 Main logical entities

The following entities are derived from the SRS. They are a logical
model, not a final SQL schema.

  -----------------------------------------------------------------------
  Entity                              Purpose / key information
  ----------------------------------- -----------------------------------
  User/Profile                        User identity reference, name,
                                      role, location, profile details and
                                      reputation

  Industry Verification               Industry verification status and
                                      relevant review information

  Listing                             Farmer, waste type, quantity, unit,
                                      price, location and
                                      availability/status

  Requirement                         Industry, waste type, required
                                      quantity, price, deadline and
                                      status

  Pool                                Pool associated with a requirement,
                                      target quantity and progress/status

  Pool Contribution                   Farmer, pool, committed/accepted
                                      quantity and contribution status

  Collection Point                    Village/location details and active
                                      status

  Order                               Buyer, listing or pool reference,
                                      quantity, amount and fulfilment
                                      status

  Payment                             GreenRoots transaction reference,
                                      PayPal order/capture references,
                                      amount and payment status

  Farmer Payable / Payout             Farmer-wise payable calculation,
                                      commission allocation, payout
                                      reference and payout status

  Reputation Record                   Auditable transaction-derived
                                      factors or score history

  Forecast                            Region, period, source data period,
                                      estimated demand/availability and
                                      explanation

  Notification                        Recipient, event, delivery/status
                                      metadata

  AI Action Audit                     AI-prepared action, user
                                      confirmation, backend action and
                                      related transaction reference
  -----------------------------------------------------------------------

### 7.2 Important modelling rules

-   A pool belongs to an industry requirement.
-   A pool can have contributions from multiple farmers.
-   Each contribution must retain the farmer and the quantity associated
    with that farmer.
-   Farmer payable amounts must be calculated from the verified accepted
    contribution and agreed price.
-   Platform commission and farmer-wise payable amounts should be
    recorded transparently.
-   An order's fulfilment status, payment status and farmer payout
    status must be separate.
-   PayPal reference IDs and relevant status history should be retained.
-   AI recommendations and forecasts should be distinguishable from
    verified marketplace facts.
-   Avoid storing card/bank credentials; PayPal handles payment
    credentials.

### 7.3 Suggested transaction state separation

Do not use one generic status field for an entire transaction.

**Order / fulfilment status** --- examples based on implemented
workflow:

-   Pending
-   Ready for pickup
-   Completed
-   Cancelled (if supported)

**Payment status** --- use meaningful states required by the implemented
PayPal flow:

-   Initiated
-   Awaiting approval
-   Approved
-   Captured/completed
-   Failed
-   Cancelled
-   Refunded (where supported)

**Farmer payout status** --- track independently, for example:

-   Not eligible / not yet due
-   Pending
-   Processing
-   Completed
-   Failed
-   Simulated (only when a clearly labelled simulation is used)

The exact enum values should be finalised with the implemented workflow.
A payout must not be marked completed until a successful PayPal result
or verified status is received.

------------------------------------------------------------------------

## 8. AI architecture

Gemini supports the marketplace workflow; it is not an independent
chatbot with unrestricted authority.

### 8.1 Supported AI responsibilities

-   Interpret text or voice-derived input.
-   Extract listing fields such as waste type, quantity, unit, price and
    location.
-   Extract industry requirement fields such as waste type, quantity,
    price, location and deadline.
-   Recommend relevant listings, sellers, buyers or pool opportunities.
-   Explain pool progress and provide estimates.
-   Prepare payment summaries from authorised application records.
-   Explain verified order, payment and payout status.
-   Explain demand/availability forecasts and flag unusual patterns for
    review.

### 8.2 Controlled tool/function approach

The SRS proposes controlled application functions such as:

-   `create_listing_draft`
-   `search_listings`
-   `find_pool_matches`
-   `get_order_status`
-   `prepare_paypal_checkout`
-   `request_farmer_payout`

These are GreenRoots application functions, not functions supplied
automatically by PayPal or Gemini. Each function must validate
authentication, role, ownership, arguments and allowed state.

The AI model must not receive unrestricted database access, Supabase
service credentials, PayPal secrets or independent authority to move
money.

### 8.3 AI request flow

``` mermaid
sequenceDiagram
    actor User
    participant App as Android / Web
    participant Edge as Supabase Edge Function
    participant AI as Gemini
    participant DB as PostgreSQL

    User->>App: Enter text or record voice
    App->>Edge: Send text/audio and authenticated request
    Edge->>AI: Request intent extraction / response
    AI-->>Edge: Structured fields or response
    Edge->>Edge: Validate output shape and allowed operation
    Edge-->>App: Draft / recommendation / explanation
    App-->>User: Show editable preview
    User->>App: Correct and confirm
    App->>Edge: Submit confirmed action
    Edge->>DB: Validate and persist authorised operation
    DB-->>Edge: Result
    Edge-->>App: Confirmed application result
```

The AI response is a proposal. The user reviews and confirms it before a
consequential application action occurs.

### 8.4 Voice and regional-language flow

The SRS proposes this flow:

1.  The farmer speaks or types in the app.
2.  The Android app captures audio using the selected Expo audio/voice
    library, or captures text.
3.  The app sends the input to a protected backend function.
4.  The backend sends the input to Gemini for
    transcription/understanding and structured extraction.
5.  The backend returns structured fields or a response.
6.  The app displays the result and can read it aloud when
    supported/requested.
7.  The farmer edits incorrect or missing fields.
8.  The farmer explicitly confirms before the application creates or
    changes a record.

Use i18next translation files for regional-language interface text.
Voice recognition and language support depend on the selected capture
and AI service capabilities; unsupported or unclear input must have a
manual fallback.

### 8.5 AI fallback and data quality

-   If Gemini is unavailable, essential manual listing, browsing and
    payment workflows should remain usable where implemented.
-   If audio is unclear or fields are missing, ask the user to repeat or
    enter the details manually.
-   Validate extracted fields against application rules and current
    database records.
-   Recommendations must respect real availability, location, quantity
    and price.
-   Forecasts must identify the region and data period used.
-   If historical data is insufficient, label the forecast limited or
    unavailable rather than fabricating a prediction.
-   AI flags are advisory; admins make final moderation decisions.

------------------------------------------------------------------------

## 9. PayPal payment architecture

PayPal is a mandatory hackathon integration. The initial target is a
working PayPal Sandbox checkout flow with backend verification and
webhook processing.

### 9.1 Payment responsibilities

**Frontend**

-   Display the order/pool summary and amount.
-   Allow the user to choose PayPal checkout.
-   Present the PayPal-supported approval experience.
-   Display meaningful payment status returned by the backend.
-   Never contain the PayPal Client Secret or perform privileged payment
    operations.

**Backend (Supabase Edge Functions)**

-   Validate the logged-in user, role, order/pool ownership, amount and
    transaction state.
-   Create the PayPal order using server-side credentials.
-   Verify/capture the order through PayPal REST APIs as appropriate to
    the selected Checkout flow.
-   Verify PayPal webhook authenticity using the supported procedure.
-   Process webhook events idempotently.
-   Associate PayPal references with the correct GreenRoots order or
    pool.
-   Update payment records only after verified PayPal results.
-   Record relevant status history and audit data.

### 9.2 Checkout and webhook flow

``` mermaid
sequenceDiagram
    actor Buyer
    participant App as Android / Web
    participant Edge as Supabase Edge Function
    participant DB as PostgreSQL
    participant PP as PayPal Sandbox

    Buyer->>App: Review order and confirm checkout
    App->>Edge: Request checkout for GreenRoots order
    Edge->>DB: Validate user, order, amount and state
    DB-->>Edge: Validated order details
    Edge->>PP: Create PayPal order (server-side)
    PP-->>Edge: PayPal order ID and approval details
    Edge->>DB: Save initiated / awaiting-approval payment
    Edge-->>App: Return approval details
    App->>PP: User approves through PayPal Checkout
    PP-->>App: Return from approval experience
    App->>Edge: Request capture/confirmation
    Edge->>PP: Capture/confirm through REST API
    PP-->>Edge: PayPal result
    Edge->>DB: Store verified result and references
    PP->>Edge: Webhook event
    Edge->>PP: Verify webhook authenticity
    Edge->>DB: Idempotently reconcile payment status
    App->>Edge: Fetch current payment status
    Edge-->>App: Verified GreenRoots status
```

A browser redirect or client-side success message is not proof of
payment. The backend's verified PayPal result and webhook processing
determine the authoritative payment state. The implementation must
account for delayed or repeated webhook delivery.

### 9.3 Idempotency and reconciliation

-   Store PayPal order, capture and webhook event references as
    applicable.
-   Prevent repeated webhook deliveries from creating duplicate payment
    updates or records.
-   Validate that the PayPal amount and currency match the expected
    GreenRoots transaction.
-   Ensure an event is associated with the correct order or pool.
-   Preserve status history so delayed events can be reconciled.
-   Handle pending, failed, cancelled and delayed outcomes without
    falsely showing success.

### 9.4 Farmer payment allocation and payouts

For pooled industry requirements:

1.  Record the accepted contribution for each farmer.
2.  Calculate each farmer's payable amount from the accepted quantity
    and agreed price.
3.  Calculate and record platform commission transparently.
4.  Associate the industry payment with the relevant pool.
5.  After delivery/acceptance conditions are satisfied, determine which
    farmer payables are eligible.
6.  If the configured PayPal account and Sandbox support the required
    recipient flow, initiate PayPal Payouts only after the appropriate
    human confirmation.
7.  Update payout status only after a successful PayPal result or
    verified status.

For direct farmer listings, maintain order, payment and fulfilment
states separately and determine farmer payout eligibility according to
the implemented workflow.

**Important scope limitation:** Do not claim automatic escrow,
guaranteed marketplace split payments or instant withdrawals unless the
selected PayPal product and account actually support them. If the
Sandbox does not support the full payout flow, demonstrate the real
supported checkout/payment step and clearly show the farmer-payable
balance as pending or simulated. Never label a simulated payout as a
real completed payout.

------------------------------------------------------------------------

## 10. Core marketplace workflows

### 10.1 Farmer creates a listing with AI

1.  Farmer opens the Android app.
2.  Farmer enters text or records a voice description.
3.  Backend sends the input to Gemini.
4.  Gemini returns structured listing fields.
5.  Backend validates the output format; the application validates the
    fields against listing rules.
6.  The app displays an editable listing preview.
7.  Farmer corrects details and confirms.
8.  The authorised application operation creates the listing in
    PostgreSQL.
9.  The app displays the saved listing.

### 10.2 Industry creates a requirement and farmers contribute

1.  Verified industry user enters or speaks a requirement.
2.  AI extracts waste type, quantity, price, location and deadline where
    available.
3.  Web portal displays a structured draft for review.
4.  Industry user confirms publication.
5.  Backend creates the requirement and associated pool.
6.  Matching logic filters eligible farmers using deterministic criteria
    such as waste type, location and available quantity.
7.  Relevant farmers are notified.
8.  Farmer reviews the opportunity and confirms a contribution quantity.
9.  Backend validates and records the contribution.
10. Pool progress is updated and made available to authorised users
    through queries/realtime.
11. If the pool is not filled, the system may recommend area expansion
    or deadline extension. Changes to the industry's requirement require
    industry approval.
12. Once the required quantity is reached, the pool can be marked ready
    for pickup.

AI can rank or explain matches, but deterministic eligibility and
database validation remain authoritative.

### 10.3 Buyer purchases a farmer listing

1.  Buyer browses or searches listings.
2.  AI-assisted recommendations may rank relevant listings using actual
    application data.
3.  Buyer selects a listing and quantity.
4.  Backend validates listing availability, quantity and price.
5.  Buyer reviews the order summary.
6.  Buyer explicitly approves PayPal checkout.
7.  Backend creates the PayPal order and returns approval details.
8.  Buyer approves through PayPal Sandbox.
9.  Backend verifies/captures the payment and processes webhooks.
10. GreenRoots updates payment status from verified PayPal information.
11. Fulfilment is tracked independently.
12. After completion is verified, an eligible farmer payout can be
    processed if supported and approved.

### 10.4 Collection points

-   Admin maintains village collection-point records.
-   Farmer selects an available collection point for drop-off or pickup
    where applicable.
-   The application can show collection-point locations on a map.
-   AI may recommend a suitable point or explain a route using available
    location, quantity and vehicle constraints.
-   Route optimisation can remain deterministic; the SRS mentions a
    travelling-salesperson-style approach for collection routing.
-   Any change affecting an order or collection commitment requires
    confirmation by the relevant user.

### 10.5 Forecasting and seasonal alerts

-   Use available historical listings, completed transactions, pool
    demand, crop/harvest season information and region-level data.
-   Generate region- and period-specific demand/availability estimates.
-   Clearly identify the data period and region.
-   Present forecasts as estimates, not guaranteed quantities.
-   Use AI to explain forecasts in understandable language.
-   Schedule alerts using the selected notification mechanism and
    scheduled backend jobs where implemented.
-   Do not use a forecast to create a binding purchase commitment or
    trigger payment.

------------------------------------------------------------------------

## 11. Matching, reputation and notifications

### 11.1 Matching

The SRS identifies matching parameters such as:

-   Waste type
-   Location / proximity
-   Available quantity
-   Price and budget
-   Frequency and popularity
-   Trust and previous transactions
-   Relevant past deals

Recommended implementation approach:

1.  Apply deterministic filters for eligibility, availability, location
    and quantity.
2.  Rank eligible candidates using defined scoring rules and available
    transaction history.
3.  Optionally use AI to explain or refine recommendations.
4.  Revalidate the selected listing, farmer or pool against current
    database state before an action is committed.

The exact scoring formula is not specified in the SRS and must be
defined by the implementation team.

### 11.2 Reputation

Reputation should be calculated from defined, auditable transaction data
and rules. AI may explain score factors or flag unusual patterns, but it
should not invent transaction history or make an unexplained final
decision.

The SRS does not prescribe a numeric scoring formula; this must be
specified during implementation.

### 11.3 Notifications

The SRS identifies Expo Notifications with Firebase Cloud Messaging
through the Expo setup, as well as WhatsApp/SMS as possible external
update channels.

Potential notification events include:

-   A new nearby industry requirement.
-   Pool progress or pool readiness.
-   Requirement area expansion or an approved deadline change.
-   Order and payment status changes.
-   Seasonal demand/availability alerts.

Use the channels actually implemented and configured. Do not claim
WhatsApp or SMS delivery unless those providers are integrated and
tested.

------------------------------------------------------------------------

## 12. Error handling and recovery

Error handling must preserve user trust and transaction consistency.

  ------------------------------------------------------------------------
  Area                    Possible failure        Expected handling
  ----------------------- ----------------------- ------------------------
  Authentication          Invalid credentials,    Show clear message;
                          expired session         allow retry or sign-in
                                                  again

  Network                 No internet, timeout    Show connection state;
                                                  allow retry; avoid
                                                  duplicate submissions

  Database                Query or write failure  Show actionable error;
                                                  do not show unsaved data
                                                  as persisted

  RLS / permissions       User lacks access       Reject operation; show
                                                  permission-appropriate
                                                  message; log technical
                                                  details server-side

  Voice capture           Permission denied or    Explain
                          recording failure       permission/recording
                                                  issue and offer text
                                                  input

  AI processing           Timeout, quota,         Show retry/manual-entry
                          unavailable provider    fallback; do not create
                                                  a record from an
                                                  incomplete result

  AI extraction           Missing or implausible  Ask user to repeat or
                          fields                  correct fields in the
                                                  preview

  Realtime                Connection interrupted  Fall back to refetching
                                                  current state; do not
                                                  assume stale progress is
                                                  current

  PayPal create order     API error               Keep transaction in a
                                                  non-success state; show
                                                  retry guidance

  PayPal approval         User cancels or closes  Retain a
                          checkout                pending/cancelled state
                                                  as appropriate; allow
                                                  safe retry

  PayPal capture          Timeout or uncertain    Reconcile with PayPal
                          response                before retrying; avoid
                                                  duplicate capture

  PayPal webhook          Invalid signature or    Reject/ignore safely and
                          unsupported event       log; do not update
                                                  payment state

  Duplicate webhook       Same event delivered    Process idempotently
                          more than once          

  Payout                  Unsupported or failed   Keep payable/payout
                          recipient flow          state pending or failed;
                                                  never claim paid

  Notification            Provider unavailable    Preserve the underlying
                                                  marketplace event; retry
                                                  or show it in-app where
                                                  implemented
  ------------------------------------------------------------------------

### General error-handling rules

-   Give users plain-language messages and a recovery action where
    possible.
-   Keep detailed technical errors in server logs; do not expose secrets
    or internal stack traces.
-   Use loading states for slower AI and payment operations.
-   Use safe retry behaviour and idempotency for operations that may be
    submitted more than once.
-   Never treat an AI response, frontend redirect or local success state
    as proof of a persisted record or successful payment.
-   Preserve the user's draft when possible if AI or network processing
    fails.
-   Keep payment, order and payout states independently recoverable.

------------------------------------------------------------------------

## 13. Security architecture

Security is enforced at multiple layers.

### Client-side

-   Use Supabase Auth sessions.
-   Do not embed PayPal Client Secret, Gemini API key, Supabase
    service-role key or other private credentials.
-   Do not store card or bank credentials.
-   Validate input for usability, but do not rely on client validation
    as the security boundary.
-   Show explicit confirmation for consequential actions.

### Database and backend

-   Enable and test RLS on tables containing user or transaction data.
-   Validate role, ownership, amount, quantity and transaction state in
    protected functions.
-   Keep privileged credentials in Supabase server-side
    secrets/environment variables.
-   Verify PayPal webhook authenticity before processing events.
-   Use idempotent payment/webhook handling.
-   Restrict AI tools to the minimum approved application functions and
    data.
-   Record AI-prepared actions, user confirmations and backend outcomes
    in an audit record.
-   Avoid sending unnecessary identity, personal or financial data to
    Gemini.
-   Do not store card/bank credentials or PayPal secrets in application
    tables.

### Repository and configuration

-   Commit `.env.example` containing variable names and placeholder
    values only.
-   Add `.env` and secret-bearing files to `.gitignore`.
-   Never commit real API keys, access tokens, PayPal secrets or
    sensitive user data.
-   Use separate development/Sandbox configuration from any future
    production configuration.
-   Label all hackathon Sandbox transactions clearly as test
    transactions.

### Identity verification scope

The SRS mentions a DigiLocker/Aadhaar sandbox as an assumption but
explicitly says it is not a mandatory PayPal AI Hackathon dependency.
Implement it only if the team has a valid permitted integration and
sufficient time. Do not make it a dependency of AI or payment workflows,
and avoid unnecessary storage of sensitive identity data.

------------------------------------------------------------------------

## 14. Deployment architecture

The project uses **separate deployment targets from one monorepo**.

``` mermaid
flowchart TB
    Repo["GitHub monorepo: GreenRoots"]
    Repo --> MobileBuild["EAS Build<br/>apps/mobile"]
    Repo --> WebBuild["Vercel / Netlify<br/>apps/web"]
    Repo --> SupabaseDeploy["Supabase CLI<br/>supabase/"]

    MobileBuild --> APK["Android APK / distribution"]
    WebBuild --> URL["Public web URL"]
    SupabaseDeploy --> Cloud["Supabase Cloud<br/>Database + Auth + Realtime + Storage + Edge Functions"]

    APK --> Cloud
    URL --> Cloud
    Cloud --> Gemini["Gemini API"]
    Cloud --> PayPal["PayPal Sandbox"]
    PayPal --> Cloud
```

### Deployment targets

  -----------------------------------------------------------------------
  Part                    Deployment method       Output
  ----------------------- ----------------------- -----------------------
  Android app             EAS Build               APK or other configured
                                                  Android build

  Web portal              Vercel or Netlify       Public website URL

  Database/schema         Supabase migrations /   Supabase PostgreSQL
                          CLI                     schema

  Edge Functions          Supabase CLI            Hosted server-side
                                                  functions

  Auth, Realtime, Storage Supabase project        Hosted Supabase
                          configuration           services

  AI integration          Backend function calls  No separate frontend AI
                          Gemini                  deployment

  PayPal integration      Backend function calls  Sandbox checkout and
                          PayPal APIs; webhook    verified events
                          endpoint configured     
                          with PayPal             
  -----------------------------------------------------------------------

### Important monorepo deployment detail

Even though all code is in one repository, the hosting/build tools
target different application directories:

-   Web hosting uses `apps/web` as its app root and must build required
    shared workspace packages.
-   EAS builds the Expo project in `apps/mobile` and must have access to
    shared workspace packages.
-   Supabase migrations and functions are deployed from the `supabase/`
    directory using the Supabase CLI.

Therefore, one repository can produce a website, an Android APK and a
separately hosted backend.

### Environment configuration

Use separate environment configuration for local development, web,
mobile build and Supabase server-side functions as appropriate.

Examples of configuration categories (actual variable names should match
the implementation):

-   Supabase project URL and public/anon key for clients.
-   PayPal Sandbox Client ID for the supported client checkout
    integration, where needed.
-   PayPal Client Secret and access-token credentials only as
    server-side secrets.
-   Gemini API key only as a server-side secret.
-   Any notification provider credentials only in the appropriate
    protected environment.

Do not put private keys in Expo public environment variables or Vite
variables exposed to the browser. Public client configuration is not a
substitute for backend authorisation.

### Demo access

The hackathon submission should provide:

-   Public web deployment URL.
-   Android APK or installation instructions.
-   Judge/test account instructions where authentication is required.
-   PayPal Sandbox buyer/business test setup instructions as needed.
-   Required environment-variable names and setup steps, without secret
    values.
-   Database migration and local setup instructions.
-   Demo video URL, strictly under three minutes as specified in the
    SRS.

------------------------------------------------------------------------

## 15. Performance, reliability and scalability

The SRS targets a normal response time of approximately 3--5 seconds and
expects pool progress to update soon after a farmer commits a quantity.

Recommended practices:

-   Use TanStack Query caching and controlled refetching for server
    state.
-   Use Supabase Realtime for relevant live pool/order updates where
    useful.
-   Keep database queries filtered and paginated for listings and
    dashboards.
-   Add appropriate indexes after reviewing actual query patterns.
-   Keep AI calls outside latency-sensitive database transactions.
-   Show loading/progress feedback for AI calls and checkout.
-   Use database constraints and backend validation to protect quantity
    and payment consistency.
-   Make webhook processing idempotent and able to handle delayed
    events.
-   Use scheduled jobs only for implemented recurring tasks such as
    seasonal alerts or forecast refreshes.
-   Monitor Supabase, Gemini and PayPal service errors and quotas during
    the hackathon.

The architecture can evolve as usage grows, but the SRS does not specify
traffic volumes or service-level objectives beyond its stated
response-time expectation. Avoid claiming capacity or scalability
guarantees that have not been tested.

------------------------------------------------------------------------

## 16. Testing strategy

The SRS identifies Android device testing, optional Android Studio
emulator, Chrome and Postman.

Recommended test coverage:

  -----------------------------------------------------------------------
  Area                                What to test
  ----------------------------------- -----------------------------------
  Android                             Navigation, forms, voice
                                      permissions, preview/confirmation,
                                      device responsiveness

  Web                                 Industry/admin workflows,
                                      responsive layout, role-based
                                      access

  Shared packages                     Validation rules, types and service
                                      behaviour

  Authentication                      Registration, login, logout, role
                                      access and session expiry

  Database                            RLS policies, constraints,
                                      migrations and data integrity

  Marketplace                         Listing creation/editing, search,
                                      requirement creation and pool
                                      contributions

  Realtime                            Pool progress and order status
                                      refresh

  AI                                  Structured extraction,
                                      invalid/missing fields, timeout and
                                      manual fallback

  PayPal                              Order creation, approval, capture,
                                      cancellation, failure and webhook
                                      verification

  Reliability                         Duplicate submissions, repeated
                                      webhook events and delayed payment
                                      updates

  Security                            Secret exposure checks,
                                      unauthorised access and
                                      amount/ownership validation
  -----------------------------------------------------------------------

Use PayPal Sandbox for the demonstration. A successful end-to-end
checkout and verified backend status update are more important than
implementing many untested payment features.

------------------------------------------------------------------------

## 17. Hackathon implementation priorities

The SRS recommends focusing on a reliable end-to-end transaction journey
rather than many partially working features.

Suggested order:

1.  **Core marketplace:** Authentication, farmer listing, industry
    requirement, buyer discovery, pool contribution and order status.
2.  **AI workflow:** Voice/text listing draft with structured preview
    and confirmation; AI-assisted matching or transaction assistance.
3.  **PayPal workflow:** Sandbox order creation, checkout approval,
    server-side capture/confirmation and webhook verification.
4.  **Payment allocation:** Farmer-wise payable ledger and platform
    commission; real Payouts only if supported by the configured
    Sandbox/account.
5.  **Security and reliability:** RLS, role checks, amount validation,
    webhook verification, idempotency and distinct transaction states.
6.  **Demo readiness:** Public deployment, test accounts, Sandbox
    instructions, public repository, licence, README and short
    demonstration video.

### Recommended demonstration journey

1.  Farmer says or types: "I have 200 kg of rice husk available at this
    location."
2.  Gemini extracts the waste type and quantity into a structured draft.
3.  Farmer reviews, edits and confirms the listing.
4.  Buyer or industry searches and receives a relevant AI-assisted
    match.
5.  Buyer/industry reviews the order and amount.
6.  Buyer/industry approves PayPal Sandbox checkout.
7.  Backend verifies the PayPal transaction through the supported API
    flow and webhook processing.
8.  GreenRoots updates the payment and order records.
9.  GreenRoots displays the farmer-wise payable amount and payout state;
    any actual payout is shown only if supported and verified.

------------------------------------------------------------------------

## 18. Decisions still to be finalised during implementation

The SRS and confirmed architecture do not specify every implementation
detail. The team should finalise these without treating them as already
decided:

-   Exact workspace package manager and monorepo task runner.
-   Final database tables, columns, relationships, indexes and RLS
    policies.
-   Exact API/function request and response schemas.
-   Exact role and permission matrix.
-   PayPal currency, supported checkout/capture flow and whether Sandbox
    Payouts are available for the configured account.
-   Whether AI audio is sent directly to Gemini or transcribed through a
    separate supported step.
-   Exact regional languages and tested voice capabilities.
-   Matching and reputation scoring formulas.
-   Forecasting model/data sources and minimum data requirements.
-   Notification channels actually configured (Expo/FCM, SMS or
    WhatsApp).
-   Map provider and route optimisation implementation.
-   Whether DigiLocker/Aadhaar sandbox verification is implemented.
-   Final deployment provider choice between Vercel and Netlify.

Only technologies and integrations that are actually implemented and
demonstrated should be described as completed in the final project
submission.

------------------------------------------------------------------------

## 19. Architecture summary

GreenRoots uses a **monorepo with two platform-specific frontends and
one common Supabase backend**:

-   React Native + Expo delivers the Android experience for farmers and
    buyers.
-   React + Vite delivers the web portal for industries and admins.
-   Shared TypeScript packages reduce duplicated domain logic,
    validation and service code.
-   Supabase provides PostgreSQL, Auth, Realtime, Storage and Edge
    Functions.
-   Gemini is called through protected backend functions for AI-assisted
    marketplace tasks.
-   PayPal Sandbox handles the supported checkout workflow; backend APIs
    and verified webhooks determine payment status.
-   AI-prepared actions require user review and explicit confirmation.
-   Order fulfilment, payment and farmer payout are tracked separately.
-   The Android app, web portal and Supabase backend are deployed
    independently, even though their source code lives in one GitHub
    repository.

This architecture follows the GreenRoots SRS while keeping the hackathon
implementation focused, secure and practical.
