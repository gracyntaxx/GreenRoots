# VALIDATION.md
GreenRoots — System Requirements & Technical Validation Report

Document type: Formal technical validation report and architectural audit
Project: Agriculture Waste Management System (GreenRoots)
Basis: Project Software Requirements Specification (SRS v1.0)
Status: Validated with implementation constraints and architectural baselines defined

## Executive summary

This validation report evaluates the functional, non-functional, and operational requirements specified in the GreenRoots Software Requirements Specification (SRS). GreenRoots addresses agricultural biomass residue management (paddy straw, husk, stubble) by linking rural farming communities with commercial processing industries and local consumers.

The core architecture combines a cross-platform mobile client (React Native / Expo) for farmers and buyers with a responsive web dashboard (React / Vite) for industrial procurement and system administrators, supported by Supabase (PostgreSQL, Realtime, Auth, Storage, Edge Functions) and external integrations (PayPal, Gemini API, Expo FCM).

The evaluation confirms that the system scope is functionally sound, technically coherent, and practically implementable within a standard modern cloud stack. Specific algorithmic constraints—including Uber H3 spatial indexing for notification dispatch, Traveling Salesperson Problem (TSP) collection routing, atomic pool state management, and the hybrid multimodal audio capture pipeline—have been analyzed and mapped to concrete technical mechanisms below.

Requirement-by-requirement specification traceability matrix

### Functional area 3.1: User accounts & authentication (FR-1 to FR-4)

Specification: Multi-role registration (farmer, industry, buyer), secure session authentication, role-based logout, and mandatory administrator verification of industrial corporate accounts prior to requirement posting.

Architectural mapping: Supabase Auth handles identity tokens and encrypted credentials. A public profiles table maintains role designations (farmer, buyer, industry, admin). A dedicated industry_verifications table tracks company license submissions and approval workflows.

Verification status: Verified. Industrial posting privileges must be enforced strictly via PostgreSQL Row Level Security (RLS) policies checking is_verified = true, rather than relying on client-side routing guards.

### Functional area 3.2 & 3.7: Profiles & reputation tracking (FR-5, FR-6, FR-24)

Specification: Public/private profile views presenting user credentials, geographic location, and a persistent reputation score derived from historical transaction completions.

Architectural mapping: Deterministic scoring computed asynchronously via database triggers or scheduled jobs upon order completion. Factors include fulfillment rate, weight accuracy at delivery, deadline compliance, and mutual transaction ratings.

Verification status: Verified. The calculation rules should remain fully transparent and deterministic to maintain auditability.

### Functional area 3.3: Industry requirements, pooling & spatial dispatch (FR-7 to FR-14)

Specification: Industries publish demand specifications (crop waste variety, total tonnage, offered price per unit, delivery deadline). Surrounding farmers are alerted within a spatial boundary, contribute fractional quantities to a shared aggregation pool, track progressive completion stages, handle automatic geographic expansion if pools lag, and receive proportional disbursements upon verified drop-off.

Architectural mapping: Implemented via parent requirements and pools records with child pool_contributions. Spatial dispatch utilizes discrete geographic cells (e.g., Uber H3 hierarchical hexagonal spatial indexing).

Verification status: Verified with concurrency constraint. Simultaneous commits by multiple farmers require database-level serialization to avoid exceeding aggregate target quantities.

### Functional area 3.4: Farmer direct listings & local retail sales (FR-15 to FR-19)

Specification: Decentralized listing of available waste stocks with volume, location, and asking price; direct order placement by registered festive/local buyers; payment transfer upon completed fulfillment.

Architectural mapping: Standard relational CRUD backed by PostgreSQL B-tree and GiST spatial indexes. Mutations occur through optimistic client updates via TanStack Query.

Verification status: Verified.

### Functional area 3.5: Village collection hubs & collection route optimization (FR-20, FR-21)

Specification: Centrally managed village drop-off hubs where farmers deposit committed biomass; algorithmic consolidation for industrial collection logistics (Traveling Salesperson Problem).

Architectural mapping: Relational collection_points entity linked to municipal coordinates. Route scheduling executed via server-side optimization routines using distance matrices between active hubs and destination industrial plants.

Verification status: Verified. The TSP solver should execute asynchronously in backend Edge Functions to prevent blocking user request threads.

### Functional area 3.6: Payment workflows & transaction states (FR-22, FR-23)

Specification: Electronic payments managed through PayPal Sandbox/REST APIs, tracking end-to-end contribution and order states across progressive milestones.

Architectural mapping: Decoupled lifecycle tracking separating logistics status (PENDING, COMMITTED, COLLECTED, DELIVERED), payment capture (INITIATED, CAPTURED, REFUNDED), and recipient disbursement (PENDING, PROCESSING, COMPLETED).

Verification status: Verified.

### Functional area 3.8: Predictive demand forecasting & seasonal alerts (FR-25, FR-26)

Specification: Pre-harvest notifications alerting agricultural producers to regional demand surges, alongside analytical industrial dashboards showing projected crop-residue output by agro-climatic zone.

Architectural mapping: Historical transactional aggregates combined with regional harvesting timetables. Background cron routines (pg_cron) evaluate threshold dates and dispatch push notifications via Expo FCM.

Verification status: Verified. Forecasts must be clearly categorized as statistical estimates rather than guaranteed commodity contracts.

### Functional area 3.9: Multimodal regional voice & language processing (FR-27, FR-28)

Specification: Regional language localization across interface copy; hands-free voice-to-listing workflows capturing user speech, extracting structured listing parameters via AI, displaying an editable card preview, providing auditory readout, and publishing upon explicit user confirmation.

Architectural mapping: Static UI text localization managed via i18next. Voice pipeline uses native audio capture (expo-speech-recognition or expo-av) streaming compressed audio files (.m4a/.mp3) to Supabase Edge Functions, which call the Gemini API for structured schema extraction.

Verification status: Verified. A manual form-entry fallback remains mandatory when ambient field noise or poor network connectivity inhibits audio processing.

### Functional area 3.10: Governance & administration (FR-29)

Specification: Content moderation tools permitting platform administrators to deactivate illicit listings, remove fraudulent requirements, and suspend abusive accounts.

Architectural mapping: Soft-deletion flags (is_active, is_archived, suspended_at) backed by administrative role enforcement in database RLS.

Verification status: Verified.

## Algorithmic and technical feasibility analysis

3.1 Spatial notification dispatch: Uber H3 hexagonal indexing vs. Euclidean bounding
The SRS specifies a spatial notification mechanism comparable to ride-hailing architectures, using a greedy hexagonal dispatch model.

Technical assessment: Traditional bounding-box and radius queries (ST_DWithin in PostGIS) calculate distance on an ad-hoc basis, which can become computationally demanding under frequent high-volume queries.

Implementation recommendation: Uber's H3 library provides discrete hexagonal hierarchical spatial indexing. By storing each farmer's farmstead and each industry requirement at an H3 resolution (e.g., Resolution 7 or 8, covering roughly 1.2 to 5.2 square kilometers per cell), spatial proximity notifications become simple integer/set lookups (kRing neighbors). When a pool approaches its deadline without reaching capacity (FR-12), the backend incrementally expands the ring radius from k=1 to k=2 or k=3, notifying a wider geographic tier deterministically.

3.2 Logistics optimization: Traveling Salesperson Problem (TSP) for collection points
FR-20 designates a TSP approach to optimize industrial vehicle routing across rural aggregation hubs.

Technical assessment: The standard Traveling Salesperson Problem is NP-hard. Exact solutions via brute-force or integer linear programming are impractical for large node sets.

Implementation recommendation: Because rural aggregation clusters typically involve between 5 and 30 collection hubs per industrial requirement, heuristic approaches—such as the 2-opt or Christofides algorithm—yield near-optimal routes in less than 50 milliseconds. The computation must execute inside a Supabase Edge Function using a precomputed distance matrix (derived via open routing APIs or Haversine distances) and output the ordered waypoint array to the industry web portal.

3.3 Multi-factor matchmaking and recommendation engine
Section 2.3 defines a matchmaking pipeline incorporating proximity, frequency, reputation, pricing thresholds, and previous transaction histories.

Implementation recommendation: Execute matching through a two-stage filter:

Hard filtering: SQL predicates eliminate incompatible crop residue varieties, expired deadlines, and geographically unreachable suppliers.

Soft scoring: A weighted heuristic normalizes and combines proximity (40%), historical reputation score (30%), price alignment (20%), and past deal volume (10%). AI-assisted ranking can optionally annotate the top matches with natural-language rationale.

3.4 Hybrid on-device voice processing pipeline
FR-28 and Section 5.2 outline a low-cost, speech-driven listing engine.

Technical assessment: Performing speech recognition directly on entry-tier mobile devices in multiple regional dialects (e.g., Hindi, Punjabi, Marathi) is constrained by local model size and inference latency.

Validated architecture:

The farmer taps the microphone button; Expo Audio records compressed audio (.m4a or .mp3 at 32–64 kbps).

The mobile client sends a multipart upload containing the audio snippet to a protected Supabase Edge Function (/ai-assistant).

The Edge Function submits the audio payload directly to the Gemini API using structured JSON schema output directives (response_mime_type: "application/json").

The returned structured JSON contains parsed fields: waste_type, quantity, unit, price_per_unit, and village_location.

The client populates an editable review card. The user can adjust values manually or trigger on-device Text-to-Speech (TTS) before confirming submission.

System architecture and operational alignment

4.1 Client separation and shared domain logic

Android Mobile Client: React Native, Expo Router, NativeWind, TanStack Query, i18next, and Expo Audio. Geared toward high outdoor readability, large touch targets (minimum 56x56 dp), and straightforward voice interactions.

Web Admin/Enterprise Portal: React, Vite, Tailwind CSS, shadcn/ui, and TanStack Query. Geared toward multi-column tabular data management, requirement authoring, and route inspection.

Shared Layer: A dedicated workspace package (@greenroots/shared) maintains shared TypeScript interfaces, crop-waste classification constants, status enums, and schema validators (e.g., Zod). This prevents drift between mobile and web clients while allowing their UI frameworks to remain decoupled.

4.2 Backend topology: Supabase serverless foundation
The backend requirements in the SRS are fully accommodated within Supabase without requiring a standalone Express or Node.js server instance:

Supabase PostgreSQL: Persists transactional state, spatial geometry, and historical metrics.

Supabase Auth: Secures user sessions and embeds role metadata.

Supabase Storage: Stores temporary voice notes and photographic evidence of drop-offs.

Supabase Edge Functions: Serves as the trusted gateway executing payment operations, AI orchestration, and webhook verification.

Supabase Realtime: Pushes live pool progress updates (committed_quantity vs required_quantity) to subscribed mobile and web interfaces.

pg_cron: Drives scheduled daily checks for seasonal harvesting alerts and stale pool expansions.

Security, authentication, and external integration baselines

5.1 Authentication and role-based access control (RBAC)
User authentication is managed via Supabase Auth. Application-level RBAC is secured through PostgreSQL Row Level Security (RLS):

Public listings are readable by any authenticated user.

Requirement creation is restricted to verified industry profiles (role = 'industry' AND is_verified = true).

Pool contributions can only be initiated by active farmer profiles.

Financial modification fields and administrative moderation actions are restricted to service-role function calls and verified administrators.

5.2 Identity verification workflow (DigiLocker / Aadhaar sandbox)
Section 2.5 details a testing dependency on developer sandboxes (such as Sandbox.co.in) to simulate DigiLocker authentication and identity verification:

Operational guideline: Government identity numbers and raw Aadhaar credentials must never be stored in plain text or retained within application databases.

Implementation pattern: During sandbox testing, the user completes verification through the provider's hosted interface. The backend receives a verified identity reference token and records a boolean flag (identity_verified: true) along with a cryptographic hash of the verification receipt. No direct identity digits or sensitive documents should be exposed in client bundles or public tables.

5.3 PayPal Sandbox payment orchestration and webhook verification
The financial settlement workflow defined in FR-14, FR-19, and FR-22 follows a strict server-to-server pattern:

Client isolation: Neither the mobile app nor the web portal ever handles PayPal API secrets. The client only receives approval links or order identifiers to display the standard PayPal checkout interface.

Raw-body webhook verification: Supabase Edge Functions handling incoming PayPal webhooks must process the request body as raw text (await req.text()) rather than parsed JSON to compute and verify the PayPal HMAC-SHA256 signature against PayPal transmission headers.

Idempotency control: Every webhook event is checked against an append-only payment_webhook_events table using the unique event_id as a primary key. Repeated event deliveries must return HTTP 200 without duplicating state updates or payout entries.

Critical technical risks and implementation mitigations

6.1 Concurrency race condition on aggregation pools

Risk: When an industry pool nears its target capacity (e.g., 95 of 100 quintals filled), two farmers committing 10 quintals each at the exact same moment could cause the pool to be overfilled if the checks are performed only on the client or via standard non-locking read-then-write statements.

Mitigation: All pool commitments must execute through an atomic stored procedure (commit_to_pool) employing pessimistic row-level locking (SELECT ... FOR UPDATE) on the target row in the pools table. If current_quantity + committed_quantity > target_quantity, the transaction immediately aborts and returns an informative error to the user.

6.2 Decoupling of fulfillment, capture, and disbursement states

Risk: Conflating an order's payment capture with its delivery status can lead to accidental disbursement before physical biomass is verified at the drop-off hub.

Mitigation: Enforce three independent status columns on transactional records:

fulfillment_status: Tracks logistics progress (PENDING, COMMITTED, COLLECTED, DELIVERED).

payment_status: Tracks buyer checkout status (INITIATED, CAPTURED, REFUNDED).

disbursement_status: Tracks supplier payout state (UNALLOCATED, PENDING_AUDIT, COMPLETED).
Database constraints must strictly prohibit setting disbursement_status = 'COMPLETED' unless fulfillment_status = 'DELIVERED' and payment_status = 'CAPTURED'.

6.3 Offline handling and network latency

Risk: Intermittent 4G/5G mobile connectivity in rural farming zones can disrupt voice uploads or listing submissions.

Mitigation: TanStack Query on mobile should be configured with local persistence (AsyncStorage) for cached browsing of existing listings and active pools. For mutations (such as posting a listing or committing stock), if the network fails during an AI voice extraction, the client must preserve the user's recorded audio or typed inputs locally so the transaction can be retried without re-entering data.

## Verification and testing plan

The testing regimen must validate both individual components and the entire end-to-end transaction loop:

Unit & contract testing: Verify shared Zod validation schemas across units of measure (e.g., kilograms vs. quintals vs. metric tons) to prevent mathematical conversion errors during pooling calculations.

Postman API collection: Validate Supabase Edge Functions handling ai-assistant, paypal-create-order, paypal-capture-order, and paypal-webhook, using mock signature headers and synthetic event payloads.

Concurrency simulation: Execute concurrent commitment requests against a single aggregation pool using automated scripts to verify that row-level locks prevent over-allocation.

Device testing: Validate the React Native build on entry-to-mid tier Android hardware (3 GB to 4 GB RAM, Android 8.0+) to confirm that ambient screen contrast, audio recording permissions, and regional translation fonts render without memory leaks or UI lockups.

## Final validation conclusion

The GreenRoots Agriculture Waste Management System Software Requirements Specification is formally validated as architecturally sound, technologically feasible, and aligned with modern software engineering best practices. Development should proceed according to the unified Supabase and React Native/Vite baseline, adhering to the atomic transaction controls and security parameters detailed in this report.