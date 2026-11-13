const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'public', 'appsumo-assets');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function xmlEscape(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function renderSvgToPng(svgString, filename) {
  const filePath = path.join(outDir, filename);
  await sharp(Buffer.from(svgString))
    .png({ quality: 95, compressionLevel: 8 })
    .toFile(filePath);
  console.log(`Created: ${filename}`);
}

async function main() {
  // =========================================================================
  // IMAGE 1: PLATFORM OVERVIEW & 3-YEAR POCKET PROFIT (1920x1080)
  // Sovereign Emerald & Deep Slate theme with Startup Sidekick realistic data
  // =========================================================================
  const heroSvg = `
  <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="heroBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#020617" />
        <stop offset="45%" stop-color="#0F172A" />
        <stop offset="100%" stop-color="#064E3B" />
      </linearGradient>

      <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#047857" />
        <stop offset="60%" stop-color="#059669" />
        <stop offset="100%" stop-color="#10B981" />
      </linearGradient>

      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="25" stdDeviation="35" flood-color="#000000" flood-opacity="0.75" />
      </filter>
    </defs>

    <rect width="1920" height="1080" fill="url(#heroBg)" />

    <!-- Isometric Background Structural Grid -->
    <g opacity="0.04" stroke="#94A3B8" stroke-width="1">
      <line x1="0" y1="180" x2="1920" y2="180" /><line x1="0" y1="360" x2="1920" y2="360" />
      <line x1="0" y1="540" x2="1920" y2="540" /><line x1="0" y1="720" x2="1920" y2="720" />
      <line x1="0" y1="900" x2="1920" y2="900" />
      <line x1="240" y1="0" x2="240" y2="1080" /><line x1="480" y1="0" x2="480" y2="1080" />
      <line x1="720" y1="0" x2="720" y2="1080" /><line x1="960" y1="0" x2="960" y2="1080" />
      <line x1="1200" y1="0" x2="1200" y2="1080" /><line x1="1440" y1="0" x2="1440" y2="1080" />
      <line x1="1680" y1="0" x2="1680" y2="1080" />
    </g>

    <!-- Top Badge -->
    <g transform="translate(960, 95)">
      <rect x="-270" y="-24" width="540" height="48" rx="24" fill="rgba(4, 120, 87, 0.20)" stroke="rgba(16, 185, 129, 0.45)" stroke-width="1.5" />
      <circle cx="-235" cy="0" r="6" fill="#10B981" />
      <text x="-215" y="6" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="700" fill="#6EE7B7" letter-spacing="1.5">
        INSTITUTIONAL UNDERWRITING STANDARD • 12-MODULE FOUNDER OS
      </text>
    </g>

    <!-- Main Headline & Subtitle -->
    <text x="960" y="185" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="-1">
      Turn Early-Stage Ideas Into Bankable, Profitable Ventures
    </text>
    <text x="960" y="235" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="500" fill="#94A3B8" text-anchor="middle">
      The Supportive Co-Founder &amp; Blind-Spot Engine • Customer Surveys • Pocket Profit • Bank &amp; Grant Readiness
    </text>

    <!-- UI Mockup Window -->
    <g transform="translate(160, 280)" filter="url(#shadow)">
      <rect width="1600" height="730" rx="24" fill="#0F172A" stroke="rgba(255, 255, 255, 0.15)" stroke-width="1.5" />

      <!-- Window Bar -->
      <path d="M 0 24 C 0 10.745 10.745 0 24 0 L 1576 0 C 1589.255 0 1600 10.745 1600 24 L 1600 64 L 0 64 Z" fill="#1E293B" />
      <line x1="0" y1="64" x2="1600" y2="64" stroke="rgba(255, 255, 255, 0.08)" />

      <!-- Window Dots -->
      <circle cx="32" cy="32" r="7" fill="#EF4444" />
      <circle cx="54" cy="32" r="7" fill="#F59E0B" />
      <circle cx="76" cy="32" r="7" fill="#10B981" />

      <text x="800" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="#94A3B8" text-anchor="middle">
        Startup Preflight Workspace — Startup Sidekick Ltd. • HQ: Dublin, Ireland 🇮🇪 • Target: LEO &amp; UK Bank Plan
      </text>

      <!-- Module Tabs Strip -->
      <g transform="translate(32, 85)">
        <rect x="0" y="0" width="220" height="42" rx="10" fill="#047857" />
        <text x="110" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#FFFFFF" text-anchor="middle">
          Mod H: Pocket Profit
        </text>

        <rect x="235" y="0" width="220" height="42" rx="10" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(255, 255, 255, 0.08)" />
        <text x="345" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#94A3B8" text-anchor="middle">
          Mod C: Survey Waitlist
        </text>

        <rect x="470" y="0" width="220" height="42" rx="10" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(255, 255, 255, 0.08)" />
        <text x="580" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#94A3B8" text-anchor="middle">
          Mod F: Co-Founder Fit
        </text>

        <rect x="705" y="0" width="220" height="42" rx="10" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(255, 255, 255, 0.08)" />
        <text x="815" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#94A3B8" text-anchor="middle">
          Mod L: Business Plan
        </text>

        <g transform="translate(1320, 0)">
          <rect x="0" y="0" width="210" height="42" rx="10" fill="rgba(16, 185, 129, 0.15)" stroke="rgba(16, 185, 129, 0.3)" />
          <circle cx="28" cy="21" r="5" fill="#10B981" />
          <text x="115" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#34D399" text-anchor="middle">
            All 12 Modules Synced
          </text>
        </g>
      </g>

      <!-- Left Column Metrics (Startup Sidekick Real Data) -->
      <g transform="translate(32, 145)">
        <rect x="0" y="0" width="440" height="160" rx="16" fill="#1E293B" stroke="rgba(255, 255, 255, 0.08)" />
        <text x="24" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#94A3B8" letter-spacing="1">
          YEAR 1 BREAKEVEN TARGET
        </text>
        <text x="24" y="90" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="42" font-weight="900" fill="#FFFFFF">
          34 Subscriptions / mo
        </text>
        <text x="24" y="130" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="500" fill="#10B981">
          &#x2191; Covers €4,200/mo founder survival burn &amp; cloud ops
        </text>

        <rect x="0" y="180" width="440" height="160" rx="16" fill="#1E293B" stroke="rgba(255, 255, 255, 0.08)" />
        <text x="24" y="218" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#94A3B8" letter-spacing="1">
          NET &quot;POCKET PROFIT&quot; MARGIN
        </text>
        <text x="24" y="270" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="44" font-weight="900" fill="#34D399">
          82.6%
        </text>
        <text x="24" y="310" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="500" fill="#CBD5E1">
          After Stripe processing (2.9%), VAT &amp; AI infrastructure
        </text>

        <rect x="0" y="360" width="440" height="175" rx="16" fill="#1E293B" stroke="rgba(255, 255, 255, 0.08)" />
        <text x="24" y="396" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#F59E0B" letter-spacing="1">
          AI BLIND-SPOT ENGINE
        </text>
        <text x="24" y="430" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="700" fill="#F8FAFC">
          &quot;LEO 50% Match Reimbursement Lag Detected&quot;
        </text>
        <text x="24" y="460" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="400" fill="#94A3B8">
          LEO claims reimburse post-expenditure. Maintain €12,500 working capital buffer to bridge invoice cycles.
        </text>
        <rect x="24" y="485" width="200" height="28" rx="6" fill="rgba(16, 185, 129, 0.15)" stroke="rgba(16, 185, 129, 0.3)" />
        <text x="124" y="504" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#6EE7B7" text-anchor="middle">
          Auto-Mitigated in Mod J Cashflow
        </text>
      </g>

      <!-- Right Column Interactive Graph Area -->
      <g transform="translate(500, 145)">
        <rect width="1065" height="535" rx="20" fill="#0A0F1D" stroke="rgba(255, 255, 255, 0.08)" />

        <text x="32" y="42" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="19" font-weight="800" fill="#FFFFFF">
          Pocket Profit Visual Breakeven Engine (3-Year Time Horizon)
        </text>
        <text x="32" y="68" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="500" fill="#64748B">
          Dynamic Crossover: Monthly Fixed Burn (€4,200) vs. Gross Revenue @ €129/pass
        </text>

        <g transform="translate(760, 24)">
          <rect x="0" y="0" width="80" height="32" rx="8" fill="#047857" />
          <text x="40" y="21" font-family="sans-serif" font-size="12" font-weight="700" fill="#FFFFFF" text-anchor="middle">Year 1</text>
          <rect x="90" y="0" width="80" height="32" rx="8" fill="rgba(255,255,255,0.05)" />
          <text x="130" y="21" font-family="sans-serif" font-size="12" font-weight="600" fill="#94A3B8" text-anchor="middle">Year 2</text>
          <rect x="180" y="0" width="80" height="32" rx="8" fill="rgba(255,255,255,0.05)" />
          <text x="220" y="21" font-family="sans-serif" font-size="12" font-weight="600" fill="#94A3B8" text-anchor="middle">Year 3</text>
        </g>

        <!-- Inner Chart -->
        <g transform="translate(60, 120)">
          <line x1="0" y1="0" x2="940" y2="0" stroke="rgba(255,255,255,0.05)" />
          <text x="-15" y="5" font-family="sans-serif" font-size="11" fill="#475569" text-anchor="end">€50k</text>
          <line x1="0" y1="80" x2="940" y2="80" stroke="rgba(255,255,255,0.05)" />
          <text x="-15" y="85" font-family="sans-serif" font-size="11" fill="#475569" text-anchor="end">€35k</text>
          <line x1="0" y1="160" x2="940" y2="160" stroke="rgba(255,255,255,0.05)" />
          <text x="-15" y="165" font-family="sans-serif" font-size="11" fill="#475569" text-anchor="end">€20k</text>
          <line x1="0" y1="240" x2="940" y2="240" stroke="rgba(255,255,255,0.05)" />
          <text x="-15" y="245" font-family="sans-serif" font-size="11" fill="#475569" text-anchor="end">€4.2k</text>
          <line x1="0" y1="320" x2="940" y2="320" stroke="rgba(255,255,255,0.1)" />
          <text x="-15" y="325" font-family="sans-serif" font-size="11" fill="#475569" text-anchor="end">€0</text>

          <!-- Fixed Cost Baseline -->
          <line x1="0" y1="240" x2="940" y2="240" stroke="#F43F5E" stroke-width="2.5" stroke-dasharray="6,6" />
          <rect x="730" y="218" width="200" height="22" rx="4" fill="#F43F5E" />
          <text x="830" y="233" font-family="sans-serif" font-size="11" font-weight="700" fill="#FFFFFF" text-anchor="middle">Survival Burn Floor: €4,200/mo</text>

          <!-- Area & Line (Emerald) -->
          <path d="M 0 320 Q 200 300, 360 240 T 940 30 L 940 320 Z" fill="url(#emeraldGrad)" opacity="0.15" />
          <path d="M 0 320 Q 200 300, 360 240 T 940 30" fill="none" stroke="#10B981" stroke-width="4" />

          <!-- Crossover Point -->
          <circle cx="360" cy="240" r="10" fill="#047857" stroke="#FFFFFF" stroke-width="3" />
          <g transform="translate(360, 160)">
            <rect x="-115" y="0" width="230" height="58" rx="8" fill="#064E3B" stroke="#10B981" stroke-width="1.5" />
            <text x="0" y="22" font-family="sans-serif" font-size="12" font-weight="800" fill="#6EE7B7" text-anchor="middle">
              BREAKEVEN CROSSOVER
            </text>
            <text x="0" y="44" font-family="sans-serif" font-size="14" font-weight="900" fill="#FFFFFF" text-anchor="middle">
              Month 4 • 34 Customers
            </text>
            <polygon points="-8,58 8,58 0,68" fill="#064E3B" />
          </g>

          <text x="60" y="348" font-family="sans-serif" font-size="12" fill="#64748B" text-anchor="middle">M1</text>
          <text x="180" y="348" font-family="sans-serif" font-size="12" fill="#64748B" text-anchor="middle">M3</text>
          <text x="360" y="348" font-family="sans-serif" font-size="12" font-weight="800" fill="#34D399" text-anchor="middle">M4 (Breakeven)</text>
          <text x="540" y="348" font-family="sans-serif" font-size="12" fill="#64748B" text-anchor="middle">M6</text>
          <text x="720" y="348" font-family="sans-serif" font-size="12" fill="#64748B" text-anchor="middle">M9</text>
          <text x="900" y="348" font-family="sans-serif" font-size="12" fill="#64748B" text-anchor="middle">M12 (€38.5k/mo)</text>
        </g>
      </g>
    </g>

    <!-- Bottom Strip -->
    <g transform="translate(160, 1030)">
      <text x="0" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#94A3B8">
        Sovereign Emerald &amp; Deep Slate Architecture • Verified for Irish LEO &amp; UK Grant Assessor Standards
      </text>
    </g>
  </svg>
  `;

  await renderSvgToPng(heroSvg, '01-hero-headline-1920x1080.png');

  // =========================================================================
  // IMAGE 2: MODULE C VALIDATION SURVEY & WAITLIST ENGINE (1920x1080)
  // Mom-Test bias-free survey, hosted public link, QR kit, real-time responses
  // =========================================================================
  const surveySvg = `
  <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="surveyBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#020617" />
        <stop offset="35%" stop-color="#0F172A" />
        <stop offset="100%" stop-color="#064E3B" />
      </linearGradient>
      <filter id="shadow2" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="25" stdDeviation="35" flood-color="#000000" flood-opacity="0.75" />
      </filter>
    </defs>
    <rect width="1920" height="1080" fill="url(#surveyBg)" />

    <!-- Top Badge -->
    <g transform="translate(960, 95)">
      <rect x="-250" y="-24" width="500" height="48" rx="24" fill="rgba(4, 120, 87, 0.20)" stroke="rgba(16, 185, 129, 0.45)" stroke-width="1.5" />
      <circle cx="-215" cy="0" r="6" fill="#10B981" />
      <text x="-195" y="6" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="700" fill="#6EE7B7" letter-spacing="1.5">
        MODULE C • CUSTOMER SURVEY &amp; WAITLIST ENGINE
      </text>
    </g>

    <text x="960" y="185" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="-1">
      AI &quot;Mom Test&quot; Bias-Free Survey &amp; Hosted Waitlist
    </text>
    <text x="960" y="235" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="500" fill="#94A3B8" text-anchor="middle">
      Hosted Public Page (/v/[slug]) • QR Outreach Kit • 1-on-1 Interview Logger • Sentiment Synthesizer
    </text>

    <!-- Main Card Window -->
    <g transform="translate(160, 280)" filter="url(#shadow2)">
      <rect width="1600" height="730" rx="24" fill="#0F172A" stroke="rgba(255, 255, 255, 0.15)" stroke-width="1.5" />
      <path d="M 0 24 C 0 10.745 10.745 0 24 0 L 1576 0 C 1589.255 0 1600 10.745 1600 24 L 1600 64 L 0 64 Z" fill="#1E293B" />
      <circle cx="32" cy="32" r="7" fill="#EF4444" /><circle cx="54" cy="32" r="7" fill="#F59E0B" /><circle cx="76" cy="32" r="7" fill="#10B981" />
      <text x="800" y="38" font-family="sans-serif" font-size="14" font-weight="600" fill="#94A3B8" text-anchor="middle">
        Hosted Public Survey Engine — startuppreflight.com/v/startup-sidekick-validation
      </text>

      <!-- Left Column: Survey Builder & Live Questions (Startup Sidekick Real Data) -->
      <g transform="translate(40, 95)">
        <rect width="730" height="585" rx="18" fill="#1E293B" stroke="rgba(255, 255, 255, 0.08)" />
        <text x="32" y="44" font-family="sans-serif" font-size="18" font-weight="800" fill="#FFFFFF">
          Active Mom-Test Question Builder
        </text>
        <text x="32" y="70" font-family="sans-serif" font-size="13" font-weight="500" fill="#94A3B8">
          Formulated to discover past behavior and real budget, never hypothetical compliments.
        </text>

        <!-- Question 1 Card -->
        <g transform="translate(32, 100)">
          <rect width="665" height="125" rx="12" fill="#0F172A" stroke="rgba(255,255,255,0.06)" />
          <text x="20" y="32" font-family="sans-serif" font-size="11" font-weight="700" fill="#10B981">QUESTION 1 • PAST BEHAVIOR CHECK</text>
          <text x="20" y="60" font-family="sans-serif" font-size="14" font-weight="700" fill="#FFFFFF">
            &quot;When was the last time you attempted to compile a 3-year cashflow or apply for a grant?&quot;
          </text>
          <text x="20" y="90" font-family="sans-serif" font-size="12" fill="#94A3B8">
            Filter: Multiple choice &#x2022; Prevents polite compliments (3–6 mos ago, hired external consultant)
          </text>
        </g>

        <!-- Question 2 Card -->
        <g transform="translate(32, 245)">
          <rect width="665" height="125" rx="12" fill="#0F172A" stroke="rgba(255,255,255,0.06)" />
          <text x="20" y="32" font-family="sans-serif" font-size="11" font-weight="700" fill="#10B981">QUESTION 2 • ACTIVE SPEND INQUIRY</text>
          <text x="20" y="60" font-family="sans-serif" font-size="14" font-weight="700" fill="#FFFFFF">
            &quot;How much did your business spend on startup advisors, accountants, or templates last year?&quot;
          </text>
          <text x="20" y="90" font-family="sans-serif" font-size="12" fill="#94A3B8">
            Discovers real budget allocation (€2,000–€5,000 paid) before pricing is finalized in Mod H
          </text>
        </g>

        <!-- Distribution Kit Strip -->
        <g transform="translate(32, 395)">
          <rect width="665" height="150" rx="12" fill="#020617" stroke="rgba(16,185,129,0.3)" />
          <text x="24" y="36" font-family="sans-serif" font-size="15" font-weight="800" fill="#34D399">
            Outreach Distribution Kit &amp; QR Code
          </text>
          <text x="24" y="64" font-family="sans-serif" font-size="13" fill="#CBD5E1">
            Download print-ready flyer QR codes, cold LinkedIn DM scripts, and founder survey templates.
          </text>
          <rect x="24" y="90" width="220" height="38" rx="8" fill="#047857" />
          <text x="134" y="114" font-family="sans-serif" font-size="12" font-weight="700" fill="#FFFFFF" text-anchor="middle">
            Export QR Distribution Kit
          </text>
        </g>
      </g>

      <!-- Right Column: Live Responses & Sentiment Synthesizer -->
      <g transform="translate(810, 95)">
        <rect width="750" height="585" rx="18" fill="#1E293B" stroke="rgba(255, 255, 255, 0.08)" />

        <text x="32" y="44" font-family="sans-serif" font-size="18" font-weight="800" fill="#FFFFFF">
          AI Sentiment Synthesizer &amp; Real-Time Proof
        </text>
        <text x="32" y="70" font-family="sans-serif" font-size="13" font-weight="500" fill="#94A3B8">
          142 Verified Responses Collected • Auto-feeds into Module L Grant Appendices
        </text>

        <!-- Stats Bar -->
        <g transform="translate(32, 95)">
          <rect width="215" height="90" rx="12" fill="#0F172A" />
          <text x="20" y="34" font-family="sans-serif" font-size="12" font-weight="700" fill="#94A3B8">WAITLIST LEADS</text>
          <text x="20" y="72" font-family="sans-serif" font-size="34" font-weight="900" fill="#34D399">89 Founders</text>

          <rect x="235" y="0" width="215" height="90" rx="12" fill="#0F172A" />
          <text x="255" y="34" font-family="sans-serif" font-size="12" font-weight="700" fill="#94A3B8">ACTIVE PAIN RATE</text>
          <text x="255" y="72" font-family="sans-serif" font-size="34" font-weight="900" fill="#10B981">78.4%</text>

          <rect x="470" y="0" width="215" height="90" rx="12" fill="#0F172A" />
          <text x="490" y="34" font-family="sans-serif" font-size="12" font-weight="700" fill="#94A3B8">WILLING TO PAY</text>
          <text x="490" y="72" font-family="sans-serif" font-size="34" font-weight="900" fill="#FBBF24">€129–€199</text>
        </g>

        <!-- AI Synthesis Box -->
        <g transform="translate(32, 210)">
          <rect width="685" height="335" rx="14" fill="#020617" stroke="rgba(4,120,87,0.4)" />
          <text x="24" y="36" font-family="sans-serif" font-size="14" font-weight="800" fill="#6EE7B7">
            AI PATTERN EXTRACTION (MOM-TEST COMPLIANT)
          </text>
          <text x="24" y="68" font-family="sans-serif" font-size="13" font-weight="600" fill="#FFFFFF">
            &#x2022; Primary Frustration: 81% of founders report spreadsheets breaking with circular formulas during cashflows.
          </text>
          <text x="24" y="105" font-family="sans-serif" font-size="13" font-weight="600" fill="#FFFFFF">
            &#x2022; Commercial Willingness: 72% currently pay external consultants €2,500+ for grant application packaging.
          </text>
          <text x="24" y="142" font-family="sans-serif" font-size="13" font-weight="600" fill="#FFFFFF">
            &#x2022; Blind Spot Caught: Don&apos;t pitch &apos;generic AI generator&apos; — founders want verified LEO/Innovate UK compliance.
          </text>

          <rect x="24" y="180" width="635" height="120" rx="10" fill="#0F172A" stroke="rgba(255,255,255,0.08)" />
          <text x="40" y="210" font-family="sans-serif" font-size="12" font-weight="700" fill="#10B981">
            VERBATIM FOUNDER QUOTE PULLED INTO BUSINESS PLAN:
          </text>
          <text x="40" y="240" font-family="sans-serif" font-size="13" font-style="italic" fill="#E2E8F0">
            &quot;If you can automate the LEO Feasibility cashflow without broken Excel formulas, I would pay €150 upfront before filing.&quot;
          </text>
          <text x="40" y="275" font-family="sans-serif" font-size="12" fill="#94A3B8">
            — Mark D., Early-Stage B2B Founder, Dublin (Interview #12)
          </text>
        </g>
      </g>
    </g>
  </svg>
  `;

  await renderSvgToPng(surveySvg, '02-customer-survey-waitlist-1920x1080.png');

  // =========================================================================
  // IMAGE 3: MODULE F CO-FOUNDER ALIGNMENT & 12 AWKWARD QUESTIONS (1920x1080)
  // Sovereign Emerald theme with Thomas Walsh profile & blind-reveal answers
  // =========================================================================
  const cofounderSvg = `
  <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="cfBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#020617" />
        <stop offset="35%" stop-color="#0F172A" />
        <stop offset="100%" stop-color="#064E3B" />
      </linearGradient>
      <filter id="shadow3" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="25" stdDeviation="35" flood-color="#000000" flood-opacity="0.75" />
      </filter>
    </defs>
    <rect width="1920" height="1080" fill="url(#cfBg)" />

    <g transform="translate(960, 95)">
      <rect x="-260" y="-24" width="520" height="48" rx="24" fill="rgba(4, 120, 87, 0.20)" stroke="rgba(16, 185, 129, 0.45)" stroke-width="1.5" />
      <circle cx="-225" cy="0" r="6" fill="#10B981" />
      <text x="-205" y="6" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="700" fill="#6EE7B7" letter-spacing="1.5">
        MODULE F • CO-FOUNDER ALIGNMENT &amp; TEAM
      </text>
    </g>

    <text x="960" y="185" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="-1">
      Blind-Reveal 12 Awkward Questions &amp; Alignment Heatmap
    </text>
    <text x="960" y="235" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="500" fill="#94A3B8" text-anchor="middle">
      Prevent Co-Founder Breakups • Side-by-Side Reality Check • Dynamic Equity Split Calculator
    </text>

    <!-- UI Mockup Window -->
    <g transform="translate(160, 280)" filter="url(#shadow3)">
      <rect width="1600" height="730" rx="24" fill="#0F172A" stroke="rgba(255, 255, 255, 0.15)" stroke-width="1.5" />
      <path d="M 0 24 C 0 10.745 10.745 0 24 0 L 1576 0 C 1589.255 0 1600 10.745 1600 24 L 1600 64 L 0 64 Z" fill="#1E293B" />
      <circle cx="32" cy="32" r="7" fill="#EF4444" /><circle cx="54" cy="32" r="7" fill="#F59E0B" /><circle cx="76" cy="32" r="7" fill="#10B981" />
      <text x="800" y="38" font-family="sans-serif" font-size="14" font-weight="600" fill="#94A3B8" text-anchor="middle">
        Co-Founder Blind-Reveal Survey — Thomas Walsh (CEO) vs. Lead Technical Architect (CTO)
      </text>

      <!-- Left Column: Alignment Heatmap -->
      <g transform="translate(40, 95)">
        <rect width="900" height="585" rx="18" fill="#1E293B" stroke="rgba(255, 255, 255, 0.08)" />
        <text x="32" y="44" font-family="sans-serif" font-size="18" font-weight="800" fill="#FFFFFF">
          Side-by-Side Co-Founder Alignment Heatmap
        </text>
        <text x="32" y="70" font-family="sans-serif" font-size="13" font-weight="500" fill="#94A3B8">
          Answers are hidden until both co-founders submit independently to guarantee 100% honesty.
        </text>

        <!-- Question Row 1 (Aligned) -->
        <g transform="translate(32, 100)">
          <rect width="835" height="100" rx="12" fill="#0F172A" stroke="rgba(16,185,129,0.3)" />
          <text x="24" y="32" font-family="sans-serif" font-size="14" font-weight="800" fill="#FFFFFF">
            1. What is your minimum personal survival runway without salary?
          </text>
          <text x="24" y="60" font-family="sans-serif" font-size="13" fill="#6EE7B7">
            &#x2022; Thomas Walsh (CEO): 6 Months (€3,500/mo personal survival burn)
          </text>
          <text x="24" y="82" font-family="sans-serif" font-size="13" fill="#6EE7B7">
            &#x2022; Technical Architect (CTO): 6 Months (€3,800/mo personal survival burn)
          </text>
          <rect x="680" y="35" width="130" height="30" rx="6" fill="rgba(16,185,129,0.2)" />
          <text x="745" y="55" font-family="sans-serif" font-size="12" font-weight="800" fill="#34D399" text-anchor="middle">
            ALIGNED (100%)
          </text>
        </g>

        <!-- Question Row 2 (FATAL MISALIGNMENT CAUGHT) -->
        <g transform="translate(32, 220)">
          <rect width="835" height="100" rx="12" fill="#0F172A" stroke="rgba(239,68,68,0.3)" />
          <text x="24" y="32" font-family="sans-serif" font-size="14" font-weight="800" fill="#FFFFFF">
            2. What is our stance on an early €5M buyout offer in Year 2?
          </text>
          <text x="24" y="60" font-family="sans-serif" font-size="13" fill="#FCA5A5">
            &#x2022; Thomas Walsh (CEO): &quot;Reject early buyouts; scale independently to €10M+ ARR.&quot;
          </text>
          <text x="24" y="82" font-family="sans-serif" font-size="13" fill="#FCA5A5">
            &#x2022; Technical Architect: &quot;Sell immediately; take life-changing secondary liquidity.&quot;
          </text>
          <rect x="670" y="35" width="140" height="30" rx="6" fill="rgba(239,68,68,0.25)" />
          <text x="740" y="55" font-family="sans-serif" font-size="12" font-weight="800" fill="#F87171" text-anchor="middle">
            BLIND SPOT DETECTED
          </text>
        </g>

        <!-- Question Row 3 -->
        <g transform="translate(32, 340)">
          <rect width="835" height="100" rx="12" fill="#0F172A" stroke="rgba(16,185,129,0.3)" />
          <text x="24" y="32" font-family="sans-serif" font-size="14" font-weight="800" fill="#FFFFFF">
            3. How many weekly hours can you realistically commit for the first 12 months?
          </text>
          <text x="24" y="60" font-family="sans-serif" font-size="13" fill="#6EE7B7">
            &#x2022; Thomas Walsh: Full-time (50+ hrs/wk, dedicated founder promoter)
          </text>
          <text x="24" y="82" font-family="sans-serif" font-size="13" fill="#6EE7B7">
            &#x2022; Technical Architect: Full-time (50+ hrs/wk, dedicated lead builder)
          </text>
          <rect x="680" y="35" width="130" height="30" rx="6" fill="rgba(16,185,129,0.2)" />
          <text x="745" y="55" font-family="sans-serif" font-size="12" font-weight="800" fill="#34D399" text-anchor="middle">
            ALIGNED (100%)
          </text>
        </g>

        <!-- Bottom Guidance Strip -->
        <g transform="translate(32, 460)">
          <rect width="835" height="95" rx="12" fill="#020617" stroke="rgba(16,185,129,0.3)" />
          <text x="24" y="34" font-family="sans-serif" font-size="14" font-weight="800" fill="#6EE7B7">
            AI Mediation Advice Generated for Next Co-Founder Meeting:
          </text>
          <text x="24" y="64" font-family="sans-serif" font-size="13" fill="#CBD5E1">
            &quot;Draft a written Shareholders Agreement clause establishing a formal supermajority voting threshold for acquisitions below €15M before allocating final equity.&quot;
          </text>
        </g>
      </g>

      <!-- Right Column: Equity Split Calculator -->
      <g transform="translate(980, 95)">
        <rect width="580" height="585" rx="18" fill="#1E293B" stroke="rgba(255, 255, 255, 0.08)" />
        <text x="32" y="44" font-family="sans-serif" font-size="18" font-weight="800" fill="#FFFFFF">
          Objective Equity Split Calculator
        </text>
        <text x="32" y="70" font-family="sans-serif" font-size="13" font-weight="500" fill="#94A3B8">
          Weighted across Capital Invested, Domain IP, Technical Execution &amp; Risk.
        </text>

        <!-- Equity Chart Representation -->
        <g transform="translate(32, 105)">
          <rect width="516" height="180" rx="16" fill="#0A0F1D" stroke="rgba(4,120,87,0.3)" />
          <text x="32" y="44" font-family="sans-serif" font-size="13" font-weight="700" fill="#94A3B8">RECOMMENDED 4-YEAR VESTING SPLIT</text>
          <text x="32" y="100" font-family="sans-serif" font-size="44" font-weight="900" fill="#34D399">60% / 40%</text>
          <text x="32" y="140" font-family="sans-serif" font-size="13" fill="#94A3B8">
            Includes 1-Year Cliff &amp; Double-Trigger Acceleration
          </text>
        </g>

        <!-- Factors List -->
        <g transform="translate(32, 310)">
          <text x="0" y="24" font-family="sans-serif" font-size="14" font-weight="800" fill="#FFFFFF">Contribution Weights Breakdown:</text>
          <g transform="translate(0, 45)">
            <text x="0" y="16" font-family="sans-serif" font-size="13" fill="#CBD5E1">Cash Invested (€15,000 vs. €5,000)</text>
            <text x="516" y="16" font-family="sans-serif" font-size="13" font-weight="700" fill="#FFFFFF" text-anchor="end">70 / 30</text>
            <rect x="0" y="25" width="516" height="6" rx="3" fill="#334155" />
            <rect x="0" y="25" width="361" height="6" rx="3" fill="#047857" />
          </g>

          <g transform="translate(0, 95)">
            <text x="0" y="16" font-family="sans-serif" font-size="13" fill="#CBD5E1">Prior 15-Year Domain IP &amp; Customer Network</text>
            <text x="516" y="16" font-family="sans-serif" font-size="13" font-weight="700" fill="#FFFFFF" text-anchor="end">75 / 25</text>
            <rect x="0" y="25" width="516" height="6" rx="3" fill="#334155" />
            <rect x="0" y="25" width="387" height="6" rx="3" fill="#059669" />
          </g>

          <g transform="translate(0, 145)">
            <text x="0" y="16" font-family="sans-serif" font-size="13" fill="#CBD5E1">Full-Time Engineering &amp; System Architecture</text>
            <text x="516" y="16" font-family="sans-serif" font-size="13" font-weight="700" fill="#FFFFFF" text-anchor="end">40 / 60</text>
            <rect x="0" y="25" width="516" height="6" rx="3" fill="#334155" />
            <rect x="0" y="25" width="206" height="6" rx="3" fill="#10B981" />
          </g>
        </g>
      </g>
    </g>
  </svg>
  `;

  await renderSvgToPng(cofounderSvg, '03-cofounder-alignment-1920x1080.png');

  // =========================================================================
  // IMAGE 4: MODULE L BUSINESS PLAN COMPILER & AUDIT (1920x1080)
  // Cross-module contradiction check, live audit score, executive brief
  // =========================================================================
  const compilerSvg = `
  <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="compBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#020617" />
        <stop offset="40%" stop-color="#0F172A" />
        <stop offset="100%" stop-color="#064E3B" />
      </linearGradient>
      <filter id="shadow4" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="25" stdDeviation="35" flood-color="#000000" flood-opacity="0.75" />
      </filter>
    </defs>
    <rect width="1920" height="1080" fill="url(#compBg)" />

    <g transform="translate(960, 95)">
      <rect x="-260" y="-24" width="520" height="48" rx="24" fill="rgba(4, 120, 87, 0.20)" stroke="rgba(16, 185, 129, 0.45)" stroke-width="1.5" />
      <circle cx="-225" cy="0" r="6" fill="#10B981" />
      <text x="-205" y="6" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="700" fill="#6EE7B7" letter-spacing="1.5">
        MODULE L • BUSINESS PLAN &amp; COMPILER
      </text>
    </g>

    <text x="960" y="185" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="-1">
      Living Business Plan &amp; Pre-Flight AI Contradiction Audit
    </text>
    <text x="960" y="235" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="500" fill="#94A3B8" text-anchor="middle">
      Boardroom &amp; Bank Ready • Cross-Checks Narrative vs. Projections • 1-Click PDF Export
    </text>

    <!-- UI Mockup Window -->
    <g transform="translate(160, 280)" filter="url(#shadow4)">
      <rect width="1600" height="730" rx="24" fill="#0F172A" stroke="rgba(255, 255, 255, 0.15)" stroke-width="1.5" />
      <path d="M 0 24 C 0 10.745 10.745 0 24 0 L 1576 0 C 1589.255 0 1600 10.745 1600 24 L 1600 64 L 0 64 Z" fill="#1E293B" />
      <circle cx="32" cy="32" r="7" fill="#EF4444" /><circle cx="54" cy="32" r="7" fill="#F59E0B" /><circle cx="76" cy="32" r="7" fill="#10B981" />
      <text x="800" y="38" font-family="sans-serif" font-size="14" font-weight="600" fill="#94A3B8" text-anchor="middle">
        Official Compiler Dossier — Startup Sidekick Ltd. • Modes: IE LEO Feasibility &amp; UK Innovate UK Smart
      </text>

      <!-- Left Column: Pre-flight Audit Scan (Startup Sidekick Real Data) -->
      <g transform="translate(40, 95)">
        <rect width="780" height="585" rx="18" fill="#1E293B" stroke="rgba(255, 255, 255, 0.08)" />
        <text x="32" y="44" font-family="sans-serif" font-size="18" font-weight="800" fill="#FFFFFF">
          Pre-Flight Contradiction Audit Results
        </text>
        <text x="32" y="70" font-family="sans-serif" font-size="13" font-weight="500" fill="#94A3B8">
          The AI engine stress-tests every module to ensure figures align perfectly before assessors review.
        </text>

        <!-- Audit Score Banner -->
        <g transform="translate(32, 95)">
          <rect width="715" height="85" rx="12" fill="#0F172A" stroke="rgba(16,185,129,0.3)" />
          <text x="24" y="35" font-family="sans-serif" font-size="12" font-weight="700" fill="#94A3B8">PRE-FLIGHT READINESS SCORE</text>
          <text x="24" y="68" font-family="sans-serif" font-size="30" font-weight="900" fill="#10B981">
            94 / 100 • Ready for Grant Assessor &amp; Lender Review
          </text>
          <rect x="560" y="24" width="130" height="36" rx="8" fill="#047857" />
          <text x="625" y="47" font-family="sans-serif" font-size="13" font-weight="800" fill="#FFFFFF" text-anchor="middle">
            AUDIT PASSED
          </text>
        </g>

        <!-- Contradiction Check 1 (Passed) -->
        <g transform="translate(32, 200)">
          <rect width="715" height="95" rx="12" fill="#0F172A" />
          <circle cx="36" cy="48" r="14" fill="rgba(16,185,129,0.2)" />
          <text x="36" y="53" font-family="sans-serif" font-size="14" font-weight="800" fill="#34D399" text-anchor="middle">&#x2713;</text>
          <text x="68" y="38" font-family="sans-serif" font-size="14" font-weight="800" fill="#FFFFFF">
            Match Funding &amp; Bank Balance Verification
          </text>
          <text x="68" y="66" font-family="sans-serif" font-size="12" fill="#94A3B8">
            Verified €15,000 founder savings confirmed in Revolut Business Ireland IBAN to meet 50% LEO grant match.
          </text>
        </g>

        <!-- Contradiction Check 2 (Resolved) -->
        <g transform="translate(32, 315)">
          <rect width="715" height="110" rx="12" fill="#0F172A" />
          <circle cx="36" cy="55" r="14" fill="rgba(16,185,129,0.2)" />
          <text x="36" y="60" font-family="sans-serif" font-size="14" font-weight="800" fill="#34D399" text-anchor="middle">&#x2713;</text>
          <text x="68" y="38" font-family="sans-serif" font-size="14" font-weight="800" fill="#FFFFFF">
            Feasibility Expenditure vs. Cashflow Trough
          </text>
          <text x="68" y="66" font-family="sans-serif" font-size="12" fill="#94A3B8">
            Feasibility Own Labour (€9,500) and Subcontractors (€4,500) mathematically reconciled with Module J cashflow.
          </text>
          <text x="68" y="90" font-family="sans-serif" font-size="12" font-weight="700" fill="#34D399">
            ✓ 100% Mathematically Reconciled (Zero Hallucinations)
          </text>
        </g>

        <!-- Export Buttons -->
        <g transform="translate(32, 450)">
          <rect width="715" height="90" rx="12" fill="#020617" stroke="rgba(4,120,87,0.4)" />
          <text x="24" y="38" font-family="sans-serif" font-size="15" font-weight="800" fill="#FFFFFF">
            Export Verified Business Plan Dossier
          </text>
          <text x="24" y="65" font-family="sans-serif" font-size="12" fill="#6EE7B7">
            Exports 35-page structured PDF complete with Appendix A (Surveys), Appendix B (Cashflow), and Appendix C (Quotes).
          </text>
        </g>
      </g>

      <!-- Right Column: Document Preview -->
      <g transform="translate(860, 95)">
        <rect width="700" height="585" rx="18" fill="#FFFFFF" />

        <!-- Mock PDF Document Paper Look -->
        <g transform="translate(45, 40)">
          <rect width="210" height="24" rx="4" fill="#D1FAE5" />
          <text x="105" y="16" font-family="sans-serif" font-size="11" font-weight="700" fill="#065F46" text-anchor="middle">
            OFFICIAL LEO GRANT DOSSIER
          </text>

          <text x="0" y="60" font-family="sans-serif" font-size="24" font-weight="900" fill="#0F172A">
            Startup Sidekick Ltd.
          </text>
          <text x="0" y="85" font-family="sans-serif" font-size="13" font-weight="600" fill="#64748B">
            CRO: 748291 • VAT: IE3984021TH • Lead Promoter: Thomas Walsh
          </text>
          <line x1="0" y1="105" x2="610" y2="105" stroke="#E2E8F0" stroke-width="1.5" />

          <!-- Table of contents / Preview -->
          <g transform="translate(0, 125)">
            <text x="0" y="20" font-family="sans-serif" font-size="13" font-weight="800" fill="#1E293B">1. Executive Summary &amp; Customer Problem (Mod A)</text>
            <text x="0" y="55" font-family="sans-serif" font-size="13" font-weight="800" fill="#1E293B">2. Target Market TAM/SAM/SOM Sizing (Mod B)</text>
            <text x="0" y="90" font-family="sans-serif" font-size="13" font-weight="800" fill="#1E293B">3. Primary Customer Validation &amp; Waitlist Proof (Mod C)</text>
            <text x="0" y="125" font-family="sans-serif" font-size="13" font-weight="800" fill="#1E293B">4. Technical Architecture &amp; V1 Work Packages (Mod D)</text>
            <text x="0" y="160" font-family="sans-serif" font-size="13" font-weight="800" fill="#1E293B">5. Operations Blueprint &amp; Risk Register (Mod E &amp; G)</text>
            <text x="0" y="195" font-family="sans-serif" font-size="13" font-weight="800" fill="#1E293B">6. Promoter Profiles &amp; Headcount Plan (Mod F)</text>
            <text x="0" y="230" font-family="sans-serif" font-size="13" font-weight="800" fill="#1E293B">7. 3-Year Pocket Profit &amp; Breakeven Model (Mod H &amp; J)</text>
          </g>

          <rect x="0" y="420" width="610" height="70" rx="8" fill="#F8FAFC" stroke="#E2E8F0" />
          <text x="24" y="450" font-family="sans-serif" font-size="12" font-weight="700" fill="#0F172A">
            Institutional Underwriting Assurance Seal:
          </text>
          <text x="24" y="472" font-family="sans-serif" font-size="12" fill="#64748B">
            Zero mathematical hallucinations. Every figure backed by verified live workspace validation data.
          </text>
        </g>
      </g>
    </g>
  </svg>
  `;

  await renderSvgToPng(compilerSvg, '04-business-plan-compiler-1920x1080.png');

  // =========================================================================
  // IMAGE 5: 12-MODULE SUITE OVERVIEW (1920x1080)
  // Grid showing all 12 modules in Sovereign Emerald & Deep Slate styling
  // =========================================================================
  const modulesGridSvg = `
  <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gridBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#020617" />
        <stop offset="50%" stop-color="#0F172A" />
        <stop offset="100%" stop-color="#064E3B" />
      </linearGradient>
    </defs>
    <rect width="1920" height="1080" fill="url(#gridBg)" />

    <g transform="translate(960, 85)">
      <rect x="-260" y="-22" width="520" height="44" rx="22" fill="rgba(4, 120, 87, 0.20)" stroke="rgba(16, 185, 129, 0.45)" stroke-width="1.5" />
      <text x="0" y="6" font-family="sans-serif" font-size="15" font-weight="700" fill="#6EE7B7" text-anchor="middle" letter-spacing="1.5">
        SOVEREIGN EMERALD &amp; DEEP SLATE • 12-MODULE SUITE
      </text>
    </g>

    <text x="960" y="165" font-family="sans-serif" font-size="46" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="-1">
      The Complete 12-Module Founder Operating System (A–L)
    </text>
    <text x="960" y="205" font-family="sans-serif" font-size="18" font-weight="500" fill="#94A3B8" text-anchor="middle">
      From raw brain dump to customer validation surveys, co-founder alignment, and 3-year Pocket Profit breakeven.
    </text>

    <!-- 12 Cards Grid (4 columns x 3 rows) -->
    <g transform="translate(160, 245)">
      ${[
        { code: 'Mod A', title: 'Ideation & Concept Canvas', tag: 'Ideation', desc: 'Brain dump, 1-page canvas, domain check & Founder-Idea Fit score.' },
        { code: 'Mod B', title: 'Market & Competitor Scout', tag: 'Market Sizing', desc: 'Bottom-up TAM/SAM/SOM model & competitive wedge matrix.' },
        { code: 'Mod C', title: 'Customer Surveys & Waitlist', tag: 'Validation Engine', desc: 'Hosted Mom-Test surveys (/v/[slug]), QR kit & AI sentiment.' },
        { code: 'Mod D', title: 'Product Build & Scope Filter', tag: 'Product Architecture', desc: 'Own vs. Rent channels, Build-vs-Buy & V1 scope filter.' },
        { code: 'Mod E', title: 'Operations & Risk Register', tag: 'Operations Blueprint', desc: 'Day in the Life of an Order, supplier quotes & 4-category risks.' },
        { code: 'Mod F', title: 'Co-Founder Fit & Alignment', tag: 'Team & Equity', desc: '12 Awkward Questions survey, side-by-side heatmap & equity splits.' },
        { code: 'Mod G', title: 'Launchpad Setup Hub', tag: 'Entity & Banking', desc: '0–100% Operations Readiness Score across incorporation & banking.' },
        { code: 'Mod H', title: 'Pricing & Pocket Profit', tag: 'Unit Economics', desc: 'Visual 3-year breakeven graph & non-destructive What-If sandbox.' },
        { code: 'Mod I', title: 'Go-To-Market & First 10', tag: 'Customer Acquisition', desc: '3-second hook, 4Ps strategy & reverse marketing budget.' },
        { code: 'Mod J', title: '36-Month Finance & Runway', tag: 'Financial Model', desc: 'No-spreadsheet 3-year P&L, localized taxes & cashflow trough.' },
        { code: 'Mod K', title: 'Capital Stack & Grants', tag: 'Funding Strategy', desc: 'Automated IE LEO & UK Innovate UK grant & loan readiness matching.' },
        { code: 'Mod L', title: 'Living Business Plan', tag: 'Compiler Vault', desc: 'Investor-ready business plan & Pre-Flight contradiction audit.' },
      ].map((item, idx) => {
        const col = idx % 4;
        const row = Math.floor(idx / 4);
        const x = col * 410;
        const y = row * 250;
        return `
        <g transform="translate(${x}, ${y})">
          <rect width="380" height="225" rx="16" fill="#1E293B" stroke="rgba(255, 255, 255, 0.08)" />
          <rect x="20" y="20" width="70" height="26" rx="6" fill="#047857" />
          <text x="55" y="38" font-family="sans-serif" font-size="12" font-weight="800" fill="#FFFFFF" text-anchor="middle">${item.code}</text>

          <rect x="100" y="20" width="160" height="26" rx="6" fill="rgba(255, 255, 255, 0.06)" />
          <text x="180" y="38" font-family="sans-serif" font-size="11" font-weight="600" fill="#94A3B8" text-anchor="middle">${xmlEscape(item.tag)}</text>

          <text x="20" y="85" font-family="sans-serif" font-size="17" font-weight="800" fill="#FFFFFF">${xmlEscape(item.title)}</text>
          <text x="20" y="125" font-family="sans-serif" font-size="13" fill="#94A3B8">${xmlEscape(item.desc)}</text>

          <text x="20" y="195" font-family="sans-serif" font-size="11" font-weight="700" fill="#34D399">✓ Standardized Founder Readiness Standard</text>
        </g>
        `;
      }).join('')}
    </g>
  </svg>
  `;

  await renderSvgToPng(modulesGridSvg, '05-all-12-modules-suite-1920x1080.png');

  // =========================================================================
  // IMAGE 6: COHORT DIRECTOR COMMAND CENTER & BATCH HEATMAP (1920x1080)
  // Recreating the exact cohorts page mockup with high-res crisp fidelity
  // =========================================================================
  const cohortCommandSvg = `
  <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="cohortBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#020617" />
        <stop offset="45%" stop-color="#0F172A" />
        <stop offset="100%" stop-color="#064E3B" />
      </linearGradient>
      <filter id="shadow6" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="25" stdDeviation="35" flood-color="#000000" flood-opacity="0.80" />
      </filter>
    </defs>
    <rect width="1920" height="1080" fill="url(#cohortBg)" />

    <!-- Top Badge -->
    <g transform="translate(960, 85)">
      <rect x="-260" y="-22" width="520" height="44" rx="22" fill="rgba(4, 120, 87, 0.20)" stroke="rgba(16, 185, 129, 0.45)" stroke-width="1.5" />
      <circle cx="-225" cy="0" r="6" fill="#10B981" />
      <text x="-205" y="6" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="700" fill="#6EE7B7" letter-spacing="1.5">
        ECOSYSTEM &amp; ENTERPRISE INFRASTRUCTURE • COHORTS ENGINE
      </text>
    </g>

    <text x="960" y="165" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="50" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="-1">
      Director Command Center: Real-Time Batch Heatmap
    </text>
    <text x="960" y="205" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="19" font-weight="500" fill="#94A3B8" text-anchor="middle">
      Track completion milestones, detect blind spots before Demo Day, and pre-screen grant compliance across all startups.
    </text>

    <!-- UI Mockup Window -->
    <g transform="translate(160, 245)" filter="url(#shadow6)">
      <rect width="1600" height="775" rx="24" fill="#0F172A" stroke="rgba(255, 255, 255, 0.15)" stroke-width="1.5" />

      <!-- Window Chrome Header -->
      <path d="M 0 24 C 0 10.745 10.745 0 24 0 L 1576 0 C 1589.255 0 1600 10.745 1600 24 L 1600 64 L 0 64 Z" fill="#1E293B" />
      <circle cx="32" cy="32" r="7" fill="#EF4444" /><circle cx="54" cy="32" r="7" fill="#F59E0B" /><circle cx="76" cy="32" r="7" fill="#10B981" />
      <text x="800" y="38" font-family="sans-serif" font-size="14" font-weight="600" fill="#94A3B8" text-anchor="middle">
        Director Command Center — NovaUCD &amp; Tangent Venture Batch 2027 • 24 Active Startups
      </text>
      <circle cx="1520" cy="32" r="4" fill="#10B981" />
      <text x="1532" y="36" font-family="sans-serif" font-size="12" font-weight="600" fill="#6EE7B7">Synced Live</text>

      <!-- Top 4 Metric Cards -->
      <g transform="translate(32, 85)">
        <!-- Metric 1: Average Batch Progress -->
        <g transform="translate(0, 0)">
          <rect width="365" height="115" rx="14" fill="#1E293B" stroke="rgba(255, 255, 255, 0.08)" />
          <text x="20" y="30" font-family="sans-serif" font-size="11" font-weight="700" fill="#94A3B8" letter-spacing="1">AVERAGE BATCH PROGRESS</text>
          <text x="20" y="70" font-family="sans-serif" font-size="34" font-weight="900" fill="#FFFFFF">78%</text>
          <text x="100" y="65" font-family="sans-serif" font-size="12" font-weight="700" fill="#34D399">+14% this week</text>
          <rect x="20" y="85" width="325" height="8" rx="4" fill="#334155" />
          <rect x="20" y="85" width="253" height="8" rx="4" fill="#10B981" />
        </g>

        <!-- Metric 2: Grant Pre-Flight Ready -->
        <g transform="translate(390, 0)">
          <rect width="365" height="115" rx="14" fill="#1E293B" stroke="rgba(255, 255, 255, 0.08)" />
          <text x="20" y="30" font-family="sans-serif" font-size="11" font-weight="700" fill="#94A3B8" letter-spacing="1">GRANT PRE-FLIGHT READY</text>
          <text x="20" y="70" font-family="sans-serif" font-size="34" font-weight="900" fill="#FFFFFF">18 / 24</text>
          <text x="145" y="65" font-family="sans-serif" font-size="12" font-weight="600" fill="#94A3B8">LEO &amp; Innovate UK</text>
          <text x="20" y="95" font-family="sans-serif" font-size="12" font-weight="700" fill="#34D399">✓ Zero 3-quote non-compliances</text>
        </g>

        <!-- Metric 3: Customer Signals -->
        <g transform="translate(780, 0)">
          <rect width="365" height="115" rx="14" fill="#1E293B" stroke="rgba(255, 255, 255, 0.08)" />
          <text x="20" y="30" font-family="sans-serif" font-size="11" font-weight="700" fill="#94A3B8" letter-spacing="1">CUSTOMER SIGNALS</text>
          <text x="20" y="70" font-family="sans-serif" font-size="34" font-weight="900" fill="#FFFFFF">1,840</text>
          <text x="135" y="65" font-family="sans-serif" font-size="12" font-weight="600" fill="#94A3B8">responses</text>
          <text x="20" y="95" font-family="sans-serif" font-size="12" font-weight="600" fill="#6EE7B7">Across 24 live /v/[slug] surveys</text>
        </g>

        <!-- Metric 4: Co-Founder Alignment Rate -->
        <g transform="translate(1170, 0)">
          <rect width="365" height="115" rx="14" fill="#1E293B" stroke="rgba(255, 255, 255, 0.08)" />
          <text x="20" y="30" font-family="sans-serif" font-size="11" font-weight="700" fill="#94A3B8" letter-spacing="1">CO-FOUNDER ALIGNMENT</text>
          <text x="20" y="70" font-family="sans-serif" font-size="34" font-weight="900" fill="#34D399">92%</text>
          <text x="105" y="65" font-family="sans-serif" font-size="12" font-weight="600" fill="#94A3B8">Rate</text>
          <text x="20" y="95" font-family="sans-serif" font-size="12" font-weight="700" fill="#FBBF24">1 critical buyout blind spot flagged</text>
        </g>
      </g>

      <!-- Cohort Startup Heatmap Cards (4 Showcase Cards) -->
      <g transform="translate(32, 225)">
        <!-- Card 1: BioPulse Diagnostics -->
        <g transform="translate(0, 0)">
          <rect width="750" height="240" rx="16" fill="#1E293B" stroke="rgba(16,185,129,0.3)" />
          <rect x="20" y="20" width="46" height="46" rx="10" fill="#047857" />
          <text x="43" y="50" font-family="sans-serif" font-size="18" font-weight="900" fill="#FFFFFF" text-anchor="middle">BP</text>

          <text x="80" y="38" font-family="sans-serif" font-size="16" font-weight="800" fill="#FFFFFF">BioPulse Diagnostics</text>
          <text x="80" y="58" font-family="sans-serif" font-size="12" fill="#94A3B8">MedTech / Diagnostics • Dr. Liam Murphy &amp; Elena Rostova</text>

          <rect x="560" y="20" width="170" height="28" rx="6" fill="#047857" />
          <text x="645" y="39" font-family="sans-serif" font-size="11" font-weight="800" fill="#FFFFFF" text-anchor="middle">GRANT READY (EI PSSF)</text>

          <text x="20" y="105" font-family="sans-serif" font-size="12" fill="#CBD5E1">
            Focus: Enterprise Ireland PSSF (€100k) • Overall Progress: 88% (Mod J: 3-Year Cashflow)
          </text>
          <text x="20" y="130" font-family="sans-serif" font-size="12" fill="#6EE7B7">
            ✓ 142 Survey Responses • €450/mo Validated Willingness-to-Pay • 3 LEO Lab Quotes Attached
          </text>

          <rect x="20" y="150" width="710" height="70" rx="10" fill="#0F172A" stroke="rgba(255,255,255,0.06)" />
          <text x="35" y="175" font-family="sans-serif" font-size="11" font-weight="700" fill="#10B981">DIRECTOR RADAR AUDIT:</text>
          <text x="35" y="198" font-family="sans-serif" font-size="12" fill="#E2E8F0">
            Appendices A–F and Enterprise Ireland PSSF dossier compiled with 96/100 co-founder alignment score.
          </text>
        </g>

        <!-- Card 2: FleetFlow Logistics -->
        <g transform="translate(780, 0)">
          <rect width="750" height="240" rx="16" fill="#1E293B" stroke="rgba(16,185,129,0.3)" />
          <rect x="20" y="20" width="46" height="46" rx="10" fill="#059669" />
          <text x="43" y="50" font-family="sans-serif" font-size="18" font-weight="900" fill="#FFFFFF" text-anchor="middle">FF</text>

          <text x="80" y="38" font-family="sans-serif" font-size="16" font-weight="800" fill="#FFFFFF">FleetFlow Logistics</text>
          <text x="80" y="58" font-family="sans-serif" font-size="12" fill="#94A3B8">Industrial AI &amp; Robotics • Conor Ryan &amp; Aoife Kelly</text>

          <rect x="540" y="20" width="190" height="28" rx="6" fill="#047857" />
          <text x="635" y="39" font-family="sans-serif" font-size="11" font-weight="800" fill="#FFFFFF" text-anchor="middle">100% COMPLIANT (LEO PACK)</text>

          <text x="20" y="105" font-family="sans-serif" font-size="12" fill="#CBD5E1">
            Focus: LEO Priming Grant (€80k / 50%) • Overall Progress: 100% (Mod L: Business Plan Ready)
          </text>
          <text x="20" y="130" font-family="sans-serif" font-size="12" fill="#6EE7B7">
            ✓ €1,200/mo Pilot Agreed • €184k Projected Y1 Revenue / €42k Funding Gap Verified
          </text>

          <rect x="20" y="150" width="710" height="70" rx="10" fill="#0F172A" stroke="rgba(255,255,255,0.06)" />
          <text x="35" y="175" font-family="sans-serif" font-size="11" font-weight="700" fill="#10B981">DIRECTOR RADAR AUDIT:</text>
          <text x="35" y="198" font-family="sans-serif" font-size="12" fill="#E2E8F0">
            Official LEO Priming pack compiled with non-displacement certification &amp; 3-year cashflow signed off.
          </text>
        </g>

        <!-- Card 3: Startup Sidekick -->
        <g transform="translate(0, 260)">
          <rect width="750" height="240" rx="16" fill="#1E293B" stroke="rgba(16,185,129,0.3)" />
          <rect x="20" y="20" width="46" height="46" rx="10" fill="#047857" />
          <text x="43" y="50" font-family="sans-serif" font-size="18" font-weight="900" fill="#FFFFFF" text-anchor="middle">SS</text>

          <text x="80" y="38" font-family="sans-serif" font-size="16" font-weight="800" fill="#FFFFFF">Startup Sidekick</text>
          <text x="80" y="58" font-family="sans-serif" font-size="12" fill="#94A3B8">B2B SaaS / Founder Co-Pilot • Thomas Walsh</text>

          <rect x="540" y="20" width="190" height="28" rx="6" fill="#047857" />
          <text x="635" y="39" font-family="sans-serif" font-size="11" font-weight="800" fill="#FFFFFF" text-anchor="middle">PRE-FLIGHT PASSED (94/100)</text>

          <text x="20" y="105" font-family="sans-serif" font-size="12" fill="#CBD5E1">
            Focus: LEO Dublin City Feasibility (€30k) • Overall Progress: 94% (Mod L Dossier Compiling)
          </text>
          <text x="20" y="130" font-family="sans-serif" font-size="12" fill="#6EE7B7">
            ✓ €129/pass validated • 89 Waitlist Leads • Revolut Business &amp; CRO 748291 Verified
          </text>

          <rect x="20" y="150" width="710" height="70" rx="10" fill="#0F172A" stroke="rgba(255,255,255,0.06)" />
          <text x="35" y="175" font-family="sans-serif" font-size="11" font-weight="700" fill="#10B981">DIRECTOR RADAR AUDIT:</text>
          <text x="35" y="198" font-family="sans-serif" font-size="12" fill="#E2E8F0">
            Pocket Profit crossover verified at Month 4 (34 subscribers). 50% LEO matching capital verified.
          </text>
        </g>

        <!-- Card 4: Verdant Power Tiles -->
        <g transform="translate(780, 260)">
          <rect width="750" height="240" rx="16" fill="#1E293B" stroke="rgba(255,255,255,0.08)" />
          <rect x="20" y="20" width="46" height="46" rx="10" fill="#334155" />
          <text x="43" y="50" font-family="sans-serif" font-size="18" font-weight="900" fill="#FFFFFF" text-anchor="middle">VP</text>

          <text x="80" y="38" font-family="sans-serif" font-size="16" font-weight="800" fill="#FFFFFF">Verdant Power Tiles</text>
          <text x="80" y="58" font-family="sans-serif" font-size="12" fill="#94A3B8">CleanTech / Manufacturing • Marcus Vance &amp; Tom Sterling</text>

          <rect x="540" y="20" width="190" height="28" rx="6" fill="#334155" />
          <text x="635" y="39" font-family="sans-serif" font-size="11" font-weight="800" fill="#FFFFFF" text-anchor="middle">IN REVIEW (WP3 CALIBRATION)</text>

          <text x="20" y="105" font-family="sans-serif" font-size="12" fill="#CBD5E1">
            Focus: Innovate UK Smart Grant (£150k) • Overall Progress: 65% (Mod H: Unit Economics)
          </text>
          <text x="20" y="130" font-family="sans-serif" font-size="12" fill="#94A3B8">
            • 4-Year Vesting Agreement Filed • Technical Merit Work Packages WP1–WP3 Defined
          </text>

          <rect x="20" y="150" width="710" height="70" rx="10" fill="#0F172A" stroke="rgba(255,255,255,0.06)" />
          <text x="35" y="175" font-family="sans-serif" font-size="11" font-weight="700" fill="#FBBF24">DIRECTOR RADAR AUDIT:</text>
          <text x="35" y="198" font-family="sans-serif" font-size="12" fill="#E2E8F0">
            Innovate UK 9-Question IFS structure populated. Capital depreciation schedule needs advisor signoff.
          </text>
        </g>
      </g>
    </g>
  </svg>
  `;

  await renderSvgToPng(cohortCommandSvg, '06-cohort-director-command-center-1920x1080.png');

  console.log('All 6 Sovereign Emerald & Deep Slate images rendered successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
