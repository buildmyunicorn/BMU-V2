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
  * **Token & Cost Guardrails:** Every AI call must pass through `src/lib/ai/router.ts`, which checks `user_entitlements.ai_credits_used_this_month` (or uses the user's encrypted BYOK API key if configured) and logs token consumption to `ai_usage_logs`.

## 3. Multi-Tenant, Multi-Plan & Entitlement Invariants
1. **Multi-Tenancy from Day 1:** Every user and `startup_plan` belongs to a `tenant_id` (defaults to the global `'default'` BMU tenant, ready for Phase 2 University/LEO white-label portals).
2. **Multi-Plan Architecture (1-to-Many):** A single user can own or collaborate on multiple `startup_plans` (up to their `user_entitlements.max_startup_plans` limit) and can **Clone / Pivot** an existing plan (`parent_plan_id`).
3. **Plan-Level Localization:** Every `startup_plan` has an `hq_country_code` (`IE`, `GB`, `US`, `AU`, `CA`, `EU`, `ROW`), `base_currency` (`EUR`, `GBP`, `USD`, `AUD`, `CAD`), and `target_markets` array. Always format currency and pull tax/grant rules dynamically from `country_rules` based on the active plan.
4. **Unified Entitlement & Paywall Enforcement (`src/lib/entitlements/index.ts`):**
   * `FREE_HOOK`: Full access to **Module A (Steps 1–8)**. Paywall modal triggers on Modules B–I, Multi-Plan creation, Clone/Pivot, Co-Founder Invite, Public Survey Publishing, Grant Matcher, or Document Export.
   * `SIX_MONTH_PASS`: Solo (1 Plan, 1 Seat) or Co-Founder (3 Plans, 3 Seats). Drops into Read-Only Vault Mode (`is_vault_readonly = true`) when `access_expires_at` passes.
   * `APPSUMO_LTD`: Tier 1 (1 Code = 1 Plan, 1 Seat), Tier 2 (2 Codes = 3 Plans, 3 Seats, Co-Founder Interview unlocked), Tier 3 (3+ Codes = 10 Plans, 5 Seats, White-label Survey & PDF exports, BYOK enabled).
   * `COHORT_PASS`: Unlocked via Institutional Cohort Code (`cohorts.invite_code`).

## 4. Verification Loop Inside Antigravity
* After editing any schema, server action, or component, always run `npx tsc --noEmit` to verify zero TypeScript errors across the monorepo before finishing a task.
