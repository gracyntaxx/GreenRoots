Software Requirements Specification (SRS)
Project Title : Agriculture Waste Management System
1. Introduction
1.1 Purpose
The purpose of this document is to specify the functional and non-functional requirements of the Agriculture Waste Management System.
It is meant to be used as a reference while designing, building and testing the application.
1.2 Scope
GreenRoots is a platform(mobile/website) that connects farmers with industries and general buyers for the sale of agricultural waste such as straw, husk and stubble and more.

Industries post what they need, and farmers nearby are notified. Several farmers can contribute to the same requirement (called a pool), and each farmer is paid for the quantity they gave. 

Farmers can also list their own waste for sale, and any registered buyer can purchase it directly. This reduces the dependence on industries. (pick up by companies)

The system also provides village collection points(show map and locations), reputation scores, seasonal alerts, demand forecasting for industries(sends alert to start preparing for seasonal surges), and voice and regional language support for farmers(voice chat or text).


1.3 Definitions, Acronyms, and Abbreviations
User - A registered person using the application
Farmer - User who contributes to a pool or sells agri-waste
Industry - User who posts requirements for agri-waste
local festive buyers - General user who buys waste listed by farmers
Admin - System administrator
Requirement - An order posted by an industry with waste type, quantity, price and deadline
Pool - The combined contributions of several farmers against one requirement
Listing - Agri-waste put up for sale by a farmer
Collection Points - A village location where waste is dropped off and picked up
Reputation Score - A score built from a user's past transactions


SRS - Software Requirement Specification


2. Overall Description
2.1 Product Perspective
The system gives farmers a way to sell crop waste instead of burning it, and gives industries a steadier supply from local farmers.

2.2 User Characteristics
Farmers may have limited experience with mobile applications, so the app should be simple and available in regional languages with voice input.

Buyers should have basic knowledge of using mobile applications.
Industries should have basic knowledge of using web applications.
Admin should have basic system management knowledge.
Industries and admins will mainly work on larger screens (desktop or laptop) through the web portal.

2.3 Operating Environment
Client (Farmers and Buyers): Android smartphones running Android 8.0 or above, using the mobile application built with React Native (Expo).

Client (Industries and Admins): Web portal accessed from a modern web browser (Chrome, Edge or Firefox) on Windows, macOS or Linux, on desktop or laptop screens.

Backend: Supabase cloud (PostgreSQL, Authentication, Realtime, Storage and Edge Functions).
Network: Internet connection (Wi-Fi, 4G or 5G).

External Services: paypal payment gateway, push notification service (Cloud Messaging through Expo), 
updates through whatsapp, SMS OTP provider and speech/text recognition service chatbot and agentic workflow.
algorithm to suggest n filter customised buyers n sellers based on parameters like frequently, popular, trusted, previous deals, good deals, location, budget


2.4 Constraints
Internet connectivity is mandatory.
System performance depends on Supabase server availability.
Payments depend on the third-party payment gateway.

2.5 Assumptions and Dependencies
Users provide accurate profile to waste information, digilocker verification aadhar.(Several Indian API aggregators provide a Free Sandbox (Testing) Environment built specifically for developers to test workflows without spending money or needing official corporate licenses.

1. Recommended Free Sandbox Providers

• Sandbox.co.in: They provide mock datasets and a free sandbox workflow where you can generate a mock DigiLocker URL, log in using mock credentials, and receive a clean JSON response containing a test Aadhaar profile)


Supabase and the third-party services remain operational.
Users possess Android devices compatible with React Native (Expo) applications.
Industries and admins have a computer with a modern web browser.

3. Functional Requirements
3.1 User Account & Authentication
FR-1: The system shall allow users to sign up as a farmer, industry or buyer.
FR-2: The system shall allow registered users to log in securely.
FR-3: The system shall allow users to log out from the system.
FR-4: The system shall let the admin verify industry accounts before they can post requirements.
3.2 Profile Management
FR-5: The system shall provide a profile page showing the user's name, location and role details.
FR-6: The system shall display the user's reputation score on the profile.
3.3 Industry Requirements and Pooling
FR-7: The system shall allow industries to post a requirement with waste type, quantity, price and deadline.
FR-8: The system shall notify farmers in the area when a new requirement is posted. (ubers system design, and greedy approach based on hexagons on map, extend if required)
FR-9: The system shall create a pool for every requirement.
FR-10: The system shall allow farmers to commit a quantity to a pool.
FR-11: The system shall show pool progress, i.e. quantity committed against quantity required. and also track in stages.
FR-12: If a pool is not filled by close deadline, the system shall automatically extend the area to other providers and notify the farmers and the industry. extend deadline if industries agree.
FR-13: The system shall mark the pool as ready for pickup once the required quantity is reached.
FR-14: The system shall divide the payment among the farmers in proportion to their contribution after delivery. (set prices per kg, recieve money from client, take comission, then let seller withdraw money via paypal)
3.4 Farmer Listings and Buying
FR-15: The system shall allow farmers to list available waste with type, quantity, price and location. n filter too
FR-16: The system shall allow farmers to edit or delete their listings.
FR-17: The system shall allow buyers to search and browse listings by keyword, waste type and location.
FR-18: The system shall allow buyers to place an order on a listing.
FR-19: The system shall pass the payment of an order to the farmer after the order is completed.

3.5 Collection Points
FR-20: The system shall maintain a list of village collection points(algorithm -- travelling salesman algorithm, so that the industry vehicles can come and collect), which the admin can add and update.
FR-21: The system shall allow farmers to choose a collection point for drop-off or pickup of their waste.
3.6 Payments and Order Status
FR-22: The system shall support online payment through paypal payment gateway.
FR-23: The system shall show the status of every pool contribution and order (pending, ready for pickup, completed).
3.7 Reputation Score
FR-24: The system shall calculate a reputation score for farmers, industries and buyers based on their past transactions.
3.8 Alerts and Demand Forecasting
FR-25: The system shall send seasonal alerts to farmers before harvest about the expected demand for waste.
FR-26: The system shall show industries the expected availability of waste by region and season.
3.9 Language and Voice Support
FR-27: The system shall support regional languages.
FR-28: The system shall support voice input for main actions such as listing waste and committing to a pool. so chatbot asks about listing, voice or text qna, automatic listing card preview, say it out loud , then confirm post.

3.10 Admin Functions
FR-29: The system shall allow the admin to remove users, listings or requirements that break the rules.
4. Non-Functional Requirements
4.1 Performance Requirements
The system should respond within 3-5 seconds under normal load.
Pool progress should update soon after a farmer commits a quantity.
4.2 Security Requirements
Authentication shall be handled securely using Supabase Auth.
User passwords shall not be stored in plain text.
Only verified industries (license number) shall be able to post requirements.
Card or bank details shall not be stored by the system; they are handled by the payment gateway.
Unauthorized access shall be restricted.
4.3 Usability Requirements
The system should be easy to use for people with little technical or reading experience.
Navigation should be simple, with clear icons and large buttons.
The interface should be responsive across different Android devices.
The web portal should adapt to desktop and laptop screen sizes.
4.4 Reliability Requirements
The system should not lose pool commitments, orders or payment records.
User data should be stored securely in the PostgreSQL database.
5. System Requirements
5.1 Hardware Requirements
Processor: Intel i3 or above
RAM: Minimum 4 GB
Android smartphone (for testing)
Internet connectivity
5.2 Software Requirements
Operating System (Development): Windows 10/11, Linux or macOS
Programming Language: TypeScript (JavaScript)
Mobile App Framework: React Native with Expo (Expo Router, NativeWind, TanStack Query)
Web Portal Framework: React with Vite (Tailwind CSS, shadcn/ui, React Router, TanStack Query)
Backend Platform: Supabase (PostgreSQL, Authentication, Realtime, Storage, Edge Functions, pg_cron)
Payment Gateway: paypal (test mode during development/business account)
Notifications: Expo Notifications with Firebase Cloud Messaging
Language and Voice Support: i18next (regional languages), expo-speech-recognition (voice input)
text: 
 i18next (Regional Text Support)

Yes, it fully supports regional languages and variants.
Since i18next is a text-based internationalization framework, it has no hardcoded language limitations. It supports whatever language data you provide it via JSON translation files

voice: 
Hybrid On-Device Capturing (Low Cost)

You use expo-speech-recognition or expo-av purely to record the user's regional voice into an audio file, then send that file directly to Gemini for transcription and processing.
[User Speaks] ➔ [Expo Audio Recorder] ➔ [Audio File (.m4a/.mp3)] ➔ [Gemini API (Server/Backend)] ➔ [Structured Text/JSON Output]

Development Tools: Node.js (LTS), Git and GitHub, Visual Studio Code, Expo CLI, EAS CLI, Supabase CLI

Testing Tools: Android phone (development build), Android Studio emulator (optional), Google Chrome, Postman

Deployment: EAS Build (Android APK), Vercel or Netlify (web portal), Supabase hosted project

6. Assumptions and Dependencies

Users have basic knowledge of using mobile applications, or can use the voice and regional language support.
The system depends on stable internet connectivity.
Supabase backend services must remain operational.
The payment gateway, notification service and speech recognition API must be available.
Industries post genuine requirements and farmers provide correct quantities.
