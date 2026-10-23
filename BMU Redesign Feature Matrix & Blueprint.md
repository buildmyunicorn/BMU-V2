# Build My Unicorn (BMU) 2.0 – Feature Audit & Selection Matrix

## Core Philosophy: The "Supportive Co-Founder & Blind-Spot Engine"
**"Everyone can have a great idea. It’s everything else around it that makes or breaks the startup."**
First-time founders suffer from "unknown unknowns"—they don't know what they don't know. However, hitting an excited founder with harsh criticism on minute one kills momentum. 

Instead, BMU 2.0 follows a **"Capture First, Expand Second"** flow:
1. **Extract & Clarify:** Act as an enthusiastic, structured sounding board to get the messy idea out of the founder's head and onto paper cleanly.
2. **"Things to Consider" (The Blind-Spot Review):** Once the vision is captured at the end of a module, gently surface the hidden operational realities, industry traps, and questions they haven't thought about yet—framed as constructive prompts rather than roadblocks.

## Architectural & Strategic Decisions (Locked In)
* **Tech Stack Rebuild:** Moving away from legacy `.NET` to a modern, AI-coding-optimized **Next.js (TypeScript) + Drizzle ORM + PostgreSQL** stack—built **locally first inside Antigravity using Argon**, and deployed via Docker to **Google Cloud Run**.
* **Multi-Tenancy from Day 1:** Even though **White-Labeling** (for Accelerators, LEOs, Universities) is a Phase 2 rollout, the database and authentication architecture must be designed as multi-tenant from day one so orgs can spin up custom portals later without a rewrite.
* **Multi-Plan / Multi-Project Workspaces (1-to-Many Architecture):** A single user account can create, manage, and switch between **multiple startup plans/ideas**. 
  * *Why this matters:* Serial entrepreneurs have multiple ideas on the go; early founders often want to test 2–3 different concepts in Module A before committing to one; and existing founders frequently want to **clone/branch** an existing plan to test a B2B vs. B2C pivot without losing their original work.
  * *Database Hierarchy:* `Tenant (White-Label Org)` $\rightarrow$ `Cohort / Program (Optional)` $\rightarrow$ `User Account` $\rightarrow$ `Startup Plan / Workspace (Multiple)` $\rightarrow$ `Plan-Specific Team Collaborators & Modules`.
* **Unified Entitlement Engine (6-Month Pass + AppSumo LTD + Institutional Cohort Pass):**
  * Built-in entitlement engine that supports **Free Module A Hooks**, **One-Off Time Passes (6-Month Launch Pass)**, **AppSumo Lifetime Deal (LTD) Vouchers**, AND **B2B Institutional Seat Licenses**, with strict monthly AI token guardrails to protect your margins.
* **International Jurisdiction & Localization Engine (Plan-Level Settings):**
  * Because BMU 2.0 operates globally, every Startup Plan has two core geographic settings established at creation:
    1. **Incorporation / HQ Country & Base Currency:** (e.g., Ireland/EUR, UK/GBP, US/USD, Australia/AUD, Canada/CAD, EU, or "Rest of World").
    2. **Target Selling Markets:** Where their customers actually live (local only vs. global/exporting).
  * **Dynamic Rule & Terminology Switching:** Rather than hardcoding country-specific terms, the platform uses a modular **Country Rule Pack** (combined with AI context awareness) that automatically swaps terminology, tax estimates, corporate structures, compliance checklists, and **eligible government grants** across all modules.
* **AI-First Guided Extraction:** Replacing intimidating blank forms and passive videos with an interactive, conversational extraction flow.

---

## 0. Platform Support & In-App Guidance Architecture (LOCKED IN)
Since we are building from scratch and dropping high-maintenance video tutorials and manual human brokers, "Support" is baked directly into the UI across **4 automated layers**:

### Layer 1: Contextual "Micro-Coaching" (Preventing Confusion Before It Happens)
* **"Why Are We Asking This?" Cards:** Every question or section includes a subtle toggle explaining *why* this matters in plain English (e.g., *"Investors look at Customer Acquisition Cost because..."*).
* **Dynamic Industry Examples ("Show Me an Example"):** Clicking *"Show me an example"* generates 2–3 realistic sample answers tailored to their exact industry (e.g., showing how a SaaS app vs. a local bakery would answer the question).
* **Inline Jargon Buster (Interactive Tooltips):** Hovering or tapping on terms like *TAM/SAM/SOM, Vesting Cliff, Churn,* or *Gross Margin* pops up a 2-sentence plain-English explanation—plus how it applies to their specific plan.

### Layer 2: The Context-Aware AI Sidekick ("Ask Unicorn")
* **Persistent Slide-Out Co-Pilot:** Available on every screen with **full read-access to the current Startup Plan** and awareness of the exact step the user is on.
* **"I'm Stuck" Button:** Inside any input field, clicking *"Help me think through this"* breaks the big question down into 2 or 3 tiny, easy-to-answer questions, then drafts the response for them.
* **Platform & How-To Support:** Trained on all BMU 2.0 documentation to instantly answer platform questions (*"How do I invite my co-founder to only this plan?"* or *"How do I stack a second AppSumo code?"*).

### Layer 3: Proactive "Unblocker" Prompts (Momentum Protection)
* **Idle / Friction Detection:** If a founder stalls on a tough step for too long, the UI gently offers a lower-friction path: *"Not sure about your exact numbers yet? Let's use industry benchmarks for now and you can refine them later."*
* **"Good Enough for Now" Draft Mode ("Park It"):** Allows founders to mark a tricky question as *"Needs Research"* (sending it to their **Open Questions Parking Lot**) so they never feel blocked from moving to the next module.

### Layer 4: Automated Technical & Account Triage (Low-Touch Admin)
* **Smart Bug / Feedback Reporter:** Captures browser state, current Plan ID, and console logs automatically to create a structured ticket without messy back-and-forth emails.
* **Phase 2 Ready (White-Label Escalation):** Routes a *"Request Mentor Review"* notification directly to a cohort's assigned program manager inside University or LEO white-label portals.

---

## 1. Confirmed Removals & Deferred Features
* ❌ **Pre-recorded Video Tutorials:** Dropped (replaced by Section 0 Contextual Micro-Coaching).
* ❌ **Trusted Expert Network (Manual Broker):** Dropped (operational bottleneck, NDA friction).
* ❌ **Clickable HTML Prototyping Service:** Dropped (removing manual/automated UI prototyping from core scope).
* ⏸️ **Pitching & Investor Deck Module:** Parked for a later phase so we can focus on the core Business Plan & Grant Editor first.

---

## 2. Deep-Dive Module Breakdown (All 7 Core Modules Locked In)

### Module A: Ideation ("Getting the Idea Out of Your Head") — *LOCKED IN (FREE TIER HOOK)*
**The Goal:** Turn a messy, exciting thought in the founder's head into a structured, crystal-clear concept without overwhelming them or killing their enthusiasm—and allow them to test multiple ideas side-by-side.

* **Step 0: The "Idea Vault", Plan Switcher & Location Setup**
  * Create a plan (or multiple plans on paid tiers), use "Clone & Pivot" branching, and set the plan's **Home Country & Base Currency** (`EUR`, `GBP`, `USD`, `AUD`, etc.).
* **Step 1: The Frictionless "Brain Dump" (Voice or Text)** (Conversational extraction of the lightbulb moment and user journey).
* **Step 2: Instant Concept Structuring (The "Mirror" Effect)** (Auto-generates the 1-page Concept Canvas).
* **Step 3: Guided Expansion Prompts** (Warm, clarifying questions to fill gaps).
* **Step 4: End-of-Module Review — "Things to Consider"** (Surfaces initial blind spots and populates the Open Questions Parking Lot—acting as the emotional hook before the Module B paywall).
* **Step 5: Multi-Plan Idea Comparator** (Side-by-side matrix comparing multiple ideas across Ease of Launch, Founder Fit, Time to Revenue, and Complexity—*Unlocked on Co-Founder/Multi-Plan Tiers*).

---

### Module B: Market Research & Validation ("Proving People Will Actually Pay") — *LOCKED IN*
**The Goal:** Help founders move from *"I think everyone needs this"* to concrete market data and real-world customer feedback—hosted directly inside BMU.

* **Step 1: Defining the "Who" & Target Geographies (Beachhead Market)**
  * Guides the founder to pick their **#1 most urgent buyer segment first** and specify **where those buyers are located** (e.g., Domestic-only vs. Selling into the UK, US, or EU)—which also informs export grant eligibility and cross-border tax rules in Module F.
* **Step 2: The AI Market Scout (Competitors & "The Status Quo")**
  * **Automated Competitor Discovery:** Searches and suggests 3–5 existing local and global competitors, pre-filling a comparison matrix for the founder to tweak.
  * **Uncovering the "Invisible Competitor" (The Status Quo):** Prompts the founder on how customers deal with the problem *today* (Excel, WhatsApp, pen and paper) so they can articulate why people will bother switching.
* **Step 3: Market Sizing Without the Maths Headache (TAM / SAM / SOM Builder)**
  * Uses a **Plain-English Bottom-Up Calculator** (*Number of target buyers in launch region $\times$ Annual spend = Starting Market*), paired with top-down industry stats for investor decks.
* **Step 4: Native Hosted Validation Survey & Response Engine**
  * **Auto-Generated Survey Draft:** Based on Module A & B, the platform generates a ready-to-send customer discovery survey.
  * **"Mom Test" Politeness Trap Detector:** Flags leading questions (*"Would you buy my app?"*) and suggests unbiased alternatives (*"How much time/money did this problem cost you last month?"*).
  * **Hosted Public Survey Link (Per Plan):** Generates a clean, mobile-friendly public URL (e.g., `buildmyunicorn.com/v/plan-slug`) that the founder can share on LinkedIn, WhatsApp, or email—with optional lead capture ("Leave your email for early access").
  * **Live Response Dashboard & AI Insights:** Responses flow directly back into the founder's workspace, charting the data and automatically summarizing key patterns.
  * **1-on-1 Interview Logger:** For B2B founders doing coffee chats or calls instead of surveys, a quick note-logger that feeds into the same validation summary.
* **Step 5: End-of-Module Review — "Market Things to Consider"**
  * Summarizes **Switching Friction**, **Vitamin vs. Painkiller reality checks**, and flags any discrepancies between what the founder assumed in Module A and what survey respondents actually said in Step 4.

---

### Module C: The Business, Operations & Team ("How the Engine Actually Runs") — *LOCKED IN*
**The Goal:** Move beyond the "shiny product" to define how the business actually operates day-to-day, ensure every critical startup function has a clear owner, and force co-founders to have the awkward, high-stakes conversations *before* they incorporate.

* **Step 1: Product Scope & The "Version 1" Filter (MVP vs. Phase 2)**
  * The founder dumps all their planned features/services. The platform helps sort these into **"Day 1 Must-Haves"** vs. **"Phase 2 Nice-to-Haves"**—generating a clean, visual **Product & Service Roadmap**.
* **Step 2: "A Day in the Life of an Order" (Operations & Fulfillment Mapper)**
  * Walks the founder chronologically through a single customer interaction from behind the scenes (payment $\rightarrow$ delivery/fulfillment $\rightarrow$ support/returns).
* **Step 3: The "Startup Hats" Matrix (Who Does What & Skill-Gap Finder)**
  * **Plan-Scoped Team Seats (Up to 5 Collaborators):** Invite co-founders/team members to this specific plan.
  * **Mandatory "Startup Hats" Assignment:** Presents a checklist of 7 essential Day-1 Startup Hats (*Vision/Investor Relations, Product/Tech Build, Sales, Marketing, Customer Support, Operations/Admin, Finance/Bookkeeping*) that must be assigned to a named person or flagged as an external gap.
  * **Overload & Skill-Gap Check:** Flags if one person is wearing too many hats or lacks experience in a critical role.
* **Step 4: The "Blind-Reveal" Co-Founder Alignment Interview ("The Awkward Questions")**
  * Each founder privately answers the same high-stakes questionnaire (*Public Face & Media Ego, Relocation for Investment, Time & Personal Runway, Exit Vision, Deadlocks & Firing*). Once all submit, the platform unlocks a side-by-side **Alignment & Friction Report**.
* **Step 5: End-of-Module Review — "Operational & Team Things to Consider"**
  * Highlights Co-Founder Mismatches, 4-year vesting with a 1-year cliff, and Single Points of Failure.

---

### Module D: Selling & Revenue ("How Money Actually Changes Hands") — *LOCKED IN*
**The Goal:** Move founders past arbitrary top-line price tags to understand how a sale actually happens, how long it takes, and what profit actually remains in their pocket after hidden costs.

* **Step 1: Revenue Model & Pricing Architect**
  * Guides the founder through proven revenue models and compares their starting price against the competitors discovered in Module B.
* **Step 2: "How a Sale Actually Happens" (The Buying Journey & Friction Mapper)**
  * Walks the founder step-by-step through how a stranger turns into a paying customer (B2C impulse vs. B2B procurement delays and 30/60/90-day invoice terms).
* **Step 3: The "Pocket Profit" Calculator (Unit Economics Without the Jargon)**
  * Interactive visual breakdown of **1 Single Sale**: *Starting Price Charged $\rightarrow$ Minus Sales Tax/VAT $\rightarrow$ Minus Payment/App Store Fees $\rightarrow$ Minus Direct Delivery Cost (COGS) $\rightarrow$ Minus Estimated CAC = **What You Actually Keep (Contribution Margin)**.*
* **Step 4: End-of-Module Review — "Revenue & Sales Things to Consider"**
  * Surfaces **"The Low-Price SaaS Trap"**, **B2B Cashflow Lag Warnings**, and **Churn/Repeat Purchase reality checks**.

---

### Module E: Marketing & Branding ("Finding Your First 100 Customers") — *LOCKED IN*
**The Goal:** Stop founders from burning cash on random ads or spending weeks designing logos, and instead build a concrete playbook for their first 10 and first 100 customers.

* **Step 1: Brand Positioning & The "3-Second Pitch" (Identity Without Procrastination)**
  * Locks in the core **One-Liner**, **Trust Signals**, and a **Digital Footprint Checklist**.
* **Step 2: The "First 10 Customers" Hustle Playbook (Zero-Budget Traction)**
  * Separates unscalable Day-1 hustle (warm outreach, niche communities, strategic partners, and converting leads captured from their Module B Validation Survey) from long-term paid scaling.
* **Step 3: Scalable Channels & Reverse-Engineered Marketing Budget Calculator**
  * Works backward from their monthly customer goal (*Desired Customers $\rightarrow$ Required Leads/Trials $\rightarrow$ Required Clicks $\rightarrow$ Realistic Monthly Spend or Sweat Equity*).
* **Step 4: End-of-Module Review — "Marketing Things to Consider"**
  * Runs a **CAC vs. Pocket Profit Collision Check**, flags **"Build It and They Will Come"** budget imbalances, and prompts two-sided marketplaces on how they will solve the **Chicken-and-Egg** seeding problem.

---

### Module F: Finances, Grants, Accounting & Legal Red Tape ("Knowing Your Numbers, Finding Free Money & Protecting the Business") — *LOCKED IN*
**The Goal:** Build a rock-solid financial model, match the startup with local non-dilutive grants and tax schemes to bridge their funding gap, and complete a localized legal compliance checklist—all adapted to the founder's home country and target markets.

#### How International Rules & Grants Are Handled (The "3-Tier Localization Engine"):
1. **Universal Financial Principles (100% Global):** Unit economics, P&L vs. Cashflow timing, Breakeven math, Cap Table dilution, Vesting cliffs, and IP assignment apply everywhere.
2. **Pre-Built "Core Market" Rule & Grant Packs (IE, UK, US, EU, AU, CA):** Automatically swaps local currency (`€`, `£`, `$`), tax terminology (*VAT* vs. *Sales Tax* vs. *GST*), employer payroll tax benchmarks, corporate entities, and **curated national grant/tax databases**.
3. **AI Dynamic Country Adapter ("Rest of World" + Cross-Border Alerts):** Pulls specific local tax thresholds, regional startup grants, and cross-border selling compliance for any country corridor.

* **Step 1: The "No-Spreadsheet" Financial Builder (Auto-Synced from Modules C, D & E)**
  * **Zero-Blank-Grid Experience:** 70% of their financial model is pre-assembled in their chosen base currency from **Module D (Pocket Profit)**, **Module E (Marketing Budget)**, and **Module C (Team & Hiring)**.
  * **Guided Scenario Sliders:** Simple interactive sliders allow the founder to test *"What if our sales grow 20% slower?"* or *"What if we hire a developer in Month 6 instead of Month 1?"* and immediately see the impact.
* **Step 2: The Localized "Forgotten Overheads & Hidden Costs" Checklist**
  * Walks the founder through recurring costs using benchmarks localized to their HQ country (Tech/Cloud, Localized Payroll Taxes like PRSI/NIC/FICA/Super, Accounting/Legal/Insurance).
* **Step 3: Cashflow vs. Profit & The "Runway / Funding Gap" Calculator**
  * **The "Actual Cash in the Bank" Visualizer:** 36-month visual chart separating **Paper Profit (P&L)** from **Actual Cashflow**, showing exact monthly breakeven and their **Maximum Cash Trough (Funding Gap)**.
  * **Standard International Exports:** One-click export to clean **3-Year P&L, Cashflow, and Balance Sheet spreadsheets (Excel/CSV)** formatted to standard IFRS / GAAP layouts.
* **Step 4: Localized Grant Finder, R&D Tax Credits & Non-Dilutive Funding Matcher**
  * Matches the startup with local government grants (e.g., *LEO & Enterprise Ireland*, *Innovate UK*, *SBIR/STTR*, *SR&ED*, *EMDG*), **R&D Tax Credits**, and **Investor Tax Reliefs** (*SURE/EII*, *SEIS/EIS*, *QSBS*).
* **Step 5: Localized Corporate Structure, Tax & The "IP Shield" Checklist**
  * Covers local entity types, Freelancer/Agency IP Assignment checks, auto-populated **Co-Founder Heads of Agreement** from Module C, and cross-border selling tax/privacy rules.
* **Step 6: End-of-Module Review — "Financial, Grant & Legal Things to Consider"**
  * Highlights **Grant Cashflow Reality Checks ("Grants Reimburse, They Don't Pre-Pay")**, **"Don't Incorporate Too Early" Grant Traps**, and Working Capital Gaps.

---

### Module G: The Living Business Plan & Grant Application Editor ("Turning Your Workspace Into Official Documents") — *LOCKED IN*
**The Goal:** Take everything the founder has built across Modules A–F and compile it into a polished, bank-ready, and grant-ready **Business Plan Document** inside a collaborative rich-text editor—with bidirectional syncing so their numbers and narrative never go out of date.

* **Step 1: Instant Compilation & "Audience Template" Switcher**
  * Compiles Modules A–F into a structured narrative with 4 toggleable audience presets: **Standard Comprehensive Business Plan**, **Grant / LEO / Enterprise Agency Format**, **Traditional Bank / Loan Format**, and **Lean 2-Page Executive Memo**.
* **Step 2: Notion-Style Rich Editor with "Live Data Blocks"**
  * Full rich-text editing where Competitor tables (Module B), Validation Survey charts (Module B), Startup Hats tables (Module C), and 3-Year Financial Summaries (Module F) are embedded as **Live Blocks** that auto-sync when numbers change upstream.
* **Step 3: Inline AI Section Co-Pilot & Tone Polisher**
  * Highlight any section to *"Strengthen with My Survey Data"*, *"Rewrite for Grant Panel / Bank Tone"*, or *"Condense to Strict Word/Character Limits"*.
* **Step 4: The "Open Questions & Red Flag" Pre-Flight Check**
  * Sidebar audit that flags unresolved items in the **Open Questions Parking Lot**, checks for **narrative-vs-financial contradictions**, and scores the plan against Grant/Bank rubrics.
* **Step 5: Export, Version Snapshots & Secure Live Sharing**
  * One-click export to **PDF**, **Word (`.docx`)**, **Google Docs**, plus the 3-Year Excel Financial Appendix; **Grant Portal Copy-Paste Mode**; named Version Snapshots; and a **Password-Protected Read-Only Web Link** for mentors/advisors.

---

## 3. Master Admin Panel ("The Control Room") — *LOCKED IN*
**The Goal:** Give you (and your team) complete control over users, account moderation, deep user analytics, AppSumo voucher campaigns, Stripe passes, AI prompts, country tax/grant rules, and future white-label tenants from a single web dashboard—so you never need a developer to manage users, update a grant, or tweak a prompt.

### 3.1 User Lifecycle, Moderation & Workspace Management
* **360° User & Startup Plan Directory:**
  * Search, sort, and filter all users by signup date, country, pass/LTD tier, cohort/tenant, last active date, number of Startup Plans created, current module progress, or AI token consumption.
* **Account Moderation: Suspend, Pause & Reactivate Users:**
  * **1-Click Suspend / Ban User:** Immediately revokes active login sessions (JWT/session invalidation), blocks future logins, pauses any active billing, and automatically disables any public-facing Validation Survey links (`buildmyunicorn.com/v/slug`) associated with their plans.
  * **Custom Suspension Reason & Internal Notes:** Log why an account was suspended (e.g., *AppSumo 60-day refund processed, Payment dispute, ToS violation, Spam survey abuse*) and optionally display a custom message if they try to log in.
* **User & Workspace Deletion (Soft Delete + Hard GDPR Purge):**
  * **Soft Delete (30-Day Trash / Recovery Window):** Archives the user and their plans so if a founder accidentally deletes their account (or you remove the wrong test user), you can restore them in 1 click within 30 days.
  * **Co-Founder Safety Check on Deletion:** If User A is deleted/refunded but their Startup Plan has an active Co-Founder (User B), the Admin Panel prompts you to either **Transfer Plan Ownership to Co-Founder B** or delete the entire workspace.
  * **Permanent Hard Delete (GDPR "Right to be Forgotten" Purge):** Permanently wipes the user's PII, plans, survey responses, and AI chat logs from the database and backups, generating a compliance log ID.
* **Safe "Impersonate / View-As" Support Mode:**
  * One-click ability to view a user's workspace in read-only or support mode (with an audit log) to troubleshoot an issue or review their plan when they submit a support ticket.

### 3.2 AppSumo Voucher Engine, Code Stacking & AI Margin Protection (CRITICAL FOR LTDs)
* **Bulk Voucher / License Code Generator & CSV Importer:**
  * Generate batches of 10,000+ unique voucher codes (e.g., `SUMO-BMU-XXXX-XXXX`) to upload to AppSumo, or import AppSumo's pre-generated code lists via CSV.
  * Track every code's status in real time: `Unclaimed`, `Redeemed (with User ID & Date)`, `Stacked`, or `Refunded / Revoked`.
* **Dedicated Redemption Landing Page & In-App Code Stacking:**
  * **Frictionless Onboarding (`buildmyunicorn.com/redeem`):** AppSumo buyers land on a dedicated welcome page, enter their voucher code(s), create their account, and immediately unlock their Lifetime Tier without needing a credit card.
  * **"Stack More Codes" Inside Billing Settings:** Inside their account settings, a simple **"Redeem Additional Code"** box lets them paste a 2nd, 3rd, or 5th code to instantly upgrade their tier limits.
* **AppSumo "Code Stacking" Structure (Built to Encourage Multi-Code Buys):**
  * **Tier 1 (1 Code – "Solo Founder"):** **1 Active Startup Plan**, **1 User Seat** (No Co-Founder Interview/Seats), Standard AI Co-Pilot allowance, Unlimited PDF/Word Exports.
  * **Tier 2 (2 Codes – "Co-Founder / Pivot Tier"):** **3 Active Startup Plans** (unlocks Multi-Plan Idea Comparator & Clone/Pivot), **Up to 3 Team Seats per Plan** (unlocks the *Blind-Reveal Co-Founder Alignment Interview*), 3x Monthly AI Credit allowance.
  * **Tier 3 (3+ Codes – "Serial Entrepreneur / Advisor Tier"):** **10+ Active Startup Plans**, **5 Team Seats per Plan**, White-Label PDF Export (remove *"Powered by Build My Unicorn"* watermark on exported Business Plans), Priority AI allowance + **BYOK (Bring Your Own OpenAI/Anthropic/Gemini API Key)** option for heavy power users.
* **Automated 60-Day AppSumo Refund / Revocation Handler:**
  * Automatically steps down or locks accounts when refunded codes are processed via webhook or CSV upload.
* **LTD AI Margin Protection:**
  * Monthly replenishing "Unicorn AI Credits", smart model tiering (Flash/Mini models for 90% of tasks), and $10 Top-Up packs or BYOK.

### 3.3 Deep User & Platform Analytics Dashboard
* **User Activity & Engagement Metrics:** DAU/WAU/MAU, cohort retention (segmented by Direct Buyers vs. AppSumo LTDs vs. University/Accelerator Cohorts), and demographic breakdowns by Country, Industry, and Team size.
* **Module Completion & "Friction Heatmap":** Visual funnel of Module A $\rightarrow$ G completion plus exact steps where users click *"I'm Stuck"* or drop off.
* **Feature Adoption & Individual User Timelines:** Full chronological log per user.

### 3.4 Country Rule Packs & Grant Database Manager (No-Code CMS)
* **Jurisdiction & Tax Rule Editor** + **Grant Directory CMS** with **AI "Grant Scraper / Updater" Assistant**.

### 3.5 AI Prompt Studio, Guardrails & Cost Control ("The Brain Manager")
* **Module Prompt & Persona Manager**, **Token Usage & Cost Tracking**, and **1-Click Model Switcher**.

### 3.6 Module Flow, Templates & Micro-Coaching CMS
* **Question & Step Editor**, **Business Plan Template Builder**, and **Hosted Survey Moderation Kill-Switch**.

### 3.7 Multi-Tenant / White-Label Portal Manager (Phase 2 Ready)
* **Tenant Provisioning, Cohort Codes & Mentor Dashboards** for Universities, Accelerators, and LEOs.

---

## 4. Direct Monetization, Paywall & Institutional Architecture — *LOCKED IN*

### 4.1 Direct Founder Flow: Option 1 ("Module A Free Hook $\rightarrow$ 6-Month Launch Pass")
Instead of a high-churn monthly subscription that founders cancel after 3 weeks, BMU 2.0 uses a **Freemium Ideation Hook** combined with a **One-Off 6-Month Pass**:

1. **The Free Hook (Module A – Ideation):**
   * Any founder can sign up for free (no credit card required) and complete **Module A (Steps 1–4)**: Brain Dump $\rightarrow$ 1-Page Concept Canvas $\rightarrow$ Guided Expansion $\rightarrow$ Initial *"Things to Consider"* Blind-Spot Review.
   * *Why this works:* It costs you less than **$0.005 in AI tokens** per free user, delivers an immediate "Aha!" moment when they see their idea articulated professionally, and hooks them by revealing 3–5 blind spots they need Modules B–G to solve.
2. **Where the Paywall Hits:**
   * Clicking into **Module B (Market Research & Hosted Survey)**, **Multi-Plan / Clone & Pivot**, **Co-Founder Alignment Interview (Module C)**, **Grant Finder (Module F)**, or **Business Plan Export (Module G)** triggers the upgrade modal.
3. **The Direct Pricing Menu (One-Off 6-Month Passes):**
   * **6-Month "Solo Founder Pass" (€99 / $99 One-Off):** No recurring billing. Full access to Modules A–G for 6 months, 1 Startup Plan, 1 User Seat, Hosted Validation Survey, Grant Matcher, and Unlimited PDF/Word/Excel Exports.
   * **6-Month "Co-Founder & Pivot Pass" (€149 / $149 One-Off):** Everything above + **Up to 3 Startup Plans (Clone & Pivot + Idea Comparator)** + **Up to 3 Co-Founder Seats** (unlocks the *Blind-Reveal Co-Founder Interview*).
4. **Post-6-Month "Vault Mode" & Renewal:**
   * After 6 months, their account never gets deleted—it drops into **Read-Only "Vault Mode"** where they can still view and download their past exports. To unlock editing and AI again (e.g., for a Phase 2 grant a year later), they can buy another pass or toggle a **$9/mo "Keep Warm" extension**.

### 4.2 How Accelerators, Universities & LEOs Fit Into This Exact Structure
* **Stage 1 (Day 1 Ready): "Cohort Pass Bundles" Using Your Existing Voucher Engine**
  * Generate a single **Cohort Invite Code or Link** in your Admin Panel (e.g., `BMU-UCD-2026` or `buildmyunicorn.com/join/galway-leo` capped at 50 seats) that unlocks the **6-Month "Co-Founder & Pivot Pass"** for the semester/cohort.
* **Stage 2 (Phase 2 Rollout): Full White-Label Portal + "Mentor / Lecturer View"**
  * Adds custom subdomains (`nova.buildmyunicorn.com`), custom grading/grant rubrics, a **Lecturer/Mentor Bird's-Eye Dashboard**, and the **Graduation B2B2C Upsell** when the semester ends.

---

## 5. Technical Architecture & Local-to-Cloud Stack (Optimized for Antigravity + Argon) — *LOCKED IN*

### 5.1 Why "Next.js (TypeScript) + Drizzle ORM + PostgreSQL" is the #1 Stack for Antigravity & Argon
When building an entire SaaS locally inside **Antigravity** using the **Argon** model, the single biggest multiplier for speed and zero-bug code generation is **Unified Type-Safety in a Single Repository**:

1. **Argon's #1 Strength (TypeScript + Next.js App Router + Tailwind + shadcn/ui):**
   * Argon has massive training depth on **Next.js (App Router), React Server Actions, TypeScript, and Tailwind CSS**.
   * Because frontend UI components, backend API routes, database schemas, and AI prompts all live in **one unified TypeScript codebase**, Argon's agentic context can read your database table in `src/db/schema.ts` and immediately generate the matching API route and React form in a single pass without hallucinating mismatched field names.
2. **Why Drizzle ORM (Instead of Prisma) for Antigravity:**
   * **Drizzle ORM** is pure TypeScript—there is no separate `.prisma` binary language or slow code-generation step required. When Argon updates a database column in `schema.ts`, TypeScript immediately highlights every file in your workspace that needs updating, allowing Antigravity's terminal loop to auto-fix any type errors instantaneously.
3. **Why Local-First Authentication (`Better-Auth` or `Auth.js` backed by PostgreSQL) Beats Cloud-Only Auth:**
   * Since you are building **locally first**, relying on a cloud-hosted auth service can slow down local testing.
   * By using **Better-Auth** (or **NextAuth / Auth.js v5**) stored directly inside your **PostgreSQL** database:
     * It runs **100% offline/locally** on Day 1 without needing cloud credentials.
     * It natively supports **Multi-Tenancy / Organizations**, **Admin "Impersonate / View-As User"**, **1-Click Session Revocation (Ban/Suspend)**, and Google/LinkedIn OAuth when you deploy to Google Cloud!

---

### 5.2 The "Local First $\rightarrow$ Google Cloud Run" Workflow
This setup lets you build and test 100% of BMU 2.0 on your local machine inside Antigravity, and then deploy the exact same environment to Google Cloud Run in one command:

| Layer | Local Build Environment (Inside Antigravity) | Production Cloud Environment (Google Cloud) |
| :--- | :--- | :--- |
| **App Server & UI** | `npm run dev` (`localhost:3000` – Next.js Full-Stack) | **Google Cloud Run** (Auto-scaling container from `Dockerfile`) |
| **Database** | **Local PostgreSQL + `pgvector`** (via `docker-compose.yml`) | **Google Cloud SQL for PostgreSQL** (Managed, automated backups) |
| **DB Admin GUI** | **Drizzle Studio** (`npx drizzle-kit studio` on local port) | **Drizzle Studio** or Cloud SQL Studio |
| **Authentication** | **Better-Auth** (Email/Pass + Local Mock OAuth in Postgres) | **Better-Auth** (Same tables + Live Google/LinkedIn OAuth keys) |
| **AI Engine** | **Google GenAI SDK (`@google/genai`)** with API Key in `.env.local` | **Vertex AI / Gemini API** (Gemini 2.5 Flash & Pro) |
| **File Storage** | Local `./storage` folder (or MinIO container) | **Google Cloud Storage (GCS)** bucket (swapped via env variable) |
| **Email Testing** | **Mailpit / Resend Local Preview** (catches co-founder invites locally) | **Resend** or **SendGrid** transactional emails |

---

### 5.3 Antigravity Project Structure (Designed for Argon Context Window)
Organizing the project like this ensures Argon always knows exactly where to find and wire up modules without getting confused as the codebase grows:

```text
bmu-platform/
├── GEMINI.md / AGENTS.md        # Master architectural rules & context for Argon in Antigravity
├── docker-compose.yml           # Spins up local PostgreSQL (with pgvector) in 1 click
├── Dockerfile                   # Production container spec for Google Cloud Run
├── src/
│   ├── db/
│   │   ├── schema/              # Modular Drizzle PostgreSQL tables (users, plans, modules, vouchers)
│   │   └── seed.ts              # Pre-loads IE/UK/US Country Rules, Grants & Test Users locally!
│   ├── lib/
│   │   ├── ai/                  # Unified AI Router (Gemini Flash/Pro, Prompt Studio loader, Token logger)
│   │   ├── entitlements/        # Paywall & AppSumo Code Stacking checker ("canCreatePlan()", "canInvite()")
│   │   ├── localization/        # 3-Tier Country Rule & Currency adapter
│   │   └── exporters/           # PDF (Playwright), Word (docx), and Excel (exceljs) generators
│   ├── app/
│   │   ├── (public)/            # Landing page, /redeem (AppSumo), and /v/[slug] (Hosted Validation Surveys)
│   │   ├── (auth)/              # Login, Register, Co-Founder Invite Acceptance
│   │   ├── (workspace)/         # Main Founder App: Plan Switcher + Modules A through G + AI Sidekick
│   │   └── (admin)/             # Section 3 Master Admin "Control Room" (Users, Vouchers, Grants, Analytics)
│   └── components/
│       ├── ui/                  # shadcn/ui primitives
│       ├── coaching/            # Layer 1-3 Support ("Why Ask This?", Industry Examples, "I'm Stuck")
│       └── editor/              # TipTap Rich Business Plan Editor + Live Financial Data Blocks
```

---

### 5.4 Core Multi-Tenant & Multi-Plan Database Schema (PostgreSQL + Drizzle)
Here is how the core tables connect so that **Free Users, 6-Month Pass Buyers, AppSumo Code Stackers, and University Cohorts** all work seamlessly on a single unified data model:

1. **`tenants` (White-Label Orgs - Day 1 Ready):**
   * `id`, `name`, `slug` (e.g., `default`, `ucd-nova`, `leo-dublin`), `custom_domain`, `branding_json` (logo, colors), `custom_rubric_json`.
2. **`cohorts` (University Semesters / Accelerator Batches):**
   * `id`, `tenant_id`, `name` (e.g., *"Spring 2027 Bootcamp"*), `invite_code` (`BMU-UCD-2027`), `max_seats`, `expires_at`.
3. **`users`:**
   * `id`, `email`, `password_hash`, `full_name`, `role` (`FOUNDER`, `MENTOR`, `TENANT_ADMIN`, `SUPER_ADMIN`), `status` (`ACTIVE`, `SUSPENDED`, `SOFT_DELETED`), `suspension_reason`, `deleted_at`.
4. **`user_entitlements` (The Unified Paywall & AppSumo Brain):**
   * `id`, `user_id`, `plan_type` (`FREE_HOOK`, `SIX_MONTH_PASS`, `APPSUMO_LTD`, `COHORT_PASS`), `stacked_codes_count` (0, 1, 2, 3+), `max_startup_plans` (1, 3, 10), `max_seats_per_plan` (1, 3, 5), `monthly_ai_credits_limit`, `ai_credits_used_this_month`, `custom_api_key_encrypted` (for BYOK), `access_expires_at` (`NULL` for AppSumo LTD, `+6 months` for Pass/Cohort), `is_vault_readonly` (Boolean).
5. **`vouchers` (AppSumo & Cohort Codes):**
   * `code` (`SUMO-XXXX`), `batch_name`, `source` (`APPSUMO`, `COHORT`, `PROMO`), `status` (`UNCLAIMED`, `REDEEMED`, `REFUNDED_REVOKED`), `redeemed_by_user_id`, `redeemed_at`.
6. **`startup_plans` (The 1-to-Many Workspace):**
   * `id`, `owner_user_id`, `tenant_id`, `cohort_id`, `parent_plan_id` (if cloned/pivoted!), `title`, `hq_country_code` (`IE`, `GB`, `US`), `base_currency` (`EUR`, `GBP`, `USD`), `target_markets_array`, `current_module_step`, `status` (`ACTIVE`, `ARCHIVED`).
7. **`plan_collaborators` (Co-Founder Seats & Hats):**
   * `id`, `plan_id`, `user_id`, `role` (`OWNER`, `CO_FOUNDER`, `ADVISOR_READONLY`), `assigned_hats_array` (`['TECH', 'MARKETING']`), `alignment_interview_json` (stores private answers until all co-founders submit!).
8. **`plan_modules_data` (Structured Answers + Blind-Spot Reviews):**
   * `id`, `plan_id`, `module_code` (`MOD_A` through `MOD_G`), `structured_inputs_jsonb`, `ai_things_to_consider_jsonb`, `completion_percentage`.
9. **`open_questions_parking_lot`:**
   * `id`, `plan_id`, `source_module`, `question_text`, `status` (`OPEN`, `RESOLVED`), `resolution_notes`.
10. **`validation_surveys` & `survey_responses` (Module B Hosted Engine):**
    * `id`, `plan_id`, `public_slug`, `is_active`, `questions_jsonb` + `responses` table (`answers_jsonb`, `respondent_email`).
11. **`country_rules`, `grants_directory` & `ai_prompts` (Admin CMS Tables):**
    * Stores localized VAT/payroll rates, searchable government grants by `country_code`, and editable system prompts per module.

---

### 5.5 Recommended Local Phased Build Order Inside Antigravity
So that Argon builds the platform cleanly without getting overwhelmed, we should feed the build to Antigravity in **6 logical sprints**:

* **Sprint 1: Local Foundation, Database Schema & Entitlement Engine**
  * Spin up Next.js + Tailwind + Drizzle + Local Postgres (`docker-compose`), seed default Country Rules (IE/UK/US/AU/CA), build Auth, the Multi-Plan Switcher, and the AppSumo `/redeem` + Entitlement middleware.
* **Sprint 2: The AI Core, Support Layers (Section 0) & Module A (The Free Hook)**
  * Build the unified AI Router (`@google/genai`), the Slide-Out "Ask Unicorn" Sidekick, the *"Why Ask This?"* / *"Show Example"* components, and complete **Module A (Brain Dump $\rightarrow$ Concept Canvas $\rightarrow$ Things to Consider $\rightarrow$ Idea Comparator)**.
* **Sprint 3: Modules B & C (Market Validation Survey Engine + Operations, Hats & Co-Founder Interview)**
  * Build the Market Scout, TAM/SAM/SOM calculator, the public Hosted Survey Engine (`/v/[slug]`), the Startup Hats Matrix, and the Blind-Reveal Co-Founder Alignment Interview.
* **Sprint 4: Modules D, E & F (Pocket Profit, Marketing Playbook, Financial Builder & Grant Matcher)**
  * Build the Unit Economics calculator, Marketing Reverse-Funnel, Auto-Synced 36-Month Financial Model (with Excel export), and the Localized Grant & Tax Credit Matcher.
* **Sprint 5: Module G (TipTap Living Business Plan Editor & PDF/Word Exporters)**
  * Build the Notion-style rich editor with Live Data Blocks, Audience Template Switcher, Red-Flag Audit, and PDF/DOCX export engines.
* **Sprint 6: The Master Admin "Control Room" & Google Cloud Run Deployment**
  * Build the Admin Dashboard (User Suspend/Delete, AppSumo CSV generator, Analytics Heatmap, Grant CMS, Prompt Studio) and package the `Dockerfile` for **Google Cloud Run + Cloud SQL**.