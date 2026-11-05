# Software Requirements Specification (SRS)
## Project Title: Agriculture Waste Management System (GreenRoots)

# 1. Introduction

## 1.1 Purpose

The purpose of this document is to specify the functional and non-functional requirements of the Agriculture Waste Management System.

It is meant to be used as a reference while designing, building and testing the application.

**Modification for AI Hackathon:** This SRS also specifies how GreenRoots will integrate PayPal and Artificial Intelligence into its agricultural-waste marketplace and payment workflows. Both integrations must be demonstrated in the working prototype, not merely described.

## 1.2 Scope

GreenRoots is a platform (mobile/website) that connects farmers with industries and general buyers for the sale of agricultural waste such as straw, husk, stubble and more.

Industries post what they need, and farmers nearby are notified. Several farmers can contribute to the same requirement (called a pool), and each farmer is paid for the quantity they gave.

Farmers can also list their own waste for sale, and any registered buyer can purchase it directly. This reduces the dependence on industries. (Pick-up by companies.)

The system also provides village collection points (show map and locations), reputation scores, seasonal alerts, demand forecasting for industries (sends alert to start preparing for seasonal surges), and voice and regional language support for farmers (voice chat or text).

**Modification for AI Hackathon:**
- GreenRoots will include an AI-assisted agricultural-waste marketplace and payment workflow.
- PayPal will collect payments for eligible orders and industry requirements through PayPal Checkout / PayPal Payments APIs. Payment status will be verified on the backend using PayPal REST APIs and Webhooks.
- The system will maintain each farmer's contribution and payable amount. Where supported by the configured PayPal account and sandbox capability, farmer payments may be initiated using PayPal Payouts. A payout must not be marked completed until a successful PayPal result or verified status is received. If the sandbox does not support the complete recipient payout flow, the prototype must label any simulated step as a simulation.
- An AI assistant will help farmers create listings, help industries describe requirements, recommend relevant matches, explain pool progress and prepare payment actions. Any money movement requires the appropriate user's explicit confirmation.
- AI-based demand forecasting and buyer/seller recommendations will support the marketplace rather than operate as an unrelated chatbot.
- The central hackathon use case is: **AI helps create and match agricultural-waste transactions, while PayPal enables the corresponding payment workflow.**

## 1.3 Definitions, Acronyms, and Abbreviations

- User - A registered person using the application
- Farmer - User who contributes to a pool or sells agri-waste
- Industry - User who posts requirements for agri-waste
- Local festive buyers - General user who buys waste listed by farmers
- Admin - System administrator
- Requirement - An order posted by an industry with waste type, quantity, price and deadline
- Pool - The combined contributions of several farmers against one requirement
- Listing - Agri-waste put up for sale by a farmer
- Collection Points - A village location where waste is dropped off and picked up
- Reputation Score - A score built from a user's past transactions
- SRS - Software Requirement Specification

**Modification for AI Hackathon:**
- AI Agent - An AI-powered assistant that interprets user requests and helps perform marketplace or payment-related tasks through controlled application functions.
- PayPal Sandbox - PayPal's testing environment used to develop and demonstrate payment workflows without processing real payments.
- PayPal Checkout - PayPal's checkout experience used by a buyer or industry to approve a payment.
- PayPal Webhook - A PayPal event notification received by the backend to verify and update payment status.
- Payout - A payment sent to a farmer or other eligible recipient through a supported PayPal payout capability.
- Human-in-the-loop confirmation - Explicit user approval required before an AI-prepared payment or payout action is executed.

# 2. Overall Description

## 2.1 Product Perspective

The system gives farmers a way to sell crop waste instead of burning it, and gives industries a steadier supply from local farmers.

**Modification for AI Hackathon:** GreenRoots will connect its marketplace workflow to an AI-assisted transaction workflow. AI will help users discover and prepare transactions, while PayPal will handle supported payment operations. This creates a direct relationship between the AI functionality and PayPal.

## 2.2 User Characteristics

Farmers may have limited experience with mobile applications, so the app should be simple and available in regional languages with voice input.

Buyers should have basic knowledge of using mobile applications.

Industries should have basic knowledge of using web applications.

Admin should have basic system management knowledge.

Industries and admins will mainly work on larger screens (desktop or laptop) through the web portal.

**Modification for AI Hackathon:** The AI assistant should use simple, understandable language and present a reviewable summary before creating a listing, joining a pool, placing an order or initiating a payment. Farmers must be able to correct information extracted from voice input. AI must not independently commit a farmer to a transaction or move money without user confirmation.

## 2.3 Operating Environment

Client (Farmers and Buyers): Android smartphones running Android 8.0 or above, using the mobile application built with React Native (Expo).

Client (Industries and Admins): Web portal accessed from a modern web browser (Chrome, Edge or Firefox) on Windows, macOS or Linux, on desktop or laptop screens.

Backend: Supabase cloud (PostgreSQL, Authentication, Realtime, Storage and Edge Functions).

Network: Internet connection (Wi-Fi, 4G or 5G).

External Services: PayPal payment gateway, push notification service (Cloud Messaging through Expo), updates through WhatsApp, SMS OTP provider and speech/text recognition service, chatbot and agentic workflow.

Algorithm to suggest and filter customised buyers and sellers based on parameters like frequency, popularity, trust, previous deals, good deals, location and budget.

**Modification for AI Hackathon:**
- **PayPal:** PayPal Developer Sandbox, PayPal JavaScript SDK / Checkout, PayPal REST APIs and Webhooks. PayPal Payouts may be used for farmer payouts if the required sandbox functionality and account configuration are available.
- **AI:** Gemini API may be used for voice transcription/understanding, natural-language listing creation, requirement extraction, recommendations and demand-forecast explanations. AI processing must take place through a protected backend or server-side function; API secrets must not be exposed in the mobile or web client.
- **PayPal AI resources:** The PayPal AI Toolkit, PayPal Agent Toolkit and PayPal MCP Server are available resources in the supplied guide. They are optional implementation choices, not mandatory requirements. Use one only if its actual capabilities fit the implemented workflow and can be tested reliably.
- **Backend orchestration:** Supabase Edge Functions or a protected backend service will call PayPal APIs and AI services. The client must not contain PayPal secrets.
- **Optional sponsor tools:** Render may be considered for hosting; Postman for API testing; AG Grid for data-heavy industry/admin dashboards; APIMatic for API integration support; Bryntum for scheduling/visualisation; and Zapier for external workflow automation. These are optional and should be included only if actually used.
- The existing React Native, React, Supabase and Expo stack can be retained. The hackathon does not require replacing the existing stack with sponsor tools.

## 2.4 Constraints

Internet connectivity is mandatory.

System performance depends on Supabase server availability.

Payments depend on the third-party payment gateway.

**Modification for AI Hackathon:**
- PayPal Sandbox availability, API limits, supported features and account configuration may affect payment and payout testing.
- AI functionality depends on the availability, latency and usage limits of the selected AI provider.
- PayPal Client ID and Secret, AI API keys and other credentials must be stored securely as environment variables or server-side secrets. Secrets must never be committed to the public repository or exposed in frontend code.
- The prototype must distinguish successful PayPal transactions from pending, failed, cancelled or simulated transactions.

## 2.5 Assumptions and Dependencies

Users provide accurate profile and waste information, DigiLocker verification Aadhaar. (Several Indian API aggregators provide a Free Sandbox (Testing) Environment built specifically for developers to test workflows without spending money or needing official corporate licenses.

1. Recommended Free Sandbox Providers

- Sandbox.co.in: They provide mock datasets and a free sandbox workflow where you can generate a mock DigiLocker URL, log in using mock credentials, and receive a clean JSON response containing a test Aadhaar profile.)

Supabase and the third-party services remain operational.

Users possess Android devices compatible with React Native (Expo) applications.

Industries and admins have a computer with a modern web browser.

**Modification for AI Hackathon:**
- PayPal Developer Sandbox accounts and credentials will be available for development and demonstration.
- The project will use test transactions and test accounts for the hackathon demonstration. No sandbox payment shall be represented as a real payment.
- The DigiLocker/Aadhaar sandbox reference is an existing project assumption, not a PayPal AI Hackathon requirement. Implement it only if the team has a valid, permitted integration and sufficient time. Do not make Aadhaar data a dependency of the PayPal payment or AI workflow, and do not store sensitive identity data unnecessarily.
- AI-generated listing, matching, forecast and risk outputs are recommendations or extracted information and must be validated against application data before affecting a transaction.
- The team will provide judges with a working demo or complete setup instructions, test access where required, and a public repository.

# 3. Functional Requirements

## 3.1 User Account & Authentication

FR-1: The system shall allow users to sign up as a farmer, industry or buyer.

FR-2: The system shall allow registered users to log in securely.

FR-3: The system shall allow users to log out from the system.

FR-4: The system shall let the admin verify industry accounts before they can post requirements.

**Modification for AI Hackathon:** PayPal account approval and payment execution shall be separate from GreenRoots user authentication. GreenRoots will authenticate its own users through Supabase Auth, while PayPal will handle payment approval and processing through its supported checkout flow. The system must associate each PayPal order/payment reference with the relevant GreenRoots order or pool.

## 3.2 Profile Management

FR-5: The system shall provide a profile page showing the user's name, location and role details.

FR-6: The system shall display the user's reputation score on the profile.

**Modification for AI Hackathon:** Where relevant, the profile may display a user's PayPal-linked payout readiness/status without displaying sensitive PayPal credentials or private financial information. Do not assume every user must link a PayPal account unless the selected payout workflow requires it.

## 3.3 Industry Requirements and Pooling

FR-7: The system shall allow industries to post a requirement with waste type, quantity, price and deadline.

FR-8: The system shall notify farmers in the area when a new requirement is posted. (Uber's system design, and greedy approach based on hexagons on map, extend if required.)

FR-9: The system shall create a pool for every requirement.

FR-10: The system shall allow farmers to commit a quantity to a pool.

FR-11: The system shall show pool progress, i.e. quantity committed against quantity required, and also track in stages.

FR-12: If a pool is not filled by close deadline, the system shall automatically extend the area to other providers and notify the farmers and the industry. Extend deadline if industries agree.

FR-13: The system shall mark the pool as ready for pickup once the required quantity is reached.

FR-14: The system shall divide the payment among the farmers in proportion to their contribution after delivery. (Set prices per kg, receive money from client, take commission, then let seller withdraw money via PayPal.)

**Modification for AI Hackathon:**
- For FR-7 and FR-8, AI may extract waste type, quantity, price, location and deadline from an industry's natural-language request, then show a structured draft for review and confirmation before publishing. AI-based matching may rank nearby farmers using waste type, location, available quantity, price and relevant transaction history.
- For FR-8, the existing geographic notification logic may be retained. AI recommendations should complement, not replace, deterministic distance and eligibility checks.
- For FR-10 and FR-11, AI may explain a pool's remaining quantity, estimate whether the deadline is likely to be met, and suggest eligible farmers or nearby areas. The actual quantity committed must be confirmed by the farmer.
- For FR-12, any deadline extension or expansion that changes an industry's requirement must follow the industry's approval. AI may recommend an extension but must not silently change the requirement.
- For FR-14, the system shall calculate each farmer's payable amount from the verified accepted contribution and agreed price, and maintain a transaction-level breakdown.
- For FR-14, the industry shall approve and pay the relevant amount through PayPal Checkout / PayPal Payments in the supported workflow. The backend shall create the PayPal order, capture or confirm payment using PayPal REST APIs, and associate the verified PayPal transaction reference with the pool.
- For FR-14, the backend shall process PayPal Webhook events and verify payment status before marking an order or pool payment as successful. A browser redirect alone shall not be treated as proof of payment.
- For FR-14, the platform commission and each farmer's payable amount shall be calculated and recorded transparently. Farmer payouts may be initiated through PayPal Payouts where the sandbox and recipient setup support it. The system shall record payout status and reference IDs.
- For FR-14, AI may prepare a payout summary and flag unusual amounts or mismatches for review. A human user with the appropriate role must approve the payout action. AI must not autonomously transfer funds.
- **Feasibility note:** Do not promise automatic escrow, legally compliant marketplace split payments, or guaranteed instant withdrawals unless the chosen PayPal product/account actually supports that flow. If the sandbox does not support the complete recipient payout flow, demonstrate the real supported PayPal payment step and show the remaining farmer-payable/payout state transparently rather than falsely marking it as paid.

## 3.4 Farmer Listings and Buying

FR-15: The system shall allow farmers to list available waste with type, quantity, price and location, and filter too.

FR-16: The system shall allow farmers to edit or delete their listings.

FR-17: The system shall allow buyers to search and browse listings by keyword, waste type and location.

FR-18: The system shall allow buyers to place an order on a listing.

FR-19: The system shall pass the payment of an order to the farmer after the order is completed.

**Modification for AI Hackathon:**
- For FR-15, farmers may create a listing by typing or speaking naturally. Gemini may extract the waste type, quantity, unit, price and location into a structured listing draft. The app shall display a preview, read it aloud when requested, and require the farmer to confirm before publishing.
- For FR-16, AI may help the farmer edit a listing through natural-language instructions, but the farmer must review and confirm the resulting changes.
- For FR-17, AI-assisted semantic search and recommendations may help buyers discover relevant listings. The final results must still respect actual listing availability, location, quantity and price stored in the database.
- For FR-18, the buyer shall review the order details and total amount, then approve payment using PayPal Checkout. The backend shall create the PayPal order and verify its completion through PayPal APIs and Webhooks.
- For FR-19, the system shall update the order's payment and fulfilment states separately. After delivery/completion is verified, the backend may initiate the eligible farmer payout through PayPal Payouts if supported by the configured account and sandbox. The system shall not mark the farmer as paid until the payout result is verified.
- AI may explain order status, summarise the transaction and flag inconsistent order or payment details. AI recommendations must not override verified database or PayPal transaction status.

## 3.5 Collection Points

FR-20: The system shall maintain a list of village collection points (algorithm -- travelling salesman algorithm, so that the industry vehicles can come and collect), which the admin can add and update.

FR-21: The system shall allow farmers to choose a collection point for drop-off or pickup of their waste.

**Modification for AI Hackathon:** AI may recommend a suitable collection point or summarise a collection route using location, quantity and vehicle/collection constraints available to the system. Route calculation itself may remain deterministic. Collection-point selection and any resulting change to an order must be confirmed by the relevant user. This is supportive and does not replace the mandatory PayPal and AI transaction workflow.

## 3.6 Payments and Order Status

FR-22: The system shall support online payment through PayPal payment gateway.

FR-23: The system shall show the status of every pool contribution and order (pending, ready for pickup, completed).

**Modification for AI Hackathon:**
- FR-22 is a **mandatory core hackathon integration**. The system shall use PayPal Developer Sandbox and at least one supported PayPal developer technology, such as PayPal Checkout / JavaScript SDK and PayPal REST APIs.
- The backend shall create and capture/confirm PayPal orders using server-side API calls. The frontend shall use the PayPal-supported checkout experience to let the payer approve the payment.
- The backend shall validate PayPal API responses and process relevant Webhooks. It shall prevent duplicate processing of the same payment event and associate payment references with the correct GreenRoots order or pool.
- The application shall show meaningful payment states such as initiated, awaiting approval, approved, captured/completed, failed, cancelled and refunded where supported by the implemented flow.
- The application shall not store card or bank credentials. Payment credentials are handled by PayPal.
- FR-23 shall distinguish order fulfilment status, payment status and farmer payout status. An order can be paid but not yet delivered, or delivered but awaiting payout.
- AI may answer questions about a user's own transaction status using authorised GreenRoots records. It must not invent a payment result or claim that a transaction succeeded without verified status.
- Any AI-prepared payment or payout action must show the amount, recipient/purpose and related order/pool and obtain explicit user confirmation before execution.

## 3.7 Reputation Score

FR-24: The system shall calculate a reputation score for farmers, industries and buyers based on their past transactions.

**Modification for AI Hackathon:** The system may use AI to explain reputation factors or identify unusual transaction patterns for admin review. The actual score should be based on defined, auditable transaction data and rules. AI must not invent transaction history or make an unexplained final decision about a user's reputation.

## 3.8 Alerts and Demand Forecasting

FR-25: The system shall send seasonal alerts to farmers before harvest about the expected demand for waste.

FR-26: The system shall show industries the expected availability of waste by region and season.

**Modification for AI Hackathon:**
- AI forecasting may analyse available historical listings, completed transactions, pool demand, crop/harvest season information and region-level data to estimate future waste availability and demand.
- The system shall identify the data period and region used for a forecast and present the output as an estimate, not a guaranteed quantity.
- AI may generate plain-language explanations and alerts for farmers and industries, including suggested preparation actions.
- If historical data is insufficient, the system shall clearly label the forecast as limited or unavailable rather than fabricate a prediction.
- Forecasts may inform AI-assisted recommendations and industry planning, but shall not trigger payments or create binding purchase commitments.

## 3.9 Language and Voice Support

FR-27: The system shall support regional languages.

FR-28: The system shall support voice input for main actions such as listing waste and committing to a pool. So chatbot asks about listing, voice or text Q&A, automatic listing card preview, say it out loud, then confirm post.

**Modification for AI Hackathon:**
- Gemini may process recorded voice or text and extract the information required for a listing, pool contribution or marketplace query.
- Proposed flow: farmer speaks or types → app records audio or captures text → backend sends input to Gemini → AI returns structured fields/response → app displays or reads out a preview → farmer edits if required → farmer confirms → application performs the requested action.
- The AI assistant may answer questions about listing requirements, pool progress, order status and payment status using data the logged-in user is authorised to access.
- The AI assistant shall not create a listing, commit a quantity, place an order or initiate a payment solely from an unconfirmed interpretation of speech.
- The app shall handle unclear audio, unsupported language, missing fields and AI/API errors by asking the user to repeat or enter information manually.
- API keys and sensitive prompts containing personal or transaction information must be handled securely on the backend.

## 3.10 Admin Functions

FR-29: The system shall allow the admin to remove users, listings or requirements that break the rules.

**Modification for AI Hackathon:** AI may flag suspicious listings, unusual transaction patterns, duplicate activity or potentially misleading information for admin review. The admin shall make the final moderation decision. AI flags alone must not automatically establish fraud or permanently remove a user.

## 3.11 AI-Assisted Marketplace and Transaction Agent (New)

**Modification for AI Hackathon: New requirements:**
- FR-30: The system shall provide an AI assistant through which farmers, buyers and industries can make supported marketplace requests using text or voice.
- FR-31: The AI assistant shall identify the user's intent and extract relevant structured fields, such as waste type, quantity, price, location, deadline and order reference, where applicable.
- FR-32: The system shall validate AI-extracted fields against application rules and database records before creating or updating a listing, requirement, pool contribution or order.
- FR-33: The AI assistant shall recommend suitable buyers, sellers or pool opportunities based on relevant parameters such as location, waste type, quantity, price, availability and verified transaction history.
- FR-34: The AI assistant shall be able to prepare a payment summary for an eligible order or pool, including amount and related transaction reference.
- FR-35: The AI assistant may invoke approved backend functions to prepare a PayPal checkout or payout workflow. The backend shall enforce authentication, role permissions, amount validation and transaction-state checks.
- FR-36: The system shall require explicit user confirmation before creating a PayPal payment, capturing a payment where user approval is required, or initiating a farmer payout.
- FR-37: The system shall return verified payment and payout outcomes to the application and AI assistant. The AI assistant shall explain those outcomes without altering the authoritative transaction state.
- FR-38: The system shall maintain an audit record of AI-prepared actions, user confirmations, backend actions and corresponding PayPal transaction references, without storing payment secrets.
- FR-39: The system shall provide safe fallback behaviour when the AI service is unavailable. Users shall still be able to use essential manual listing, browsing and payment workflows where implemented.

**Implementation note:** The AI agent can initially use a controlled set of backend functions such as `create_listing_draft`, `search_listings`, `find_pool_matches`, `get_order_status`, `prepare_paypal_checkout` and `request_farmer_payout`. These are proposed application functions, not claims that PayPal supplies functions with these exact names. The backend must enforce permissions and validate all arguments. The agent should not receive unrestricted database access or PayPal credentials.

# 4. Non-Functional Requirements

## 4.1 Performance Requirements

The system should respond within 3-5 seconds under normal load.

Pool progress should update soon after a farmer commits a quantity.

**Modification for AI Hackathon:** AI responses may take longer than ordinary application operations. The interface shall show loading/progress feedback and handle timeouts or provider errors. Payment confirmation shall depend on verified PayPal responses/Webhooks, not on a fixed response-time assumption. Payment and pool updates must remain consistent if a webhook arrives after the user leaves the checkout page.

## 4.2 Security Requirements

Authentication shall be handled securely using Supabase Auth.

User passwords shall not be stored in plain text.

Only verified industries (license number) shall be able to post requirements.

Card or bank details shall not be stored by the system; they are handled by the payment gateway.

Unauthorized access shall be restricted.

**Modification for AI Hackathon:**
- PayPal Client Secret, access tokens, Gemini API keys and other private credentials shall be stored only in protected server-side environment variables/secrets.
- PayPal order creation, capture, payout initiation and webhook verification shall be performed by protected backend functions or services.
- Webhook authenticity shall be verified using the PayPal-supported verification procedure before changing payment state.
- Backend functions shall verify the logged-in user's identity, role, order ownership, amount and allowed transaction state before performing a payment-related action.
- AI tools shall expose only the minimum approved functions and data needed for the task. The AI model shall not receive PayPal secrets or unrestricted payment authority.
- Explicit confirmation shall be required before money movement. The system shall record the user who confirmed the action and the related transaction reference.
- The application shall avoid sending unnecessary personal, identity or financial data to the AI provider.
- The public GitHub repository shall not contain `.env` files, private keys, access tokens, real user financial data or production credentials.

## 4.3 Usability Requirements

The system should be easy to use for people with little technical or reading experience.

Navigation should be simple, with clear icons and large buttons.

The interface should be responsive across different Android devices.

The web portal should adapt to desktop and laptop screen sizes.

**Modification for AI Hackathon:** Payment and AI flows shall provide clear summaries, understandable status messages, visible confirmation steps and error recovery. Users shall be able to complete key tasks without relying exclusively on AI. The interface shall clearly identify sandbox/test transactions during the hackathon demo.

## 4.4 Reliability Requirements

The system should not lose pool commitments, orders or payment records.

User data should be stored securely in the PostgreSQL database.

**Modification for AI Hackathon:**
- Payment updates shall be idempotent so repeated PayPal Webhook deliveries do not create duplicate payment or payout records.
- The system shall preserve PayPal order, capture, refund and payout reference IDs and relevant status history.
- AI service failure shall not corrupt a listing, pool, order or payment record.
- A payment shall not be marked successful based only on a client-side message or AI response.
- The system shall provide clear handling for pending, failed, cancelled and delayed payment events.

# 5. System Requirements

## 5.1 Hardware Requirements

Processor: Intel i3 or above

RAM: Minimum 4 GB

Android smartphone (for testing)

Internet connectivity

**Modification for AI Hackathon:** No additional specialised hardware is required for the proposed cloud-based PayPal and Gemini integrations. A stable internet connection is required to access sandbox APIs and the AI service.

## 5.2 Software Requirements

Operating System (Development): Windows 10/11, Linux or macOS

Programming Language: TypeScript (JavaScript)

Mobile App Framework: React Native with Expo (Expo Router, NativeWind, TanStack Query)

Web Portal Framework: React with Vite (Tailwind CSS, shadcn/ui, React Router, TanStack Query)

Backend Platform: Supabase (PostgreSQL, Authentication, Realtime, Storage, Edge Functions, pg_cron)

Payment Gateway: PayPal (test mode during development/business account)

Notifications: Expo Notifications with Firebase Cloud Messaging

Language and Voice Support: i18next (regional languages), expo-speech-recognition (voice input)

i18next (Regional Text Support)

Yes, it fully supports regional languages and variants.

Since i18next is a text-based internationalization framework, it has no hardcoded language limitations. It supports whatever language data you provide it via JSON translation files.

Voice:

Hybrid On-Device Capturing (Low Cost)

You use expo-speech-recognition or expo-av purely to record the user's regional voice into an audio file, then send that file directly to Gemini for transcription and processing.

[User Speaks] ➔ [Expo Audio Recorder] ➔ [Audio File (.m4a/.mp3)] ➔ [Gemini API (Server/Backend)] ➔ [Structured Text/JSON Output]

Development Tools: Node.js (LTS), Git and GitHub, Visual Studio Code, Expo CLI, EAS CLI, Supabase CLI

Testing Tools: Android phone (development build), Android Studio emulator (optional), Google Chrome, Postman

Deployment: EAS Build (Android APK), Vercel or Netlify (web portal), Supabase hosted project

**Modification for AI Hackathon:**
- **PayPal integration:** PayPal Developer Sandbox, PayPal JavaScript SDK / Checkout, PayPal REST APIs and Webhooks. PayPal Payouts may be added for farmer payouts if supported by the sandbox configuration and account.
- **AI integration:** Gemini API for natural-language understanding, voice transcription/processing, structured extraction, recommendations and forecast explanations.
- **Agent integration (optional):** PayPal Agent Toolkit or PayPal MCP Server may be evaluated for controlled agent-to-PayPal interactions. Include this in the final stack only if actually integrated and demonstrated. A Gemini API integration with secure backend tools is an acceptable AI implementation under the supplied guide.
- **Backend functions:** Supabase Edge Functions or another protected server-side service for PayPal API calls, webhook handling, AI requests and permission validation.
- **API testing:** Postman may be used to test PayPal REST API requests, webhook flows and backend endpoints.
- **Hosting (optional):** Render may be used for backend hosting if required. Existing Vercel/Netlify deployment can be retained if it meets demo requirements.
- **Version control and submission:** Public GitHub repository, `.env.example`, `.gitignore`, README, architecture documentation and an open-source `LICENSE` file.
- PayPal secrets and AI keys shall be configured as server-side environment variables and documented by variable name in `.env.example`, without publishing their values.

# 6. Assumptions and Dependencies

Users have basic knowledge of using mobile applications, or can use the voice and regional language support.

The system depends on stable internet connectivity.

Supabase backend services must remain operational.

The payment gateway, notification service and speech recognition API must be available.

Industries post genuine requirements and farmers provide correct quantities.

**Modification for AI Hackathon:**
- PayPal Developer Sandbox and the selected PayPal APIs must be available during development and judging.
- The selected AI provider and model must be available within the configured quota and usage limits.
- The team must configure test buyer and business accounts and document the steps needed to test the payment workflow.
- The team must not depend on a live production payment account for the hackathon demonstration.
- AI recommendations and forecasts depend on the quality and availability of underlying data. Outputs must be labelled appropriately when data is limited.
- Judges must be able to access the hosted application or follow documented setup instructions without paying for access.

# 7. Hackathon-Specific Demonstration and Submission Requirements (New)

**Modification for AI Hackathon:** The following requirements are added because they are stated in the supplied PayPal AI Hackathon guide. They are submission requirements, not additional marketplace features.

## 7.1 Working Prototype

- The submitted project shall be a functional application, not only a static website, design mockup or Figma prototype.
- The demo shall show meaningful AI functionality and a real PayPal Sandbox integration working together in the GreenRoots transaction journey.
- The prototype shall run consistently on its intended platform and demonstrate the functionality described in the submission.

## 7.2 PayPal and AI Demonstration

- The demonstration shall show at least one complete PayPal Sandbox payment workflow.
- The demonstration shall show AI performing a relevant task, such as converting a farmer's voice request into a listing draft, matching a buyer with a listing, or preparing a transaction summary.
- The demonstration shall show how the AI-assisted marketplace action leads into a user-approved PayPal payment workflow.
- The application shall display the verified PayPal payment result and corresponding GreenRoots order status.
- If farmer payouts are demonstrated, the video and application shall distinguish actual sandbox payout results from any simulated or manually represented step.

## 7.3 Public Repository

- The source-code repository shall be publicly accessible and open source.
- The repository shall contain the source code and required assets.
- The repository shall include a README with project introduction, problem statement, solution, features, technology stack, architecture, PayPal integration, AI integration, setup instructions, environment variables, sandbox configuration, testing instructions, screenshots, demo video URL and deployment URL if available.
- The repository shall include an open-source `LICENSE` file. The supplied hackathon guide specifically says the licence should be visible at the top of the repository page in the About section.
- The repository shall include `.env.example` and `.gitignore`.
- No private API keys, PayPal secrets, access tokens or sensitive user information shall be committed.

## 7.4 Functional Demo Access

- The project shall provide either a publicly accessible hosted demo or complete repository-based setup instructions.
- If authentication is required, test account credentials and login instructions shall be provided to judges.
- Sandbox setup and test instructions shall be documented.
- The application shall be available free of charge and without unnecessary access restrictions for judging and testing.

## 7.5 Demonstration Video

- A public YouTube demonstration video shall be provided.
- The video duration shall be strictly less than three minutes.
- The video shall show the actual functioning application on its intended device.
- The video shall demonstrate the problem, solution, user interface, main workflow, AI functionality, PayPal integration, a successful end-to-end interaction and real-world value.
- Copyrighted music or third-party materials shall not be used without permission.

## 7.6 Existing Project Development

- Since GreenRoots is an existing project, the team shall document the substantial improvements made during the hackathon period.
- The team shall clearly identify newly implemented PayPal integration, AI capabilities and related changes to the marketplace/payment workflow.
- The submission shall accurately distinguish pre-existing functionality from work completed for this hackathon.

## 7.7 Judging Alignment

The project shall be prepared to demonstrate the five equally weighted judging criteria described in the supplied guide:

- Technological Implementation: functional PayPal integration, meaningful AI implementation, technical quality and reliable execution.
- Design: complete product experience, usability, navigation and coherent workflows.
- Potential Impact: agricultural-waste management, farmer income opportunities, reduced crop-residue burning and practical adoption potential.
- Innovation / Idea: AI-assisted local agricultural-waste discovery, pooled supply and user-approved payment workflows.
- Presentation: clear problem statement, concise solution explanation and a functional end-to-end demonstration of PayPal and AI working together.

# 8. Implementation Priorities for the Hackathon (Recommended)

> This section is a practical implementation recommendation, not an additional official hackathon rule. It is included to keep the SRS buildable and focused.

1. **Core marketplace workflow:** Farmer listing, industry requirement, buyer discovery, pool contribution and order status.
2. **AI workflow:** Voice/text listing creation with structured preview and confirmation; AI-assisted matching or transaction assistance.
3. **PayPal workflow:** Sandbox checkout, server-side order creation/capture, webhook verification and transaction-status update.
4. **Payment allocation record:** Calculate platform commission and farmer-wise payable amounts; implement PayPal Payouts only if the sandbox supports the required flow.
5. **Security and reliability:** Backend-only secrets, role checks, amount validation, webhook verification, idempotency and clear transaction states.
6. **Demo readiness:** Public deployment or complete setup instructions, test accounts, public GitHub repository, licence, README and a YouTube demo under three minutes.

## 8.1 Recommended End-to-End Demo Flow

1. A farmer opens GreenRoots and speaks or types: “I have 200 kg of rice husk available at this location.”
2. Gemini extracts the waste type, quantity and other available details and returns a structured listing draft.
3. GreenRoots displays the listing preview. The farmer corrects any errors and confirms publication.
4. An industry or buyer searches for waste. AI-assisted matching recommends relevant listings or pool opportunities based on actual application data.
5. The buyer/industry reviews the quantity, price and order summary.
6. The buyer/industry selects PayPal Checkout and approves the payment in the PayPal Sandbox.
7. GreenRoots verifies the payment on the backend using PayPal APIs and Webhooks, then updates the order/payment status.
8. The system calculates the farmer-wise payable amount and platform commission. If supported, an authorised payout is initiated through PayPal Payouts after the required confirmation.
9. GreenRoots displays the verified transaction and payout states.

**Recommended demo focus:** Show one complete, reliable transaction journey rather than many partially working AI features. The strongest story is that AI helps a farmer create and discover a sale, and PayPal enables the actual sandbox payment workflow.

# 9. Important Scope and Accuracy Notes

1. **Do not add sponsor tools just to increase the technology-stack list.** The hackathon guide states that sponsor tools are optional unless targeting their respective sponsor prizes. Only list tools that are actually used.
2. **Do not claim that the PayPal Agent Toolkit or MCP Server is integrated unless the team implements and demonstrates it.** The hackathon permits any AI platform/model; the key requirement is meaningful AI use alongside meaningful PayPal integration.
3. **Do not claim that AI itself processes or guarantees payments.** AI may interpret requests, recommend matches and prepare actions. PayPal APIs and verified PayPal events determine payment outcomes.
4. **Do not claim automatic escrow or guaranteed split payouts without confirming the exact PayPal product and account support.** Keep a clear farmer-payable ledger and implement actual payouts only through a supported PayPal flow.
5. **Do not treat a sandbox payment as real money.** Label sandbox activity clearly in the application and demo.
6. **Do not make Aadhaar/DigiLocker verification a hackathon dependency.** It is not identified as a mandatory PayPal AI Hackathon requirement in the supplied guide.
7. **Keep the application functional.** A technically impressive architecture or AI chatbot will not compensate for a broken PayPal transaction workflow or an inaccessible demo.
8. **Existing-project eligibility:** The supplied guide allows existing projects but says they must be significantly updated after the hackathon submission period begins. Keep evidence of the new implementation and describe it accurately in the Devpost submission.


