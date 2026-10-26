# Build My Unicorn (BMU) 2.0 — Antigravity / Argon Master Context (`GEMINI.md`)

## 1. Core Philosophy & Product Behavior
* **The "Supportive Co-Founder & Blind-Spot Engine":** Always follow a **"Capture First, Expand Second"** flow. Never criticize a founder's raw idea upfront. First, help them extract and structure their vision cleanly. Second, at the end of each module, generate a constructive **"Things to Consider"** blind-spot review.
* **The 9 Core Founder Modules (A–I):**
  * `MOD_A_IDEATION`: Founder Motivations, Brain Dump, 1-Page Concept Canvas, Customer Storyboard & Founder-Idea Fit Scorecard (Free Hook).
  * `MOD_B_MARKET`: Target Customer Persona, AI Competitor Scout, Plain-English Market Sizing (TAM/SAM/SOM) & Competitive Wedge Matrix.
  * `MOD_C_SURVEYS_FEEDBACK`: Standalone Customer Surveys, Feedback & Early Waitlist Engine — AI "Mom Test" Bias-Free Survey Builder, Hosted Public Survey & Waitlist Page (`buildmyunicorn.com/v/[slug]`), Outreach Distribution Kit + QR Code, 1-on-1 Interview Logger & AI Sentiment Synthesizer.
  * `MOD_D_PRODUCT_BUILD`: "What Are We Actually Building?" — Product Vehicle Selector, Own vs. Rent Channel Matrix (Amazon/App Store vs. Shopify/Web), 3-Tier Build-vs-Buy Recommender, Ruthless V1 Feature/SKU Filter & Technical/Sourcing Spec.
  * `MOD_E_OPERATIONS_TEAM`: Day in the Life of an Order, 7 Startup Hats Matrix & Blind-Reveal Co-Founder Alignment Interview.
  * `MOD_F_REVENUE`: Pricing Architect, Sales Journey & "Pocket Profit" Unit Economics Calculator (auto-pulls platform fees & COGS from Module D and willingness-to-pay from Module C).
  * `MOD_G_MARKETING`: Positioning, First 10 Customers Playbook (including converting Module C Waitlist Leads) & Reverse-Engineered Marketing Budget Calculator.
  * `MOD_H_FINANCE_GRANTS`: No-Spreadsheet Financial Builder, Localized Overheads, 36-Month Cashflow Chart, Non-Dilutive Grant Matcher & Corporate/IP Checklist.
  * `MOD_I_BUSINESS_PLAN`: Interactive Business Plan & Grant Application Editor with Live Financial & Survey Proof Blocks & `gemini-2.5-pro` Contradiction Checker.
* **4-Layer Built-In Support (No Videos):**
  1. Every form step must support **"Why Are We Asking This?"** micro-coaching cards, **"Show Me an Example"** (industry-tailored), and **Inline Jargon Tooltips**.
  2. **Context-Aware AI Sidekick ("Ask Unicorn"):** Persistent slide-out drawer aware of the active `planId` and `currentModuleStep`, plus an **"I'm Stuck"** breakdown button on inputs.
  3. **Momentum Protection:** Include a **"Park It in Open Questions"** button and **"Use Industry Benchmark"** fallback on quantitative steps so founders never get blocked.
  4. **Smart Bug/Mentor Escalation:** Captures current Plan ID and step context.
  5. **Always Include an "Other" Option on Tile/Pill Selectors (Edge-Case Protection):** Every single-select or multi-select tile, card, button, or pill option group across all modules (Modules A–I) **must** include an `"OTHER"` option that reveals an inline custom text input when selected, persisted in the plan data and reflected in AI blind-spot reviews and exported briefs so founders with non-standard or hybrid models never feel boxed in.

## 2. Tech Stack & Coding Standards (Strict Rules for Argon)
* **Framework:** Next.js (App Router, TypeScript, strict mode) with React Server Components (RSC) and Server Actions.
* **Database & ORM:** PostgreSQL (`pgvector/pgvector:pg16` locally via Docker; Cloud SQL in production) accessed strictly via **Drizzle ORM** (`src/db/schema/index.ts`).
  * **NEVER use Prisma.** Always use Drizzle's type-safe query builder and `drizzle-kit` for migrations.
* **Authentication:** **Better-Auth** (stored directly in PostgreSQL tables) supporting Email/Password, Google/LinkedIn OAuth, Admin Session Revocation (Suspend/Ban), and Admin "Impersonate / View-As User".
* **Styling & UI:** Tailwind CSS + `shadcn/ui` primitives + `lucide-react` icons. Clean, supportive, modern SaaS aesthetic.
* **AI SDK:** Official Google GenAI SDK (`@google/genai`).
  * Default fast/low-cost model: `gemini-2.5-flash` (used for 90% of extraction, micro-coaching examples, and survey analysis).
  * Complex reasoning model: `gemini-2.5-pro` (used for Deep Financial/Narrative Contradiction Audits in Module I).
  * **Token & Cost Guardrails:** Every AI call must pass through `src/lib/ai/router.ts`, which verifies the signed `HttpOnly` session cookie via `authorizeAndPrepareGeminiCall`, enforces a **Global Daily Platform AI Ceiling of `500` calls/day** (`MAX_DAILY_PLATFORM_AI_CALLS`), checks `user_entitlements.ai_credits_used_this_month` (or decrypts the user's AES-256-GCM BYOK API key server-side), caps `maxOutputTokens: 2048`, and logs token consumption to `ai_usage_logs`.

## 3. Multi-Tenant, Multi-Plan & Entitlement Invariants
1. **Multi-Tenancy from Day 1:** Every user and `startup_plan` belongs to a `tenant_id` (defaults to the global `'default'` BMU tenant, ready for Phase 2 University/LEO white-label portals).
2. **Multi-Plan Architecture (1-to-Many):** A single user can own or collaborate on multiple `startup_plans` (up to their `user_entitlements.max_startup_plans` limit) and can **Clone / Pivot** an existing plan (`parent_plan_id`).
3. **Plan-Level Localization:** Every `startup_plan` has an `hq_country_code` (`IE`, `GB`, `US`, `AU`, `CA`, `EU`, `ROW`), `base_currency` (`EUR`, `GBP`, `USD`, `AUD`, `CAD`), and `target_markets` array. Always format currency and pull tax/grant rules dynamically from `country_rules` based on the active plan.
4. **Unified Entitlement & Paywall Enforcement (`src/lib/entitlements/index.ts`):**
   * `FREE_HOOK`: Full access to **Module A (Steps 1–8)**. Paywall modal triggers on Modules B–I, Multi-Plan creation, Clone/Pivot, Co-Founder Invite, Public Survey Publishing, Grant Matcher, or Document Export.
   * `SIX_MONTH_PASS`: Solo (1 Plan, 1 Seat) or Co-Founder (3 Plans, 3 Seats). Drops into Read-Only Vault Mode (`is_vault_readonly = true`) when `access_expires_at` passes.
   * `APPSUMO_LTD`: Tier 1 (1 Code = 1 Plan, 1 Seat), Tier 2 (2 Codes = 3 Plans, 3 Seats, Co-Founder Interview unlocked), Tier 3 (3+ Codes = 10 Plans, 5 Seats, White-label Survey & PDF exports, BYOK enabled).
   * `COHORT_PASS`: Unlocked via Institutional Cohort Code (`cohorts.invite_code`).

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
   * Every Server Action across Modules A–I that reads or writes plan-scoped data (`startup_plans`, `plan_modules_data`, `validation_surveys`, `open_questions_parking_lot`, etc.) **must** call `verifyActiveSessionAndPlanOwnership(planId)` before executing any database query.
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
   * On `< 1024px` (`lg:hidden`), the 9-Module navigation list and Open Questions Parking Lot must remain collapsed behind the compact mobile module switcher toggle so founders immediately reach their active module content without scrolling past the sidebar.
   * Keep the `sticky top-0` workspace header slim on mobile (`px-3.5 py-2.5 sm:px-6 sm:py-3.5`) with icon-only secondary buttons (`hidden sm:inline` labels) and truncated plan titles.
5. **Responsive Tables, Sub-Tabs & Floating Drawers Across Modules A–I:**
   * Any comparison matrix or multi-column financial/unit-economics table in Modules B–I must be wrapped in `overflow-x-auto` with a sensible `min-w-[600px]` or stacked mobile cards.
   * Multi-tab module toolbars must stack cleanly (`grid-cols-1 sm:flex`) or scroll horizontally on `< 640px`.
   * Floating drawers/modals (like `Ask Unicorn AI`) must use `left-3 right-3 bottom-3 sm:left-auto sm:right-5 sm:bottom-5 sm:w-96` so they never overflow a `375px` screen.

## 6. Verification Loop Inside Antigravity
* After editing any schema, server action, or component, always run `npx tsc --noEmit` to verify zero TypeScript errors across the monorepo before finishing a task.
