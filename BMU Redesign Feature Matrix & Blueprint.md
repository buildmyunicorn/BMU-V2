# Build My Unicorn (BMU) 2.0 – Product, Commercial & Technical Blueprint

## Core Philosophy: The "Supportive Co-Founder & Blind-Spot Engine"

**"Everyone can have a great idea. It’s everything else around it that makes or breaks the startup."**
First-time founders suffer from "unknown unknowns"—they don't know what they don't know. However, hitting an excited founder with harsh criticism on minute one kills momentum.

Instead, BMU 2.0 follows a **"Capture First, Expand Second"** flow:
1. **Extract & Clarify:** Act as an enthusiastic, structured sounding board to get the messy idea out of the founder's head and onto paper cleanly.
2. **"Things to Consider" (The Blind-Spot Review):** Once the vision is captured at the end of a module, gently surface the hidden operational realities, industry traps, and questions they haven't thought about yet—framed as constructive prompts rather than roadblocks.

## Architectural & Strategic Decisions (Locked In)
* **Tech Stack Rebuild:** Moving away from legacy `.NET` to a modern, AI-coding-optimized **Next.js (TypeScript) + Drizzle ORM + PostgreSQL** stack—built **locally first inside Antigravity using Argon**, and deployed via Docker to **Google Cloud Run**.
* **Multi-Tenancy from Day 1:** Even though **White-Labeling** (for Accelerators, LEOs, UK Growth Hubs, Universities) is a Phase 2 rollout, the database and authentication architecture must be designed as multi-tenant from day one so orgs can spin up custom portals later without a rewrite.
* **Multi-Plan / Multi-Project Workspaces (1-to-Many Architecture):** A single user account can create, manage, and switch between **multiple startup plans/ideas**.
  * *Why this matters:* Serial entrepreneurs have multiple ideas on the go; early founders often want to test 2–3 different concepts in Module A before committing to one; and existing founders frequently want to **clone/branch** an existing plan to test a B2B vs. B2C pivot without losing their original work.
  * *Database Hierarchy:* `Tenant (White-Label Org)` $\rightarrow$ `Cohort / Program (Optional)` $\rightarrow$ `User Account` $\rightarrow$ `Startup Plan / Workspace (Multiple)` $\rightarrow$ `Plan-Specific Team Collaborators & Modules (A–K)`.
* **Unified Entitlement Engine (6-Month Pass + AppSumo LTD + Institutional Cohort Pass):**
  * Built-in entitlement engine that supports **Free Module A Hooks**, **One-Off Time Passes (6-Month Launch Pass)**, **AppSumo Lifetime Deal (LTD) Vouchers**, AND **B2B Institutional Seat Licenses**, with strict monthly AI token guardrails and a global 500 calls/day circuit breaker to protect margins.
* **International Jurisdiction & Localization Engine (Plan-Level Settings):**
  * Every Startup Plan has core geographic settings established at creation:
    1. **Incorporation / HQ Country, Region & Base Currency:** (e.g., Ireland/EUR with County/LEO Region, UK/GBP with Growth Hub/Devolved Nation Region, US/USD, Australia/AUD, Canada/CAD, EU, or "Rest of World").
    2. **Target Selling Markets:** Where their customers actually live (local only vs. global/exporting).
  * **Dynamic Rule & Terminology Switching:** Uses a modular **Country Rule Pack** (combined with AI context awareness) that automatically swaps terminology, tax estimates, corporate structures, compliance checklists, and **eligible government grants** across all modules.
* **AI-First Guided Extraction:** Replacing intimidating blank forms and passive videos with an interactive, conversational extraction flow.

---

## Section 0: Platform Support & In-App Guidance Architecture (Zero-Video, Low Overhead — LOCKED IN)
Since we are building from scratch and dropping high-maintenance video tutorials and manual human brokers, "Support" is baked directly into the UI across **4 automated layers + Edge-Case Selector Protection**:

### Layer 1: Contextual "Micro-Coaching" (Preventing Confusion Before It Happens)
* **"Why Are We Asking This?" Cards:** Every question or section includes a subtle toggle explaining *why* investors/grant boards care in plain English (e.g., *"Investors look at Customer Acquisition Cost because..."*).
* **Dynamic Industry Examples ("Show Me an Example"):** Clicking *"Show me an example"* generates 2–3 realistic sample answers tailored to their exact industry (e.g., showing how a SaaS app vs. a local bakery would answer the question).
* **Inline Jargon Buster (Interactive Tooltips):** Hovering or tapping on terms like *TAM/SAM/SOM, Vesting Cliff, Churn,* or *Gross Margin* pops up a 2-sentence plain-English explanation—plus how it applies to their specific plan.

### Layer 2: The Context-Aware AI Sidekick ("Ask Unicorn")
* **Persistent Slide-Out Co-Pilot:** Available on every screen with **full read-access to the current Startup Plan** and awareness of the exact step (`currentModuleStep`) the user is on.
* **"I'm Stuck — Interview Me" Button:** Inside any input field, clicking *"Help me think through this"* breaks the big question down into 2 or 3 tiny, easy-to-answer questions, then drafts the response for them.
* **Platform & How-To Support:** Trained on all BMU 2.0 documentation to instantly answer platform questions (*"How do I invite my co-founder to only this plan?"* or *"How do I stack a second AppSumo code?"*).

### Layer 3: Proactive "Unblocker" Prompts (Momentum Protection)
* **Idle / Friction Detection & Industry Benchmarks:** If a founder stalls on a quantitative step, they can click *"Insert Industry Benchmark Estimate"* for now and refine it later.
* **"Good Enough for Now" Draft Mode ("Park It"):** Allows founders to click *"I don't know yet — Park in Open Questions"* (sending it to their **Open Questions Parking Lot**) so they never feel blocked from moving to the next module.

### Layer 4: Automated Technical, Account Triage & Mentor Escalation
* **Smart Bug / Feedback Reporter:** Captures browser state, current Plan ID, and step context automatically.
* **White-Label Mentor Escalation (Phase 2 Ready):** Allows cohort founders to flag a specific module for their Accelerator/LEO/University mentor to review.

### Edge-Case Protection: Always Include an "Other" Option on Tile/Pill Selectors
* Every single-select or multi-select tile, card, button, or pill option group across all modules (Modules A–K) **must** include an `"OTHER"` option that reveals an inline custom text input when selected, persisted in the plan data and reflected in AI blind-spot reviews and exported briefs.

### Confirmed Removals & Deferred Features
* ❌ **Pre-recorded Video Tutorials:** Dropped (replaced by Section 0 Contextual Micro-Coaching).
* ❌ **Trusted Expert Network (Manual Broker):** Dropped (operational bottleneck, NDA friction).
* ❌ **Clickable HTML Prototyping Service:** Dropped (removing manual/automated UI prototyping from core scope).
* ⏸️ **Pitching & Investor Deck Module:** Parked for a later phase so we can focus on the core Business Plan & Official Grant Compiler first.

---

## Section 1: The 11 Core Founder Modules (Modules A–K)

### Module A: Ideation, Founder DNA & Vision Extraction (The "Free Hook" Experience)
*Because Module A is the free experience before the paywall, it cannot feel like a basic 4-box form. It must give the founder goosebumps—helping them understand **themselves** and their **business** so deeply in 15 minutes that upgrading feels like a no-brainer.*

* **Step 0: The "Idea Vault", Plan Switcher & Location Setup**
  * Create a plan (or multiple plans on paid tiers), use "Clone & Pivot" branching, and set the plan's **Home Country & Base Currency** (`EUR`, `GBP`, `USD`, `AUD`, `CAD`).
* **Step 1: The "Founder North Star & Motivation" Check ("Why Are You Doing This?")**
  * **Your Personal Driver:** Why start this now? *(e.g., "Solve a problem I lived through personally", "Escape the 9-to-5 & own my time", "Build generational wealth / big exit", "Create local impact / jobs").*
  * **The "Success Definition" (3 Years From Now):**
    * **Path A: The "Cashflow & Freedom" Engine (Bootstrapped / Grant-Backed):** Profitable by Month 9, 100% owned by you, small nimble team, pays you a great salary.
    * **Path B: The "High-Growth Scale / Unicorn" Track (Investor-Backed):** Fast international expansion, raising Seed/Series A, aiming for a €10M–€100M+ exit (or graduating from LEO to **Enterprise Ireland HPSU** / **UK SEIS & Innovate UK** status).
  * **Your Non-Negotiables & Guardrails:** Available hours/week, max personal savings willing to risk, and technical comfort level.
* **Step 2: Frictionless Brain Dump ("Tell the Story of Your Idea")**
  * Voice dictation (microphone) or free-text input where the founder explains the lightbulb moment and how the idea works in their own words.
* **Step 3: Instant 1-Page Concept Canvas + "Name & Tagline Polisher"**
  * AI mirrors their messy brain dump back as a crisp **1-Page Concept Canvas** (*The Problem, The Target Customer, The Core Solution, The "Why Now" Edge*) AND generates **3 punchy 1-Sentence Elevator Pitches**.
  * **Instant Domain & Business Email Availability Check (Affiliate Hook):** Automatically checks live `.ie`, `.co.uk`, and `.com` availability for the AI-polished startup names and displays a 1-click **"Secure Your Domain & Google Workspace"** perk card (powered by Blacknight / Namecheap / Cloudflare affiliate links with `planId` sub-ID tracking).
* **Step 4: Visual "Customer Journey Storyboard" ("Before vs. After Your Startup")**
  * Generates a visual 3-step **"Old Painful Way"** vs. **"New Way With Your Product"** flow so they see their product through a real human's eyes.
* **Step 5: Guided Business Model Archetype, Localization & Grant Sector Pre-Check**
  * **Zero-Friction Geo-Cookie Pre-Selection:** Reads the `bmu_region` cookie set on the Geo-Targeted Landing Page (`IE`, `GB`, `CA`, `AU`, `US`) to automatically pre-select the founder's HQ Country and default currency before they even touch the dropdown.
  * Sets HQ Country (`IE`, `GB`, `US`, `AU`, `CA`, `EU`, `ROW`), Local Authority / Region:
    * **For Ireland (`IE`):** County / LEO Region (automatically distinguishes **50% Standard** vs. **60% Border, Midlands & West / BMW region**).
    * **For United Kingdom (`GB`):** Region (*England Local Growth Hub, Scottish Enterprise, Welsh Government, Invest Northern Ireland*) — plus checks if the business operates in an **HMRC Excluded Trade** (e.g., property development, financial/legal services, energy generation) which would disqualify it from **SEIS/EIS**.
  * **Automatic Grant & Research Category Classification:**
    * Tags **LEO Sector** (*Manufacturing*, *Internationally Traded Services*, or *Local Retail/Service*).
    * Tags **Innovate UK Research Category** (*Feasibility Study*, *Industrial Research*, or *Experimental Development* — which determines whether Innovate UK funds **70%**, **60%**, or **45%** of total project costs for a micro/small SME!).
* **Step 6: The "Idea Stress-Test & Fit Scorecard" (Founder-Market Fit)**
  * Checks if the **Founder's Motivation & Guardrails (Step 1)** match the **Business Idea (Steps 2–5)** and suggests how to reshape the idea if there is a mismatch.
* **Step 7: "Things to Consider" Blind-Spot Preview + The "Unicorn Teaser Blueprint" (The Paywall Bridge)**
  * Surfaces 3–5 constructive blind spots, populates the Open Questions Parking Lot, and displays a tailored preview of the Grants, Hosted Customer Survey Page, Product Build Blueprint, and Co-Founder Alignment Interview waiting behind the Launch Pass.
* **Step 8 (Optional Power Tool): Multi-Plan Idea Comparator**
  * Side-by-side scoring matrix for founders comparing 2+ ideas against their Step 1 Personal Motivations (*Unlocked on Co-Founder/Multi-Plan Tiers*).

---

### Module B: Market Research, SWOT & Export/Displacement Analysis
* **Step 1: Beachhead Customer Selector:** Narrows down from "everyone" to the #1 most urgent buyer persona and specifies target geographies.
* **Step 2: AI Market & Competitor Scout + "State-of-the-Art" & SWOT Analysis:**
  * Identifies direct competitors (including geographic location), indirect alternatives, and the "Status Quo" workaround.
  * **Structured SWOT Matrix (Required for IE LEO Business Plan Section 3 & UK Start Up Loans).**
  * **"Current State-of-the-Art & Why It Fails" (Mandatory for Innovate UK Smart Grant Q4):** Explicitly contrasts the founder's innovation against the current industry "state of the art" to prove it is a disruptive step-change rather than an incremental improvement.
* **Step 3: Plain-English Market Sizing (TAM / SAM / SOM) & 5-Year Commercialisation Forecast:**
  * Bottom-up market sizing calculator + **Market Trends narrative** (min. 150 words for LEO; max 400 words for Innovate UK Smart Grant Q6 *The Potential Market*).
* **Step 4: Competitive Wedge Matrix, Export Potential, "Non-Displacement" & Wider Economic/Net-Zero Impact:**
  * **For Ireland (LEO):** Documents **Import Substitution, Export Potential, and Non-Displacement proof** (proving the business does not simply take customers from a neighbor in the same county).
  * **For the UK (Innovate UK Smart Grant Q7 — *Impact & Benefits*, 600 words):** Quantifies **Wider UK Economic, Social, Regional & Environmental (Net Zero / Carbon Reduction / EDI) Impact** outside the business itself.
* **Step 5: "Market Things to Consider":** Flags switching friction, vitamin vs. painkiller checks, regulatory barriers, and local displacement traps.

---

### ⭐ Module C: Customer Surveys, Feedback & Early Waitlist (Flagship Standalone Module #1)
* **Why This Is a Flagship Selling Point:** Both **IE LEO** and **UK Start Up Loans / Innovate UK** explicitly require primary market research (surveys, customer quotes, and letters of intent) to prove demand is real. BMU 2.0's built-in **Hosted Survey, Feedback & Early Waitlist Engine** (`buildmyunicorn.com/v/[slug]`) generates verifiable primary market research directly inside the platform.
* **Step 1: The AI "Mom Test" Survey Architect (Bias-Free Question Generator & Politeness Trap Detector)**
* **Step 2: Hosted Public Survey & Early-Access Waitlist Page (`buildmyunicorn.com/v/[slug]`)**
* **Step 3: The "Where to Get 25 Responses in 48 Hours" Outreach Kit + Printable QR Code**
* **Step 4: 1-on-1 Customer Interview Script & Call Notes Logger**
* **Step 5: Live Response Dashboard, AI Sentiment Synthesis & "Pivot or Proceed" Scorecard**
* **Step 6: "Survey & Validation Things to Consider"**

---

### Module D: "What Are We Actually Building?" (Product Vehicle, Work Packages & Technical Merit)
* **Step 1: The "Product Vehicle" Selector:** Physical Product, Software/Digital, Productized Service, Content/Community, or Hybrid.
* **Step 2: The "Where Does It Live?" Channel & Platform Decision Matrix (Own vs. Rent the Shelf):** Amazon/Etsy vs. Own Shopify D2C vs. "Trojan Horse" Hybrid; Web App vs. iOS/Android App Store.
* **Step 3: The "Build vs. Buy vs. Stitch" Architecture Recommender (3 Realistic Build Tiers):** Tier 1 (€0–€500 No-Code/Concierge), Tier 2 (€500–€5,000 Shopify/Low-Code/White-Label), Tier 3 (€15k+ Custom Build/Manufacturing).
  * **Contextual Tech Stack Perks (Affiliate Hook — Steps 2 & 3):** When a founder selects their Product Vehicle and Build Tier (e.g., Shopify D2C, Webflow/Bubble No-Code, or Stripe), displays a tailored **"Claim Founder Stack Credits"** card (e.g., Shopify Partner trial + cashback, Stripe fee-free processing credits).
  * **"Request 3 LEO-Compliant Dev/Build Quotes" Button (3-Quote Marketplace Hook):** For Tier 2 (€500–€5,000) and Tier 3 (€15k+ Custom Build) projects, allows the founder to click **"Get 3 Vetted Agency Quotes in 48 Hours"**—auto-packaging their Module D Product Scope & Work Packages (`WP1–WP3`) into a standardized RFP sent to vetted Irish/UK partner agencies.
* **Step 4: Product Scope & The Ruthless "Version 1" Feature/SKU Filter**
* **Step 5: Work Packages, Technical Merit Diagram & Subcontractor Plan (IE LEO + UK Innovate UK Ready!):**
  * **For IE LEO Feasibility Grant:** Structures the R&D Work Plan, start/completion dates, and external consultant qualifications.
  * **For UK Innovate UK Smart Grant (Q4 & Q8 Mandatory 2-Page PDF Appendices):**
    * **Work Package & Gantt Milestone Builder:** Breaks the build into numbered **Work Packages (`WP1`, `WP2`, `WP3`)** with dependencies, deliverables, and labour allocations—and exports the mandatory **2-Page A4 Project Plan PDF (11pt font)** required by the Innovate UK portal!
    * **Technical Merit Diagram Generator (Q4 Appendix):** Generates a clean 2-page technical architecture/flow diagram PDF evidencing how the innovation works.
    * **UK Location & Subcontractor Justification Rule:** Enforces the 100% UK R&D rule and prompts for justification if any overseas subcontractor is used.
* **Step 6: "Supply Chain, Tech Stack & Build Things to Consider"**

---

### Module E: Operations, Premises, Equipment Schedule & Risk Register
* **Step 1: "A Day in the Life of an Order" (End-to-End Fulfillment Blueprint)**
* **Step 2: Premises, Plant & Equipment Schedule + Grant Asset Rules (IE LEO vs. UK Innovate UK):**
  * **For Ireland (LEO Priming/Feasibility):** Enforces the **1-Quote (<€5k) / 3-Quote (>€5k) Rule** and automatically blocks **Excluded Mobile Assets** (laptops, tablets, smartphones, and vehicles) from being placed in the LEO Capital Grant claim.
  * **The "3-Quote Concierge" Supplier Engine (3-Quote Marketplace Hook):** Directly solves the IE LEO **1-Quote (<€5k) / 3-Quote (>€5k) Rule**. Next to any equipment, branding, or R&D consultancy line item without uploaded PDF quotes, founders can click **"Auto-Request 3 LEO-Compliant Quotes"** from BMU's Verified Supplier Marketplace. Uploaded partner quotes automatically attach to Appendix C of the LEO compilation pack in Module K.
  * **For UK (Innovate UK Smart Grant):** Includes an automatic **Innovate UK Capital Usage & Depreciation Calculator** (since Innovate UK only funds the depreciated usage of equipment during the grant project months).
* **Step 3: Formal Project Risk Register (Mandatory for UK Innovate UK Q8 Appendix & UK Start Up Loans):**
  * Generates a structured **Risk Register Table** across **Technical, Commercial, Managerial, and Environmental Risks** (Likelihood 1–5, Impact 1–5, Mitigation)—formatted to export as the mandatory **2-Page A4 Risk Register PDF Appendix** for Innovate UK.
* **Step 4: Customer Support, Refunds & Quality Control Playbook**
* **Step 5: Permits, Licences, Animal Testing Declaration & Industry Compliance:**
  * **Instant Startup Insurance Matcher (Affiliate Hook):** Prompts founders who need Public Liability, Employer's Liability, or Professional Indemnity cover with a 1-click quote link via vetted UK/IE startup insurers (e.g., Superscript, Hiscox, Dolmen).
* **Step 6: "Operational Things to Consider"**

---

### ⭐ Module F: Team, Promoter Background, "Personal Survival Budget" & The Blind-Reveal Co-Founder Engine (Flagship Standalone Module #2)
* **Step 1: Solo vs. Co-Founder Team Setup & Seat Invites (Up to 5 Collaborators)**
* **Step 2: Promoter Education, Work History & CV Profile Builder:**
  * Generates the **150+ Word Promoter Narrative + Appendix D CV** for IE LEO AND the **400-Word "Delivering Your Project / Team Capability" answer** for UK Innovate UK Smart Grant Q8.
* **Step 3: The "Personal Survival Budget" (Mandatory Tab #2 of the UK Start Up Loans Workbook!):**
  * Calculates the founder's personal monthly living costs vs. household income to prove their exact **Minimum Monthly Salary / Drawings Needed**, feeding directly into both the UK Start Up Loans Workbook and the Startup Cashflow Model.
* **Step 4: The "7 Startup Hats" Role & Responsibility Matrix** (*Vision/Investor Relations, Product/Tech Build, Sales, Marketing, Customer Support, Operations/Admin, Finance/Bookkeeping*) + Overload & Skill-Gap Check.
* **Step 5: The "Blind-Reveal" Co-Founder Alignment Survey (The 12 Awkward Questions Engine):**
  * Each founder privately answers the same high-stakes questionnaire (*Media Spokesperson, Relocation, Weekly Hours, Day-Job Quit Milestone, Personal Runway, Minimum Salary, Day-1 Cash Contribution, Early €2M Exit Decision, Friends & Family Hiring Rule, Pivot Commitment, Underperformance Equity Rule, Deadlock Resolution*). Once all submit, the platform unlocks the side-by-side report.
* **Step 6: Side-by-Side Alignment Heatmap, Equity Split & "Co-Founder Heads of Terms" Export:**
  * Includes 4-year vesting with a 1-year cliff and the **UK SEIS/EIS Ordinary Share Warning** (ensuring no preferential dividend or liquidation rights disqualify angel shares).
* **Step 7: 3-Year Job Creation & Staffing Plan** (tracks IE LEO €15k/job grant eligibility and UK job creation metrics).

---

### Module G: Selling, Pricing, Sales Assumptions & Unit Economics
* **Step 1: Revenue Model & Pricing Architect** (informed by Module B Competitors & Module C Surveys).
* **Step 2: "How a Sale Actually Happens" & Written Sales Assumptions (IE LEO Section 7 + UK Start Up Loans Tab #3):**
  * Walks through B2C impulse vs. B2B procurement delays (30/60/90-day invoice terms) and documents seasonality, conversion rates, average order volume per month, and confirmed pipeline/orders.
* **Step 3: The "Pocket Profit" Unit Economics Calculator:**
  * Interactive visual breakdown of **1 Single Sale**: *Starting Price Charged $\rightarrow$ Minus Sales Tax/VAT $\rightarrow$ Minus Payment/App Store Fees $\rightarrow$ Minus Direct Delivery Cost (COGS) $\rightarrow$ Minus Estimated CAC = **What You Actually Keep (Contribution Margin)**.*
* **Step 4: "Revenue Things to Consider":** Surfaces the Low-Price SaaS Trap, B2B Cashflow Lag Warnings, and Churn/Repeat Purchase reality checks.

---

### Module H: Marketing, 4Ps Strategy & Reverse-Engineered Budget
* **Step 1: Brand Positioning & The "3-Second Pitch"** (One-Liner, Trust Signals & Digital Footprint Checklist).
* **Step 2: The "4Ps" Marketing Strategy, Route to Market & Digital Presence:**
  * Satisfies IE LEO's **150-Word Minimum on Website/Online Sales/Social Media** AND UK Innovate UK's **400-Word Route to Market & Commercialisation** requirement.
* **Step 3: The "First 10 Customers" Hustle Playbook:**
  * Separates unscalable Day-1 hustle (warm outreach, niche communities, strategic partners, and converting leads captured from their Module C Validation Survey) from long-term paid scaling.
* **Step 4: Reverse-Engineered Marketing Budget Calculator:**
  * Works backward from their monthly customer goal (*Desired Customers $\rightarrow$ Required Leads/Trials $\rightarrow$ Required Clicks $\rightarrow$ Realistic Monthly Spend or Sweat Equity*).
* **Step 5: "Marketing Things to Consider":** Runs a CAC vs. Pocket Profit Collision Check and flags Chicken-and-Egg marketplace seeding challenges.

---

### Module I: Finances, Localized Taxes, 36-Month Cashflow & Legal Red Tape
* **Step 1: The "No-Spreadsheet" Financial Builder + Sensitivity Analysis:**
  * 70% pre-assembled in their chosen base currency from **Module G (Pocket Profit)**, **Module H (Marketing Budget)**, and **Module F (Team & Hiring)**, with interactive scenario sliders.
* **Step 2: The "Forgotten Overheads" & Localized Tax Checklist:**
  * Automatically switches between **Ireland** (*Employer PRSI 11.15%, VAT 23%*), **United Kingdom** (*Employer National Insurance 13.8%, Workplace Pension 3% Auto-Enrolment, VAT 20% above £90k threshold, Corporation Tax 19–25%*), **US**, **AU**, **CA**, and **EU**.
  * **Cloud Accounting Software Setup (Affiliate Hook):** Offers 50%–75% off first 6 months on **Xero, QuickBooks, FreeAgent, or Surf Accounts** directly alongside the 36-Month Cashflow export.
* **Step 3: 36-Month Cashflow Trough, P&L & Balance Sheet Generator:**
  * Separates **Paper Profit (P&L)** from **Actual Cashflow**, showing exact monthly breakeven and calculating the exact **Maximum Cash Trough / Funding Gap** (e.g., *"You hit a cash trough of -€32,000 in Month 11 before turning cashflow-positive in Month 14"*), which feeds straight into **Module J (Grants & Funding Matcher)**! Includes 1-click IFRS/GAAP Excel/CSV export.
* **Step 4: Corporate Structure, Cap Table, IP Assignment Shield & Advisors Directory:**
  * Captures LTD vs. Sole Trader status, IP assignment agreements for developers/freelancers, and the names of the startup's **Bank, Accountant, Solicitor, and Insurance Broker**.
  * **Business Bank Account & LTD Incorporation Perks Drawer (Bank Bounty Hook):** If the founder selects *"Not Incorporated Yet"* or *"No Business Bank Account Yet"*, opens a localized **"Fast-Track Incorporation & Banking"** drawer:
    * **UK (`GB`):** 1-click free/discounted Companies House LTD registration + £50–£100 founder cash bonus when opening a business bank account via **Tide, Revolut Business, Starling, or Anna Money**.
    * **Ireland (`IE`):** Discounted CRO LTD incorporation bundle + instant Irish IBAN business banking via **Revolut Business or Wise Business**.
* **Step 5: "Financial & Legal Things to Consider"**

---

### ⭐ Module J: Grants, Non-Dilutive Funding & Investor Tax Relief Hub (Flagship Standalone Module #3)
* **Why This Deserves Its Own Dedicated Module in the Sidebar:**
  *"Find Free Government Grants & Tax Relief"* is one of the single highest-converting hooks for startups in Ireland and the UK. Having **Module J: Grants & Funding Hub** prominently visible in the left navigation bar shows founders immediately that BMU 2.0 doesn't just help them plan—it helps them **fund** the business without giving away equity.

* **Step 1: Instant Grant & Tax Relief Matcher (Powered by Data Collected in Modules A–I)**
  * Uses the founder's HQ Country (`IE`, `GB`, `US`, `AU`, `CA`, `EU`), County/Region (e.g., *50% Standard vs. 60% BMW Region* in Ireland), Sector (*Manufacturing / Internationally Traded Services* vs. *Local Retail*), Headcount, and Module I **Cashflow Funding Gap** to rank every eligible program into 3 buckets:
    * 🟢 **Ready to Apply Now (High Match)**
    * 🟡 **Eligible Once Incorporated / Trading**
    * 🔴 **Not Eligible (With Clear Explanation Why — e.g., Local Retail Displacement or HMRC Excluded Trade)**
  * **Ireland (`IE`) Programs Matched:**
    1. **LEO Feasibility Study Grant:** Up to €15,000 (50% match, or 60% in BMW counties).
    2. **LEO Priming Grant:** Up to €150,000 (for startups within first 18 months; up to €15,000 per new full-time job created + eligible capital/consultancy/marketing costs).
    3. **LEO "Digital for Business" Consultancy & "Grow Digital / AI Voucher":** Free expert digital/AI strategy consultancy (worth ~€2,700) + up to **€5,000 grant (50% match)** for AI tools, CRM, e-commerce, or cybersecurity implementation (crucially eligible across wider SME sectors, even where Priming Grants are restricted).
    4. **Enterprise Ireland "Digital Discovery" Grant:** **80% funding up to €5,000** for external digital/AI readiness consultancy for EI/Údarás clients and exporting SMEs.
    5. **Enterprise Ireland New Frontiers (€15,000 tax-free stipend) & Pre-Seed Start Fund (PSSF — €50k–€100k).**
    6. **SURE (Startup Refunds for Entrepreneurs):** Refunds up to 41% of previous PAYE income tax paid over the last 6 years when investing savings into your own LTD company.
    7. **Revenue R&D Tax Credit (30%) & Employment Investment Incentive (EII) Scheme.**
  * **United Kingdom (`GB`) Programs Matched:**
    1. **British Business Bank Start Up Loans:** Up to **£25,000 per co-founder** (up to £100k per team) at a fixed 6% interest rate + 12 months free mentoring.
    2. **Innovate UK Smart Grants & Sector Competitions:** £100k–£500k+ R&D grants (up to **70% funded for micro/small SMEs** on feasibility/industrial research).
    3. **HMRC SEIS (50% Angel Income Tax Relief up to £250k) & EIS Advance Assurance.**
    4. **InterTradeIreland Cross-Border SEIS/EIS & Innovation Grants** (for Irish/NI founders raising from UK angels).
    5. **UK Merged R&D Tax Credit (RDEC) / ERIS (27% cash credit for R&D-intensive SMEs).**
  * **Global (`US`, `AU`, `CA`) Programs Matched:** SBIR/STTR, AusIndustry R&D Tax Incentive & EMDG, CRA SR&ED & NRC IRAP.

* **Step 2: Interactive "Grant Readiness Scorecard" & Missing Evidence Checklist**
  * **Automated Incorporation & Banking Unlocker (Bank Bounty Hook):** Whenever a grant is marked 🟡 *"Eligible Once Incorporated / Business Bank Account Opened"*, displays an inline action card: **"Unlock This Grant in 10 Minutes — Register Your LTD & Open Your Business Bank Account (Plus Claim €50–£100 Startup Cash)"**.
  * For every grant the founder selects, displays a live readiness bar (e.g., **`90% Complete from Modules A–I`**) and prompts ONLY for the remaining grant-specific items in one clean screen:
    * **For IE LEO Priming/Feasibility:** Verifies the **1-Quote (<€5k) / 3-Quote (>€5k) Schedule**, flags any accidentally included laptops/phones, checks **50%/60% Match Funding proof**, and captures **CRO Number, eTax Clearance Access Number, and EU *De Minimis* State Aid declaration**.
    * **For UK Innovate UK Smart Grant:** Generates the **Q5 Additionality / Justification for Public Funding narrative** (why private investors won't fund the R&D risk today), **Q9 Value for Money for the UK Taxpayer**, confirms **100% UK R&D location**, and checks the **UK Minimal Financial Assistance (£315k MFA)** subsidy limit.
    * **For UK Start Up Loans:** Verifies alignment between the founder's **Personal Survival Budget (Module F)**, **Written Sales Assumptions (Module G)**, and **36-Month Cashflow Forecast (Module I)**.
    * **For UK HMRC SEIS / EIS Advance Assurance:** Generates the formal **HMRC "Risk-to-Capital" Condition Statement**, checks **Ordinary Shares (no liquidation preference)**, captures the **10-digit UK UTR Number & Date Trading Started**, and logs the **Mandatory Named Prospective Angel Investor(s)**.

* **Step 3: The "Grant Timing & Cashflow Bridge" Reality Check**
  * **The Reimbursement Warning:** Visually overlays the grant payout timeline onto the founder's Module I Cashflow Chart—showing them that **grants reimburse after you spend the money and submit receipts + tax clearance**, so they need working capital (or a Microfinance Ireland / UK Start Up Loan bridge) to pay suppliers upfront.
  * **The "Don't Spend Before Approval" Rule:** Warns founders that any invoice dated *before* the official LEO or Innovate UK Grant Offer Letter is signed is **100% ineligible** for reimbursement.

* **Step 4: 1-Click "Send to Module K Official Application Compiler"**
  * Sends the selected Grant/SEIS package directly into **Module K** to compile the official forms, word-count-checked answers, and Appendices A–F.

---

### Module K: The Living Business Plan & Official Grant Application Compiler
* **Step 1: Instant Compilation & "Official Format" Switcher:**
  * Founders can switch their compiled workspace with 1 click between **5 Official Country & Funder Formats**:
    1. 🇮🇪 **Ireland — Official LEO Business Plan & Priming/Feasibility Form Mode:** Enforces the 7 official LEO sections, **150-Word Minimum Green Checkmarks**, and Appendices A–F.
    2. 🇬🇧 **UK — Innovate UK Smart Grant (IFS Portal Mode):** Formats answers to the exact **9 IFS Portal Questions** with strict **Maximum Word-Count Bars** (*300 / 400 / 600 words*) + generates the **2-Page A4 11pt Font PDF Appendices** (Project Plan Gantt, Risk Register, and Technical Merit Diagram).
    3. 🇬🇧 **UK — British Business Bank "Start Up Loans" 4-Part Pack:** Outputs the aligned *1. Business Plan, 2. Personal Survival Budget (from Module F), 3. Written Sales Assumptions (from Module G), and 4. 12–36 Month Cashflow Forecast (from Module I)*.
    4. 🇬🇧 **UK — HMRC SEIS / EIS Advance Assurance Pack:** Outputs the HMRC-compliant 3-Year Business Plan, 3-Year Financial Forecast, "Risk-to-Capital" Cover Letter, Named Investor Schedule, and Articles of Association Ordinary Share Checklist.
    5. 🌍 **Universal Comprehensive Business Plan / 2-Page Executive Teaser.**
* **Step 2: Rich Editor with Live Financial, Survey & Equipment/Work-Package Blocks**
* **Step 3: Inline AI Polish & Min/Max Word-Count Sizer** (expands to >150 words for LEO; trims to <400 or <600 words for Innovate UK).
* **Step 4: The "Grant & HMRC Committee Pre-Flight Audit" (`gemini-2.5-pro`)**
* **Step 5: Complete Application Pack Export (Word `.docx`, PDF, Excel `.xlsx` & Read-Only Advisor Link).**

---

## Section 2: How the "Invisible Grant Engine" & Module J Work Together
1. **Stage 1 — Quiet Background Capture (Modules A $\rightarrow$ I):** As the founder answers normal, plain-English business questions in Modules A–I, BMU quietly structures 85% of the required IE LEO and UK Innovate UK / Start Up Loan / SEIS fields in the background.
2. **Stage 2 — Dedicated Grants & Funding Hub (Module J):** Matches the founder with every eligible grant/relief in their country, shows a `90% Ready` progress bar, and collects the final administrative details (quotes, tax clearance, named SEIS investor, or additionality justification).
3. **Stage 3 — Official Compiler (Module K):** Compiles the finished application, word-count-checked boxes, financial tables, and Appendices A–F in one click.

---

## Section 3: Master Admin Panel ("The Control Room") — *LOCKED IN*
**The Goal:** Give you (and your team) complete control over users, account moderation, deep user analytics, AppSumo voucher campaigns, Stripe passes, AI prompts, country tax/grant rules, partner monetization, and future white-label tenants from a single web dashboard.

### 3.1 User Lifecycle, Moderation & Workspace Management
* **360° User & Startup Plan Directory:** Search, sort, and filter all users by signup date, country, pass/LTD tier, cohort/tenant, last active date, number of Startup Plans created, current module progress, or AI token consumption.
* **Account Moderation: Suspend, Pause & Reactivate Users:**
  * **1-Click Suspend / Ban User:** Immediately revokes active login sessions, blocks future logins, pauses any active billing, and automatically disables any public-facing Validation Survey links (`buildmyunicorn.com/v/[slug]`) associated with their plans.
  * **Custom Suspension Reason & Internal Notes:** Log why an account was suspended and optionally display a custom message if they try to log in.
* **User & Workspace Deletion (Soft Delete + Hard GDPR Purge):**
  * **Soft Delete (30-Day Trash / Recovery Window):** Archives the user and their plans for 1-click restoration within 30 days.
  * **Co-Founder Safety Check on Deletion:** Prompts to either **Transfer Plan Ownership to Co-Founder B** or delete the entire workspace.
  * **Permanent Hard Delete (GDPR "Right to be Forgotten" Purge):** Permanently wipes the user's PII, plans, survey responses, and AI logs.
* **Safe "Impersonate / View-As" Support Mode:** One-click ability to view a user's workspace in read-only or support mode (with an audit log).

### 3.2 AppSumo Voucher Engine, Code Stacking & AI Margin Protection
* **Bulk Voucher / License Code Generator & CSV Importer:** Generate batches of 10,000+ unique voucher codes (`SUMO-BMU-XXXX-XXXX`) or import CSV lists; track `UNCLAIMED`, `REDEEMED`, and `REFUNDED_REVOKED`.
* **Dedicated Redemption Landing Page (`/redeem`) & In-App Code Stacking.**
* **AppSumo "Code Stacking" Structure:**
  * **Tier 1 (1 Code – "Solo Founder"):** 1 Active Startup Plan, 1 User Seat, Standard AI Co-Pilot allowance, Unlimited PDF/Word Exports.
  * **Tier 2 (2 Codes – "Co-Founder / Pivot Tier"):** 3 Active Startup Plans (unlocks Multi-Plan Idea Comparator & Clone/Pivot), Up to 3 Team Seats per Plan (unlocks *Module F Blind-Reveal Co-Founder Alignment Interview*), 3x Monthly AI Credit allowance.
  * **Tier 3 (3+ Codes – "Serial Entrepreneur / Advisor Tier"):** 10 Active Startup Plans, 5 Team Seats per Plan, White-Label Survey & PDF Export (remove *"Powered by Build My Unicorn"* watermark), Priority AI allowance + **BYOK (Bring Your Own Gemini API Key)** option.
* **Automated 60-Day AppSumo Refund / Revocation Handler** & **Monthly Replenishing Unicorn AI Credits**.

### 3.3 Deep User & Funnel Analytics Dashboard
* **User Activity & Engagement Metrics:** DAU/WAU/MAU, demographic breakdowns (country, industry, solo vs. team), AI token burn per user, Public Survey response volume, Co-Founder Interview completion rates, Grant Matcher conversion rates, and the **"Friction Heatmap"** across Modules A–K.

### 3.4 Country Rule Packs & Grant Database Manager (No-Code CMS)
* **Jurisdiction & Tax Rule Editor** + **Grant Directory CMS** with **AI Grant URL Scraper** (pre-loaded with Ireland LEO/Enterprise Ireland and UK Innovate UK/Start Up Loans/SEIS/EIS rules).

### 3.5 AI Prompt Studio, Guardrails & Cost Control ("The Brain Manager")
* Live-edit system instructions and model routing (`gemini-2.5-flash` vs. `gemini-2.5-pro`) for all 11 modules without redeploying code.

### 3.6 Partner Perks, Affiliate Links & "3-Quote Concierge" Manager
* **Contextual Affiliate CMS:** Manage partner cards, promo codes, and tracking URLs segmented by Country (`IE`, `GB`, `CA`, `AU`, `US`) and Module Step (`MODULE_A_DOMAIN`, `MODULE_D_SHOPIFY`, `MODULE_E_INSURANCE`, `MODULE_I_BANK`, `MODULE_I_ACCOUNTING`).
* **Sub-ID & Webhook Attribution:** Automatically appends `?subid=[planId]_[userId]` to all outbound bank, formation, and software affiliate links to track conversion payouts (via Impact, PartnerStack, Awin) and auto-check off the founder's *"Business Bank Account Opened"* milestone in Module J.
* **"3-Quote Concierge" Vendor Routing:** Manage vetted dev agencies, R&D consultants, and equipment suppliers by category; automatically route founder quote requests from Module D/E and track lead fees (€50–€100/lead) or project finder's fees (5%–10%).

---

## Section 4: Monetization, Renewals & Partner Revenue Architecture

1. **Core B2C Launch Passes (Option 1 Locked In):**
   * Free "Module A Hook" (Steps 1–7) $\rightarrow$ Paywall at Module B offering a **One-Off 6-Month Launch Pass** (**Solo Pass: €129 / £109** or **Co-Founder Team Pass: €199 / £169**).
   * Includes full access to Modules A–K, the Hosted Customer Survey Engine (`/v/[slug]`), the Blind-Reveal Co-Founder Engine, and Official Grant/SEIS Application Exports.

2. **Month-6 "Grant Radar & Living Vault" Micro-Subscription (Renewal Engine):**
   * At the end of the 6-Month Launch Pass, founders can either let their plan drop into **Read-Only Vault Mode (Free)** OR activate the **€9/month (or €79/year) "Grant Radar & Living Vault" Subscription**.
   * **What It Unlocks:** Keeps all 11 modules editable, maintains live public survey/waitlist pages, and runs an automated **24/7 Grant & Tax Relief Radar** that emails the founder the moment a new regional grant opens (or when their company crosses key age/headcount milestones, such as moving from LEO Feasibility $\rightarrow$ LEO Priming $\rightarrow$ Enterprise Ireland PSSF) with 90% of the new application pre-filled.

3. **AppSumo LTD Tiers:**
   * **1 Code:** Solo Founder, 1 Active Business Plan.
   * **2 Codes:** 3 Active Business Plans, 3 Co-Founder Seats + Module F Blind-Reveal Co-Founder Alignment Engine unlocked.
   * **3+ Codes:** 10 Active Business Plans, 5 Seats, Custom Branding on Public Surveys (`/v/[slug]`) & PDF Exports, plus BYOK (Bring Your Own API Key) support.
   * Includes 60-day refund auto-downgrade and monthly replenishing Unicorn AI Credits.

4. **B2B Institutional Cohort Pass Bundles:**
   * Designed for **Universities, Accelerators, Irish LEOs (SYOB courses), Enterprise Ireland New Frontiers, and UK Growth Hubs**.
   * Sold as bulk 6-Month Cohort Pass Bundles (€2,500–€5,000 per cohort) unlocked via a single institutional invite code, paired with White-Label Mentor Escalation (Section 0.4).

5. **Business Bank & LTD Incorporation Bounties (Modules I & J):**
   * High-converting CPA partner bounties (€50–€120 per activated account) triggered when unincorporated founders register their UK/Irish LTD company and open their mandatory business bank account (via **Tide, Revolut Business, Starling, Anna Money, Wise Business, and local CRO/Companies House formation partners**).
   * Framed as a **Founder Cash Perk** (e.g., *"Get £75–£100 free startup cash + free LTD incorporation"*).

6. **The "3-Quote Concierge" Supplier Marketplace (Modules D & E):**
   * Monetizes the mandatory **IE LEO 1-Quote (<€5k) / 3-Quote (>€5k) Rule** and UK R&D subcontractor sourcing.
   * Founders click *"Request 3 LEO-Compliant Quotes in 48 Hours"* in Module D (Tech Build) or Module E (Equipment/Consultancy); vetted partner agencies/suppliers pay BMU a **€50–€100 qualified lead fee** or a **5%–10% finder's fee** on grant-funded contracts won.

7. **Contextual Tech Stack, Domain & Insurance Affiliates (Modules A, D, E & I):**
   * Native, non-intrusive "Founder Perks" embedded at the exact moment of buyer intent:
     * **Module A (Step 3):** Domain registration (`.ie`, `.co.uk`, `.com`) & Google Workspace bundles.
     * **Module D (Steps 2–3):** E-commerce & No-Code platform referrals (**Shopify Partner Program** up to $150/merchant, Webflow, Bubble, Stripe).
     * **Module E (Step 5) & Module I (Step 4):** Startup Business Insurance (**Superscript, Hiscox, Dolmen**) and Cloud Accounting (**Xero, QuickBooks, FreeAgent**).

---

## Section 5: Technical Architecture & Local-to-Cloud Stack (Antigravity + Argon $\rightarrow$ Google Cloud Run)

| Layer | Local Build Environment (Inside Antigravity) | Production Cloud Environment (Google Cloud) |
| :--- | :--- | :--- |
| **App Server & UI** | `npm run dev` (`localhost:3000` – Next.js Full-Stack) | **Google Cloud Run** (Auto-scaling container from `Dockerfile`) |
| **Database** | **Local PostgreSQL + `pgvector`** (via `docker-compose.yml`) | **Google Cloud SQL for PostgreSQL** (Managed, automated backups) |
| **DB Admin GUI** | **Drizzle Studio** (`npx drizzle-kit studio` on local port) | **Drizzle Studio** or Cloud SQL Studio |
| **Authentication** | **Better-Auth** (Signed `HttpOnly` sessions + Postgres) | **Better-Auth** (Same tables + Live Google/LinkedIn OAuth keys) |
| **AI Engine** | **Google GenAI SDK (`@google/genai`)** via `src/lib/ai/router.ts` | **Vertex AI / Gemini API** (`gemini-2.5-flash` & `gemini-2.5-pro`) |
| **Email Testing** | **Mailpit** (`localhost:8025` via `docker-compose.yml`) | **Resend** or **SendGrid** transactional emails |

### Next.js Edge Geo-IP Detection
* **Zero-Latency Geo-IP Middleware (`src/middleware.ts`):**
  * Inspects incoming HTTP edge headers (`cf-ipcountry` via Cloudflare or `x-appengine-country` / `x-client-region` via Google Cloud Load Balancer) on the server before rendering HTML—preventing client-side layout shift or text flicker.
  * Sets an `x-bmu-region` request header and a persistent `bmu_region` cookie (`IE`, `GB`, `CA`, `AU`, `US`), plus a visible Top-Navbar Country Switcher Pill (`[ 🇮🇪 Ireland ▾ | 🇬🇧 UK ]`) so users on VPNs or in border regions (e.g., Northern Ireland cross-shopping Invest NI and InterTradeIreland) can switch manually at any time.

---

## Section 6: Feature Spotlight — The "Reverse-Engineered Launch Calendar"
* Counts **backwards** from the founder's Target Launch Date across Product Build, Legal/Tax Setup, **IE LEO / UK Innovate UK / SEIS Approval Lead Times**, Operations, and Pre-Launch Waitlist Warmup—alerting them immediately if their weekly hours and grant approval timelines make their launch date impossible.

---

## Section 7: Go-To-Market (GTM) & Marketing Strategy
1. **High-Intent Niche Google Search Ads (IE & UK):** Target specific painkiller searches for **Module J Grants** (*"LEO priming grant application"*, *"Innovate UK smart grant template"*, *"Start Up Loans personal survival budget"*, *"SEIS advance assurance business plan"*) and **Module F Co-Founder Pre-Nups** (*"co-founder equity split calculator"*).
2. **Viral Loop #1:** `"Powered by Build My Unicorn"` badge on every public **Module C Customer Survey & Waitlist Page** (`buildmyunicorn.com/v/[slug]`).
3. **Viral Loop #2:** Co-Founder Invites & social challenges built around **Module F's Awkward Co-Founder Questions**.
4. **Viral Loop #3:** Public SEO-indexed **IE & UK Startup Grant Directory** (`buildmyunicorn.com/grants/[slug]`) feeding straight into **Module J**.
5. **AppSumo Launch + B2B University / LEO / UK Growth Hub Cohort Partnerships.**
6. **Dynamic Regional Landing Pages & SEO Routes:**
   * **Dynamic Regional Homepage Personalization (`IE` vs. `GB`):**
     * **Ireland (`IE`) View:** Displays Irish trust banner, hero headline focused on **LEO Feasibility (€15k), LEO Priming (€150k), LEO Digital for Business / Grow Digital & AI Voucher (€5k), Enterprise Ireland Digital Discovery (80% up to €5k) & New Frontiers, and SURE Tax Refunds (41%)**, interactive County Selector (*50% Standard vs. 60% BMW Region*), Irish tax proof (*Employer PRSI, 23% VAT, CRO & eTax Clearance*), and Euro pricing (**€129 / €199**).
     * **United Kingdom (`GB`) View:** Displays UK trust banner, hero headline focused on **British Business Bank Start Up Loans (£25k/founder), Innovate UK Smart Grants (up to 70% R&D), and HMRC SEIS/EIS Advance Assurance**, UK tax/compliance proof (*Employer NI, 3% Workplace Pension, £90k VAT threshold, UTR & HMRC Excluded Trades*), and GBP pricing (**£109 / £169**).
   * **Dedicated Indexable SEO Routes (`hreflang` Support):**
     * Alongside dynamic root (`/`) detection, exposes static indexable routes at `/ie` (`hreflang="en-ie"`) and `/uk` (`hreflang="en-gb"`) so Googlebot (which crawls primarily from US IPs) indexes both the Irish and UK landing pages independently for local search rankings.

---

## Section 8: Security, Data Privacy & AI Billing Protection Architecture (Locked In)
1. **Zero Client-Side API Keys & Fail-Closed AI Router (`src/lib/ai/router.ts`):** Never expose `GEMINI_API_KEY` to the browser; verify signed `HttpOnly` session cookies server-side via `authorizeAndPrepareGeminiCall()` and fail closed to smart-synthesizer fallback when unauthenticated or out of credits.
2. **Hard Billing Circuit Breakers (`500` Calls/Day Global Ceiling & Burst Limits):** Enforces `DEFAULT_MAX_DAILY_PLATFORM_AI_CALLS = 500`, per-user burst rate limits (`8/min`, `60/hr`), prompt sanitization (`sanitizePromptInput`), and `maxOutputTokens: 2048`.
3. **BYOK API Key AES-256-GCM Encryption & Redaction (`src/lib/auth/server-auth.ts`):** Encrypts user BYOK keys at rest with AES-256-GCM and redacts to `'enc_gemini_byok_active'` in client snapshots.
4. **Plan Ownership Verification (IDOR Prevention):** Every plan-scoped Server Action verifies `verifyActiveSessionAndPlanOwnership(planId)` before reading or writing database records.
5. **Public Route PII Isolation & Anti-Spam (`/v/[slug]`):** Public survey routes never return respondent PII or waitlist emails (`responses: []`), enforce submission rate limits, and cap responses at `2,500` per survey.

---

## Section 9: Mobile & Responsive UX Architecture (Desktop-Primary, Mobile-Ready)
1. **Preserve Desktop Layout (`sm:` / `lg:` Breakpoints):** Keep the 12-column desktop workspace (`lg:grid-cols-12`) intact while stacking cleanly on mobile viewports.
2. **Zero iOS Safari Input Auto-Zoom (`16px` Mobile Inputs):** Enforce `16px` (`text-base sm:text-xs` / `text-base sm:text-sm`) on mobile inputs so iOS Safari never auto-zooms the page.
3. **Full-Width Mobile Answer Targets on Public Pages (`/v/[slug]`):** Use `sm:pl-9` and full-width mobile CTAs (`w-full sm:w-auto`).
4. **Collapsible Mobile Sidebar & Slim Sticky Header in `/workspace`:** Collapse the 11-module navigation list and Open Questions Parking Lot behind the mobile module switcher on `< 1024px` (`lg:hidden`).
