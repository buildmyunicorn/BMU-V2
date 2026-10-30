# Startup Preflight 2.0 — Antigravity / Argon Master Context (`GEMINI.md`)

## 1. Core Philosophy & Product Behavior
* **The "Supportive Co-Founder & Blind-Spot Engine":** Always follow a **"Capture First, Expand Second"** flow. Never criticize a founder's raw idea upfront. First, help them extract and structure their vision cleanly. Second, at the end of each module, generate a constructive **"Things to Consider"** blind-spot review.
* **The 12 Core Founder Modules (A–L):**
  * `MOD_A_IDEATION`: Founder Motivations, Brain Dump, 1-Page Concept Canvas + Instant Domain & Email Availability Check (Affiliate Hook), Customer Storyboard, Zero-Friction Geo-Cookie Pre-Selection (`spf_region` / `bmu_region`), Localization & Grant Sector Pre-Check, and Founder-Idea Fit Scorecard (Free Hook).
  * `MOD_B_MARKET`: Beachhead Customer Persona, AI Competitor Scout, SWOT, State-of-the-Art Analysis, Plain-English Market Sizing (TAM/SAM/SOM), Competitive Wedge Matrix & Export/Non-Displacement Analysis.
  * `MOD_C_SURVEYS_FEEDBACK`: **(Flagship Standalone #1)** Customer Surveys, Feedback & Early Waitlist Engine — AI "Mom Test" Bias-Free Survey Builder, Hosted Public Survey & Waitlist Page (`startuppreflight.com/v/[slug]`), Outreach Distribution Kit + QR Code, 1-on-1 Interview Logger & AI Sentiment Synthesizer.
  * `MOD_D_PRODUCT_BUILD`: "What Are We Actually Building?" — Product Vehicle Selector, Own vs. Rent Channel Matrix (Amazon/App Store vs. Shopify/Web), 3-Tier Build-vs-Buy Recommender + Contextual Tech Stack Perks & "Request 3 LEO-Compliant Dev/Build Quotes" Marketplace Hook, Ruthless V1 Feature/SKU Filter, Work Packages (`WP1..n`) & Technical Merit Diagram.
  * `MOD_E_OPERATIONS`: Day in the Life of an Order, Premises & Equipment Schedule (enforcing IE LEO 3-quote & laptop ban rules + "3-Quote Concierge" Supplier Marketplace Engine + UK Innovate UK capital usage depreciation), Formal 4-Category Project Risk Register, and Compliance Checklist + Instant Startup Insurance Matcher.
  * `MOD_F_COFOUNDER_TEAM`: **(Flagship Standalone #2)** Team, Promoter 150-Word Profiles & CVs, UK Start Up Loans **Personal Survival Budget**, "7 Startup Hats" Role Matrix, **Blind-Reveal Co-Founder Alignment Survey (12 Awkward Questions Engine)**, Side-by-Side Alignment Heatmap, Equity Split Calculator & 3-Year Job Creation Plan.
  * `MOD_G_LAUNCHPAD`: **Getting Set Up (Launchpad & Operations Hub)** — Placed directly after Module F (gated behind Paid Passes like Modules B–L). Features a live **Operations Readiness Score (`0–100%`)** across 6 two-state (`[I Already Have This]` vs. `[Help Me Set This Up]`) setup cards: (1) Legal Entity & Company Registration (CRO / Companies House), (2) Domain Name (`.ie` / `.co.uk` / `.com` live availability checker) & Official `@company` Email (with consumer `@gmail.com` warning detector), (3) Business Bank Account, (4) Bookkeeping, VAT & Payroll, (5) Statutory Startup Insurance, and (6) Baseline Legal, IP & GDPR Compliance, powered by the reusable `<PartnerSlot />` referral engine.
  * `MOD_H_REVENUE`: Pricing Architect, Written Sales Assumptions & "Pocket Profit" Unit Economics Calculator (auto-pulls platform fees & COGS from Module D and willingness-to-pay from Module C).
  * `MOD_I_MARKETING`: Brand Positioning, 4Ps Strategy & Digital Presence, First 10 Customers Playbook (including converting Module C Waitlist Leads) & Reverse-Engineered Marketing Budget Calculator.
  * `MOD_J_FINANCE`: No-Spreadsheet Financial Builder + Sensitivity Analysis, Localized Overheads (IE PRSI/VAT vs. UK NIC/Pension/VAT) + Cloud Accounting Software Perks, 36-Month Cashflow Trough & Funding Gap Calculator, and Corporate/IP Checklist + Business Bank Account & LTD Incorporation Perks Drawer (Bank Bounty Hook).
  * `MOD_K_GRANTS_FUNDING`: **(Flagship Standalone #3)** Non-Dilutive Grants, Loans & Investor Tax Relief Hub — Automated Matcher & Readiness Scorer for **Ireland (LEO Feasibility, LEO Priming, LEO Digital for Business ~€2.7k, LEO Grow Digital & AI Voucher €5k at 50%, Enterprise Ireland Digital Discovery 80% up to €5k, EI New Frontiers & PSSF, SURE, R&D Tax Credit, EII)** and **UK (British Business Bank Start Up Loans, Innovate UK Smart Grants, HMRC SEIS/EIS Advance Assurance, RDEC/ERIS)** + Automated Incorporation & Banking Unlocker + Grant Reimbursement Timing Bridge.
  * `MOD_L_BUSINESS_PLAN`: Interactive Business Plan & Official Grant Compiler supporting 5 live modes (**IE LEO Official Form & Appendices A–F**, **UK Innovate UK 9-Question IFS Mode + 2-Page PDF Appendices**, **UK Start Up Loans 4-Part Workbook**, **UK HMRC SEIS/EIS Pack**, and **Standard Business Plan**) with Live Financial & Survey Proof Blocks & `gemini-2.5-pro` Pre-Flight Contradiction & Grant Audit.
* **4-Layer Built-In Support (No Videos):**
  1. Every form step must support **"Why Are We Asking This?"** micro-coaching cards, **"Show Me an Example"** (industry-tailored), and **Inline Jargon Tooltips**.
  2. **Context-Aware AI Sidekick ("Ask Preflight AI"):** Persistent slide-out drawer aware of the active `planId` and `currentModuleStep`, plus an **"I'm Stuck"** breakdown button on inputs.
  3. **Momentum Protection:** Include a **"Park It in Open Questions"** button and **"Use Industry Benchmark"** fallback on quantitative steps so founders never get blocked.
  4. **Smart Bug/Mentor Escalation:** Captures current Plan ID and step context.
  5. **Always Include an "Other" Option on Tile/Pill Selectors (Edge-Case Protection):** Every single-select or multi-select tile, card, button, or pill option group across all modules (Modules A–L) **must** include an `"OTHER"` option that reveals an inline custom text input when selected, persisted in the plan data and reflected in AI blind-spot reviews and exported briefs so founders with non-standard or hybrid models never feel boxed in.

## 2. Tech Stack & Coding Standards (Strict Rules for Argon)
* **Framework:** Next.js (App Router, TypeScript, strict mode) with React Server Components (RSC) and Server Actions.
* **Database & ORM:** PostgreSQL (`pgvector/pgvector:pg16` locally via Docker; Cloud SQL in production) accessed strictly via **Drizzle ORM** (`src/db/schema/index.ts`).
  * **NEVER use Prisma.** Always use Drizzle's type-safe query builder and `drizzle-kit` for migrations.
* **Authentication:** **Better-Auth** (stored directly in PostgreSQL tables) supporting Email/Password, Google/LinkedIn OAuth, Admin Session Revocation (Suspend/Ban), and Admin "Impersonate / View-As User".
* **Styling & UI:** Tailwind CSS + `shadcn/ui` primitives + `lucide-react` icons. Clean, supportive, modern SaaS aesthetic.
* **AI SDK:** Official Google GenAI SDK (`@google/genai`).
  * Default fast/low-cost model: `gemini-2.5-flash` (used for 90% of extraction, micro-coaching examples, and survey analysis).
  * Complex reasoning model: `gemini-2.5-pro` (used for Deep Financial/Narrative/Grant Pre-Flight Audits in Module L).
  * **Token & Cost Guardrails:** Every AI call must pass through `src/lib/ai/router.ts`, which verifies the signed `HttpOnly` session cookie via `authorizeAndPrepareGeminiCall`, enforces a **Global Daily Platform AI Ceiling of `500` calls/day** (`MAX_DAILY_PLATFORM_AI_CALLS`), checks `user_entitlements.ai_credits_used_this_month` (or decrypts the user's AES-256-GCM BYOK API key server-side), caps `maxOutputTokens: 2048`, and logs token consumption to `ai_usage_logs`.

## 3. Multi-Tenant, Multi-Plan, Entitlement, Partner Monetization & Geo-Routing Invariants
1. **Multi-Tenancy from Day 1:** Every user and `startup_plan` belongs to a `tenant_id` (defaults to the global `'default'` Startup Preflight tenant, ready for Phase 2 University/LEO/UK Growth Hub white-label portals).
2. **Multi-Plan Architecture (1-to-Many):** A single user can own or collaborate on multiple `startup_plans` (up to their `user_entitlements.max_startup_plans` limit) and can **Clone / Pivot** an existing plan (`parent_plan_id`).
3. **Plan-Level Localization & Edge Geo-IP Pre-Selection:** Every `startup_plan` has an `hq_country_code` (`IE`, `GB`, `US`, `AU`, `CA`, `EU`, `ROW`), `base_currency` (`EUR`, `GBP`, `USD`, `AUD`, `CAD`), and `target_markets` array. Next.js Edge Middleware (`src/middleware.ts`) inspects `cf-ipcountry` / `x-appengine-country` / `x-client-region` headers to set `x-spf-region` and the `spf_region` cookie (with a Top-Navbar Country Switcher `[ 🇮🇪 Ireland ▾ | 🇬🇧 UK ]` and dedicated `/ie` and `/uk` `hreflang` SEO routes), which Module A Step 5 reads to pre-select HQ Country and currency automatically.
4. **Unified Entitlement & Paywall Enforcement (`src/lib/entitlements/index.ts`):**
   * `FREE_HOOK`: Full access to **Module A (Steps 1–8)**. Paywall modal triggers on Modules B–L, Multi-Plan creation, Clone/Pivot, Co-Founder Invite, Public Survey Publishing, Grant Matcher, or Document Export.
   * `SIX_MONTH_PASS`: Solo (**€129 / £109**, 1 Plan, 1 Seat) or Co-Founder (**€199 / £169**, 3 Plans, 3 Seats, unlocks multi-seat Module F Co-Founder Alignment). At Month 6, drops into Read-Only Vault Mode (`is_vault_readonly = true`) unless the founder activates the **€9/month (or €79/year) "Grant Radar & Living Vault" Micro-Subscription** (keeps all 12 modules editable + 24/7 automated Grant & Tax Relief Radar alerts).
   * `APPSUMO_LTD`: Tier 1 (1 Code = 1 Plan, 1 Seat), Tier 2 (2 Codes = 3 Plans, 3 Seats, Module F Co-Founder Alignment Interview unlocked), Tier 3 (3+ Codes = 10 Plans, 5 Seats, White-label Survey & PDF exports, BYOK enabled).
   * `COHORT_PASS`: Unlocked via Institutional Cohort Code (`cohorts.invite_code`, €2,500–€5,000 per cohort).
5. **Contextual Partner Revenue, Bank Bounties, `<PartnerSlot />` Referral Engine & "3-Quote Concierge" Marketplace:**
   * Dynamic Partner & Referral Engine managed via `/admin/partners` (and embedded as a tab in `/admin`) backed by `/api/admin/partners`, `/api/go/[slug]?projectId=[id]` (click logging + `{projectId}` macro substitution + `307` redirect), `/api/domains/check` (live `.ie`, `.co.uk`, `.com` DNS/RDAP availability), and `/api/projects/[projectId]/operations`.
   * Drop-in `<PartnerSlot slot="..." projectId="..." />` renders active country-filtered (`ALL`, `IE`, `GB`) partners across **Module G (`MOD_G_LAUNCHPAD`)** Cards 1–6 (`OPS_STEP_1_INCORPORATION`, `OPS_STEP_2_DOMAIN`, `OPS_STEP_2_EMAIL`, `OPS_STEP_3_BANKING`, `OPS_STEP_4_ACCOUNTING`, `OPS_STEP_4_PAYROLL`, `OPS_STEP_5_INSURANCE`, `OPS_STEP_6_LEGAL_IP`) as well as contextual module steps (`MOD_C_STEP_4_SURVEY_BOOST`, `MOD_D_STEP_2_ECOMMERCE_NO_CODE`, `MOD_D_STEP_3_TECH_AGENCY_QUOTES`, `MOD_E_STEP_2_BRANDING_DOMAINS`, and future Module J/K/L slots).
   * Modules D & E include the **"3-Quote Concierge" Supplier Engine**, routing standardized RFPs/equipment schedules to vetted IE/UK partner agencies and suppliers (monetized via €50–€100 lead fees or 5%–10% finder's fees) and auto-attaching returned quotes to Module L Appendix C.

## 4. Security, Data Privacy & AI Billing Protection Invariants (Strict Enforcement)
1. **Zero Client-Side API Keys & Fail-Closed AI Router (`src/lib/ai/router.ts`):**
   * **NEVER** expose `GEMINI_API_KEY` or any `NEXT_PUBLIC_*` AI key to the browser.
   * Every live Gemini call **must** call `authorizeAndPrepareGeminiCall()` first. It verifies the signed `HttpOnly` server session cookie (`getVerifiedFounderSessionFromCookie`), never trusts client-supplied `userId`, and **fails closed** to deterministic smart-synthesizer fallback if unauthenticated, if the DB is unreachable, or if credits are exhausted.
2. **Hard Billing Circuit Breakers (`500` Calls/Day Ceiling & Burst Rate Limits):**
   * **Global Daily Platform Ceiling:** Capped at **`500` paid platform Gemini calls per 24 hours** (`DEFAULT_MAX_DAILY_PLATFORM_AI_CALLS = 500`, configurable via `MAX_DAILY_PLATFORM_AI_CALLS`). Once reached, the router automatically switches to smart-synthesizer mode for the remainder of the UTC day so a runaway script can never rack up a surprise Google Cloud bill.
   * **Per-User Burst Limits & Token Caps:** Enforces max `8` AI calls/minute and `60` AI calls/hour per user, truncates/sanitizes all user prompt inputs via `sanitizePromptInput()`, and enforces `maxOutputTokens: 2048` on every Gemini call.
3. **BYOK API Key AES-256-GCM Encryption & Redaction (`src/lib/auth/server-auth.ts`):**
   * User-supplied BYOK Gemini keys (`user_entitlements.custom_api_key_encrypted`) must be encrypted at rest using **AES-256-GCM** (`encryptByokApiKey` / `decryptByokApiKey`) derived from `BETTER_AUTH_SECRET`.
   * Never return raw BYOK keys to the client or store them in `localStorage` — always redact to `'enc_gemini_byok_active'` in client session snapshots.
4. **Plan Ownership Verification (IDOR Prevention) on All Server Actions:**
   * Every Server Action across Modules A–L that reads or writes plan-scoped data (`startup_plans`, `plan_modules_data`, `validation_surveys`, `open_questions_parking_lot`, etc.) **must** call `verifyActiveSessionAndPlanOwnership(planId)` before executing any database query.
5. **Public Route PII Isolation & Anti-Spam (`/v/[slug]`):**
   * Public unauthenticated actions (such as `getPublicSurveyBySlugAction`) must **never** return respondent emails, waitlist leads, or other respondents' answers (`responses: []`). Only authenticated founder actions (`getFounderSurveyResponsesBySlugAction`) that verify plan ownership may return respondent PII.
   * Public submission endpoints (`submitPublicSurveyResponseAction`) must enforce rate limiting (`checkRateLimit`), cap total stored responses per survey (`2,500`), force `isSimulated: false`, and sanitize/truncate all open-text fields.
6. **Production Secret Hardening & Brute-Force Protection:**
   * `verifyPayload` uses `crypto.timingSafeEqual` and enforces token TTL (`30 days` for founders, `12 hours` for Super Admin).
   * In production (`NODE_ENV === 'production'`), `BETTER_AUTH_SECRET` and `SUPER_ADMIN_MASTER_PASSWORD` never fall back to predictable dev strings, and login/registration endpoints enforce brute-force rate limiting.

## 5. Mobile & Responsive UX Invariants (Desktop-Primary, Mobile-Ready)
1. **Preserve Desktop Layout (`sm:` / `lg:` Breakpoints):**
   * The platform is primarily used on desktop computers (`lg:grid-cols-12` workspace layout), so never degrade desktop information density. Always use Tailwind `sm:` (`640px+`) and `lg:` (`1024px+`) breakpoints so mobile optimizations apply cleanly to `< 640px` / `< 1024px` viewports without altering the desktop layout.
2. **Zero iOS Safari Input Auto-Zoom (`16px` Mobile Inputs):**
   * iOS Safari automatically zooms the entire page if a focused `<input>`, `<textarea>`, or `<select>` has a font size smaller than `16px` (`text-base`). Keep the global `@media (max-width: 639px)` rule in `src/app/globals.css` intact and use `text-base sm:text-xs` or `text-base sm:text-sm` on form inputs so mobile users never experience jarring viewport zoom.
3. **Full-Width Mobile Answer Targets on Public Pages (`/v/[slug]`):**
   * On mobile-critical surfaces (especially the public survey `/v/[slug]`), never indent interactive option lists on `< 640px` (`sm:pl-9` instead of `pl-9`), and always make primary submit CTAs full-width on mobile (`w-full sm:w-auto`).
4. **Collapsible Mobile Sidebar & Slim Sticky Header in `/workspace`:**
   * On `< 1024px` (`lg:hidden`), the 12-Module navigation list and Open Questions Parking Lot must remain collapsed behind the compact mobile module switcher toggle so founders immediately reach their active module content without scrolling past the sidebar.
   * Keep the `sticky top-0` workspace header slim on mobile (`px-3.5 py-2.5 sm:px-6 sm:py-3.5`) with icon-only secondary buttons (`hidden sm:inline` labels) and truncated plan titles.
5. **Responsive Tables, Sub-Tabs & Floating Drawers Across Modules A–L:**
   * Any comparison matrix or multi-column financial/unit-economics table in Modules B–L must be wrapped in `overflow-x-auto` with a sensible `min-w-[600px]` or stacked mobile cards.
   * Multi-tab module toolbars must stack cleanly (`grid-cols-1 sm:flex`) or scroll horizontally on `< 640px`.
   * Floating drawers/modals (like `Ask Preflight AI`) must use `left-3 right-3 bottom-3 sm:left-auto sm:right-5 sm:bottom-5 sm:w-96` so they never overflow a `375px` screen.

## 6. Module Step & Final Overview Brief Architecture Standard (Mandatory for All Modules A–L)
Every module workspace component (`src/components/workspace/module-*-workspace.tsx`) **must** be built from the start using the unified **Collapsible Step + Final Overview Brief** standard established in Modules A, B, D, and E:
1. **Collapsible Step Accordion State (`openStep`):**
   * Manage `const [openStep, setOpenStep] = useState<number | 'ALL'>(...)` initialized automatically to the first incomplete step (or the final Overview step if all core steps are complete).
   * Include an **`Expand All Steps` / `Focus Step-by-Step`** toggle button in the top dark-indigo module header card alongside the module progress indicator (`{completedCoreStepsCount} of {N} Core Steps Ready`) and the step navigation strip.
2. **Core Steps (`Steps 1..N`) — Collapsed vs. Expanded Card Formatting:**
   * **Collapsed State (`openStep !== 'ALL' && openStep !== stepNum`):**
     * Outer container: `group scroll-mt-24 cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm`
     * Header layout: `flex items-center justify-between gap-3` with left content wrapped in `flex min-w-0 flex-1 items-center gap-3` (`truncate` on title and 1-line summary) and right action wrapped in `ml-3 flex shrink-0 items-center gap-2`.
     * Dynamic circle icon: `bg-emerald-600 text-white` with `<Check className="h-4 w-4" />` + `<Badge variant="success">Completed</Badge>` when complete; `bg-indigo-600 text-white` with step number + `<Badge variant="outline">In Progress</Badge>` when incomplete.
     * Right action button: `shrink-0` ghost button displaying `Edit Step` + `<ChevronDown className="ml-1 h-3.5 w-3.5" />`.
   * **Expanded State (`openStep === 'ALL' || openStep === stepNum`):**
     * Outer container: `rounded-xl border border-slate-200 bg-white p-6 shadow-xs`
     * Header layout: `flex items-start justify-between gap-4 border-b border-slate-100 pb-4` with matching dynamic emerald check / indigo step number circle, title, status badge, plain-English description, and a `shrink-0` **`Collapse Step`** button (`<ChevronUp className="ml-1 h-3.5 w-3.5" />`) in the top-right when `openStep !== 'ALL'`.
     * Bottom step toolbar: Clean action bar with AI helpers (`Wand2` / `Sparkles`), `Save` button, and `Next Step` button (`ArrowRight`) that advances `openStep` and smoothly scrolls to the next step.
3. **No-Wrap Button & Header Alignment Invariant:**
   * Always wrap header text/titles in `min-w-0 flex-1` and apply `shrink-0` to all badges and action buttons (`Edit Step`, `Collapse Step`, `Open Overview`, `Why Are We Asking This?`, `Show Me an Example`) so buttons never wrap awkwardly across screen sizes.
4. **Final Step = Module Overview & Executive Summary Brief Step:**
   * The final step of every module **must** be formatted as an **Overview / Executive Summary Brief** step (labeled `step: 'Overview'` in the top navigation strip, e.g., *Concept Brief*, *Market & Validation Brief*, *Product & Scope Brief*, *Operations & Risk Brief*):
     * **Collapsed Overview Card:** Uses `<FileText className="h-4 w-4" />` inside the circle badge (`bg-emerald-600 text-white` when all core sections are ready, else `bg-indigo-600 text-white`), displays the module brief title + `{completedCoreCount}/{N} Sections Ready` badge, and uses an **`Open Overview`** (`ChevronDown`) button on the right.
     * **Expanded Overview Card:** Uses `rounded-xl border border-indigo-200 bg-gradient-to-br from-white via-indigo-50/30 to-violet-50/40 p-6 shadow-sm` with `<FileText className="h-3.5 w-3.5" />` in the header, `{completedCoreCount}/{N} Sections Ready` badge, and `Collapse Step` (`ChevronUp`).
     * **Inside the Expanded Overview Step:**
       1. **Module Readiness Checklist Grid:** Displays cards for each core step (`Steps 1..N`) with emerald/amber `<CheckCircle2 />` indicators and live 1-line summaries synced to the founder's answers.
       2. **Constructive "Things to Consider" Blind-Spot Review & 1-Page Executive Brief:** Interactive blind-spot audit cards, executive summary preview, and 1-click Copy Markdown / Download HTML / Print to PDF export actions.
       3. **Dark Footer Conversion / Handoff CTA Bar:** A `bg-slate-900 px-4 py-3.5 text-white rounded-xl` bar at the very bottom that saves the module and transitions cleanly into the next module.

## 7. Verification Loop Inside Antigravity
* After editing any schema, server action, or component, always run `npx tsc --noEmit` to verify zero TypeScript errors across the monorepo before finishing a task.
