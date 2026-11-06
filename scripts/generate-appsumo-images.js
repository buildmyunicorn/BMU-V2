const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'public', 'appsumo-assets');
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
  // IMAGE 1: OFFICIAL HERO IMAGE (1920x1080)
  // Clean branded dark-mode UI mockup with Pocket Profit graph, live metrics, and AppSumo pill
  // =========================================================================
  const heroSvg = `
  <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="heroBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#090D16" />
        <stop offset="45%" stop-color="#0F172A" />
        <stop offset="100%" stop-color="#1E1B4B" />
      </linearGradient>

      <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#6366F1" />
        <stop offset="50%" stop-color="#8B5CF6" />
        <stop offset="100%" stop-color="#EC4899" />
      </linearGradient>

      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="90" result="blur" />
      </filter>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="25" stdDeviation="35" flood-color="#000000" flood-opacity="0.65" />
      </filter>
    </defs>

    <rect width="1920" height="1080" fill="url(#heroBg)" />

    <!-- Ambient Glows -->
    <circle cx="320" cy="240" r="280" fill="#4F46E5" opacity="0.30" filter="url(#glow)" />
    <circle cx="1680" cy="380" r="340" fill="#8B5CF6" opacity="0.25" filter="url(#glow)" />
    <circle cx="1080" cy="900" r="380" fill="#EC4899" opacity="0.18" filter="url(#glow)" />

    <!-- Isometric Background Grid -->
    <g opacity="0.06" stroke="#94A3B8" stroke-width="1">
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
      <rect x="-260" y="-24" width="520" height="48" rx="24" fill="rgba(99, 102, 241, 0.15)" stroke="rgba(129, 140, 248, 0.45)" stroke-width="1.5" />
      <circle cx="-225" cy="0" r="6" fill="#10B981" />
      <text x="-205" y="6" font-family="-apple-system, BlinkMacSystemFont, &apos;Segoe UI&apos;, Roboto, sans-serif" font-size="16" font-weight="700" fill="#C7D2FE" letter-spacing="1.5">
        APPSUMO EXCLUSIVE • 12-MODULE LIFETIME DEAL
      </text>
    </g>

    <!-- Main Headline & Subtitle -->
    <text x="960" y="185" font-family="-apple-system, BlinkMacSystemFont, &apos;Segoe UI&apos;, Roboto, sans-serif" font-size="54" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="-1">
      Turn Startup Ideas Into Validated Business Plans
    </text>
    <text x="960" y="235" font-family="-apple-system, BlinkMacSystemFont, &apos;Segoe UI&apos;, Roboto, sans-serif" font-size="21" font-weight="500" fill="#94A3B8" text-anchor="middle">
      The Supportive Co-Founder &amp; Blind-Spot Engine • Customer Surveys • Pocket Profit • Bank &amp; Investor Plans
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

      <text x="800" y="38" font-family="-apple-system, BlinkMacSystemFont, &apos;Segoe UI&apos;, Roboto, sans-serif" font-size="14" font-weight="600" fill="#94A3B8" text-anchor="middle">
        Startup Preflight Workspace — Acme AI Health • Mode: Global Venture &amp; Bank Plan
      </text>

      <!-- Module Tabs Strip -->
      <g transform="translate(32, 85)">
        <rect x="0" y="0" width="220" height="42" rx="10" fill="#4F46E5" />
        <text x="110" y="26" font-family="-apple-system, BlinkMacSystemFont, &apos;Segoe UI&apos;, Roboto, sans-serif" font-size="13" font-weight="700" fill="#FFFFFF" text-anchor="middle">
          Mod H: Pocket Profit
        </text>

        <rect x="235" y="0" width="220" height="42" rx="10" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(255, 255, 255, 0.08)" />
        <text x="345" y="26" font-family="-apple-system, BlinkMacSystemFont, &apos;Segoe UI&apos;, Roboto, sans-serif" font-size="13" font-weight="600" fill="#94A3B8" text-anchor="middle">
          Mod C: Survey Waitlist
        </text>

        <rect x="470" y="0" width="220" height="42" rx="10" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(255, 255, 255, 0.08)" />
        <text x="580" y="26" font-family="-apple-system, BlinkMacSystemFont, &apos;Segoe UI&apos;, Roboto, sans-serif" font-size="13" font-weight="600" fill="#94A3B8" text-anchor="middle">
          Mod F: Co-Founder Fit
        </text>

        <rect x="705" y="0" width="220" height="42" rx="10" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(255, 255, 255, 0.08)" />
        <text x="815" y="26" font-family="-apple-system, BlinkMacSystemFont, &apos;Segoe UI&apos;, Roboto, sans-serif" font-size="13" font-weight="600" fill="#94A3B8" text-anchor="middle">
          Mod L: Business Plan
        </text>

        <g transform="translate(1320, 0)">
          <rect x="0" y="0" width="210" height="42" rx="10" fill="rgba(16, 185, 129, 0.15)" stroke="rgba(16, 185, 129, 0.3)" />
          <circle cx="28" cy="21" r="5" fill="#10B981" />
          <text x="115" y="26" font-family="-apple-system, BlinkMacSystemFont, &apos;Segoe UI&apos;, Roboto, sans-serif" font-size="13" font-weight="700" fill="#34D399" text-anchor="middle">
            All 12 Modules Synced
          </text>
        </g>
      </g>

      <!-- Left Column Metrics -->
      <g transform="translate(32, 145)">
        <rect x="0" y="0" width="440" height="160" rx="16" fill="#1E293B" stroke="rgba(255, 255, 255, 0.08)" />
        <text x="24" y="38" font-family="-apple-system, BlinkMacSystemFont, &apos;Segoe UI&apos;, Roboto, sans-serif" font-size="12" font-weight="700" fill="#94A3B8" letter-spacing="1">
          YEAR 1 BREAKEVEN TARGET
        </text>
        <text x="24" y="90" font-family="-apple-system, BlinkMacSystemFont, &apos;Segoe UI&apos;, Roboto, sans-serif" font-size="44" font-weight="900" fill="#FFFFFF">
          42 Units / mo
        </text>
        <text x="24" y="130" font-family="-apple-system, BlinkMacSystemFont, &apos;Segoe UI&apos;, Roboto, sans-serif" font-size="14" font-weight="500" fill="#10B981">
          &#x2191; Fully covers $8,500/mo salary &amp; overhead
        </text>

        <rect x="0" y="180" width="440" height="160" rx="16" fill="#1E293B" stroke="rgba(255, 255, 255, 0.08)" />
        <text x="24" y="218" font-family="-apple-system, BlinkMacSystemFont, &apos;Segoe UI&apos;, Roboto, sans-serif" font-size="12" font-weight="700" fill="#94A3B8" letter-spacing="1">
          NET &quot;POCKET PROFIT&quot; MARGIN
        </text>
        <text x="24" y="270" font-family="-apple-system, BlinkMacSystemFont, &apos;Segoe UI&apos;, Roboto, sans-serif" font-size="44" font-weight="900" fill="#818CF8">
          78.4%
        </text>
        <text x="24" y="310" font-family="-apple-system, BlinkMacSystemFont, &apos;Segoe UI&apos;, Roboto, sans-serif" font-size="13" font-weight="500" fill="#CBD5E1">
          After Stripe fees (2.9%), server COGS &amp; refunds
        </text>

        <rect x="0" y="360" width="440" height="175" rx="16" fill="#1E293B" stroke="rgba(255, 255, 255, 0.08)" />
        <text x="24" y="396" font-family="-apple-system, BlinkMacSystemFont, &apos;Segoe UI&apos;, Roboto, sans-serif" font-size="12" font-weight="700" fill="#F59E0B" letter-spacing="1">
          AI CO-FOUNDER BLIND-SPOT REVIEW
        </text>
        <text x="24" y="430" font-family="-apple-system, BlinkMacSystemFont, &apos;Segoe UI&apos;, Roboto, sans-serif" font-size="15" font-weight="700" fill="#F8FAFC">
          &quot;Net-30 Invoice Velocity Gap Detected&quot;
        </text>
        <text x="24" y="460" font-family="-apple-system, BlinkMacSystemFont, &apos;Segoe UI&apos;, Roboto, sans-serif" font-size="13" font-weight="400" fill="#94A3B8">
          If enterprise clients pay Net-30, you need a $24,000 working capital buffer to protect founder payroll in Month 3.
        </text>
        <rect x="24" y="485" width="180" height="28" rx="6" fill="rgba(245, 158, 11, 0.15)" />
        <text x="114" y="504" font-family="-apple-system, BlinkMacSystemFont, &apos;Segoe UI&apos;, Roboto, sans-serif" font-size="11" font-weight="700" fill="#FBBF24" text-anchor="middle">
          Auto-Mitigated in Mod J
        </text>
      </g>

      <!-- Right Column Interactive Graph Area -->
      <g transform="translate(500, 145)">
        <rect width="1065" height="535" rx="20" fill="#0A0F1D" stroke="rgba(255, 255, 255, 0.08)" />

        <text x="32" y="42" font-family="-apple-system, BlinkMacSystemFont, &apos;Segoe UI&apos;, Roboto, sans-serif" font-size="19" font-weight="800" fill="#FFFFFF">
          Pocket Profit Visual Breakeven Engine (3-Year Time Horizon)
        </text>
        <text x="32" y="68" font-family="-apple-system, BlinkMacSystemFont, &apos;Segoe UI&apos;, Roboto, sans-serif" font-size="13" font-weight="500" fill="#64748B">
          Dynamic Crossover: Monthly Fixed Costs ($8,500) vs. Gross Revenue @ $249/user
        </text>

        <g transform="translate(760, 24)">
          <rect x="0" y="0" width="80" height="32" rx="8" fill="#4F46E5" />
          <text x="40" y="21" font-family="sans-serif" font-size="12" font-weight="700" fill="#FFFFFF" text-anchor="middle">Year 1</text>
          <rect x="90" y="0" width="80" height="32" rx="8" fill="rgba(255,255,255,0.05)" />
          <text x="130" y="21" font-family="sans-serif" font-size="12" font-weight="600" fill="#94A3B8" text-anchor="middle">Year 2</text>
          <rect x="180" y="0" width="80" height="32" rx="8" fill="rgba(255,255,255,0.05)" />
          <text x="220" y="21" font-family="sans-serif" font-size="12" font-weight="600" fill="#94A3B8" text-anchor="middle">Year 3</text>
        </g>

        <!-- Inner Chart -->
        <g transform="translate(60, 120)">
          <line x1="0" y1="0" x2="940" y2="0" stroke="rgba(255,255,255,0.05)" />
          <text x="-15" y="5" font-family="sans-serif" font-size="11" fill="#475569" text-anchor="end">$50k</text>
          <line x1="0" y1="80" x2="940" y2="80" stroke="rgba(255,255,255,0.05)" />
          <text x="-15" y="85" font-family="sans-serif" font-size="11" fill="#475569" text-anchor="end">$35k</text>
          <line x1="0" y1="160" x2="940" y2="160" stroke="rgba(255,255,255,0.05)" />
          <text x="-15" y="165" font-family="sans-serif" font-size="11" fill="#475569" text-anchor="end">$20k</text>
          <line x1="0" y1="240" x2="940" y2="240" stroke="rgba(255,255,255,0.05)" />
          <text x="-15" y="245" font-family="sans-serif" font-size="11" fill="#475569" text-anchor="end">$8.5k</text>
          <line x1="0" y1="320" x2="940" y2="320" stroke="rgba(255,255,255,0.1)" />
          <text x="-15" y="325" font-family="sans-serif" font-size="11" fill="#475569" text-anchor="end">$0</text>

          <!-- Fixed Cost Baseline -->
          <line x1="0" y1="240" x2="940" y2="240" stroke="#F43F5E" stroke-width="2.5" stroke-dasharray="6,6" />
          <rect x="740" y="218" width="190" height="22" rx="4" fill="#F43F5E" />
          <text x="835" y="233" font-family="sans-serif" font-size="11" font-weight="700" fill="#FFFFFF" text-anchor="middle">Fixed Cost Floor: $8,500/mo</text>

          <!-- Area & Line -->
          <path d="M 0 320 Q 200 300, 360 240 T 940 30 L 940 320 Z" fill="url(#accentGrad)" opacity="0.12" />
          <path d="M 0 320 Q 200 300, 360 240 T 940 30" fill="none" stroke="#6366F1" stroke-width="4" />

          <!-- Crossover Point -->
          <circle cx="360" cy="240" r="10" fill="#6366F1" stroke="#FFFFFF" stroke-width="3" />
          <g transform="translate(360, 160)">
            <rect x="-105" y="0" width="210" height="58" rx="8" fill="#1E1B4B" stroke="#818CF8" stroke-width="1.5" />
            <text x="0" y="22" font-family="sans-serif" font-size="12" font-weight="800" fill="#A5B4FC" text-anchor="middle">
              BREAKEVEN CROSSOVER
            </text>
            <text x="0" y="44" font-family="sans-serif" font-size="14" font-weight="900" fill="#FFFFFF" text-anchor="middle">
              Month 4 • 42 Customers
            </text>
            <polygon points="-8,58 8,58 0,68" fill="#1E1B4B" />
          </g>

          <text x="60" y="348" font-family="sans-serif" font-size="12" fill="#64748B" text-anchor="middle">M1</text>
          <text x="180" y="348" font-family="sans-serif" font-size="12" fill="#64748B" text-anchor="middle">M3</text>
          <text x="360" y="348" font-family="sans-serif" font-size="12" font-weight="800" fill="#818CF8" text-anchor="middle">M4 (Breakeven)</text>
          <text x="540" y="348" font-family="sans-serif" font-size="12" fill="#64748B" text-anchor="middle">M6</text>
          <text x="720" y="348" font-family="sans-serif" font-size="12" fill="#64748B" text-anchor="middle">M9</text>
          <text x="900" y="348" font-family="sans-serif" font-size="12" fill="#64748B" text-anchor="middle">M12 ($48k/mo)</text>
        </g>
      </g>
    </g>

    <!-- Bottom Strip -->
    <g transform="translate(160, 1030)">
      <text x="0" y="24" font-family="-apple-system, BlinkMacSystemFont, &apos;Segoe UI&apos;, Roboto, sans-serif" font-size="15" font-weight="700" fill="#94A3B8">
        LIFETIME DEAL: Pay Once ($59) • No Monthly Fees • All 12 Modules (A–L) Included • Stackable
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
        <stop offset="0%" stop-color="#064E3B" />
        <stop offset="35%" stop-color="#0B132B" />
        <stop offset="100%" stop-color="#0F172A" />
      </linearGradient>
      <filter id="shadow2" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="25" stdDeviation="35" flood-color="#000000" flood-opacity="0.65" />
      </filter>
    </defs>
    <rect width="1920" height="1080" fill="url(#surveyBg)" />

    <!-- Top Badge -->
    <g transform="translate(960, 95)">
      <rect x="-240" y="-24" width="480" height="48" rx="24" fill="rgba(16, 185, 129, 0.15)" stroke="rgba(16, 185, 129, 0.45)" stroke-width="1.5" />
      <circle cx="-205" cy="0" r="6" fill="#10B981" />
      <text x="-185" y="6" font-family="-apple-system, BlinkMacSystemFont, &apos;Segoe UI&apos;, Roboto, sans-serif" font-size="16" font-weight="700" fill="#6EE7B7" letter-spacing="1.5">
        MODULE C • CUSTOMER SURVEY &amp; WAITLIST
      </text>
    </g>

    <text x="960" y="185" font-family="-apple-system, BlinkMacSystemFont, &apos;Segoe UI&apos;, Roboto, sans-serif" font-size="52" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="-1">
      AI &quot;Mom Test&quot; Bias-Free Survey &amp; Hosted Waitlist
    </text>
    <text x="960" y="235" font-family="-apple-system, BlinkMacSystemFont, &apos;Segoe UI&apos;, Roboto, sans-serif" font-size="21" font-weight="500" fill="#94A3B8" text-anchor="middle">
      Hosted Public Page (/v/[slug]) • QR Outreach Kit • 1-on-1 Interview Logger • Sentiment Synthesizer
    </text>

    <!-- Main Card Window -->
    <g transform="translate(160, 280)" filter="url(#shadow2)">
      <rect width="1600" height="730" rx="24" fill="#0F172A" stroke="rgba(255, 255, 255, 0.15)" stroke-width="1.5" />
      <path d="M 0 24 C 0 10.745 10.745 0 24 0 L 1576 0 C 1589.255 0 1600 10.745 1600 24 L 1600 64 L 0 64 Z" fill="#1E293B" />
      <circle cx="32" cy="32" r="7" fill="#EF4444" /><circle cx="54" cy="32" r="7" fill="#F59E0B" /><circle cx="76" cy="32" r="7" fill="#10B981" />
      <text x="800" y="38" font-family="sans-serif" font-size="14" font-weight="600" fill="#94A3B8" text-anchor="middle">
        Hosted Public Survey Engine — startuppreflight.com/v/acme-ai-health
      </text>

      <!-- Left Column: Survey Builder & Live Questions -->
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
            &quot;When was the last time you attempted to solve clinical scheduling delays?&quot;
          </text>
          <text x="20" y="90" font-family="sans-serif" font-size="12" fill="#94A3B8">
            Filter: Multiple choice &#x2022; Prevents &apos;I would totally buy this&apos; sycophancy
          </text>
        </g>

        <!-- Question 2 Card -->
        <g transform="translate(32, 245)">
          <rect width="665" height="125" rx="12" fill="#0F172A" stroke="rgba(255,255,255,0.06)" />
          <text x="20" y="32" font-family="sans-serif" font-size="11" font-weight="700" fill="#10B981">QUESTION 2 • ACTIVE SPEND INQUIRY</text>
          <text x="20" y="60" font-family="sans-serif" font-size="14" font-weight="700" fill="#FFFFFF">
            &quot;How much did you or your clinic spend on third-party tools last year?&quot;
          </text>
          <text x="20" y="90" font-family="sans-serif" font-size="12" fill="#94A3B8">
            Discovers real budget allocation before pricing is locked in Module H
          </text>
        </g>

        <!-- Distribution Kit Strip -->
        <g transform="translate(32, 395)">
          <rect width="665" height="150" rx="12" fill="#0A0F1D" stroke="rgba(16,185,129,0.3)" />
          <text x="24" y="36" font-family="sans-serif" font-size="15" font-weight="800" fill="#34D399">
            Outreach Distribution Kit &amp; QR Code
          </text>
          <text x="24" y="64" font-family="sans-serif" font-size="13" fill="#CBD5E1">
            Download print-ready flyer QR codes, cold LinkedIn DM scripts, and email templates.
          </text>
          <rect x="24" y="90" width="220" height="38" rx="8" fill="#10B981" />
          <text x="134" y="114" font-family="sans-serif" font-size="12" font-weight="700" fill="#090D16" text-anchor="middle">
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
          142 Verified Responses Collected • Auto-feeds into Module L Business Plan
        </text>

        <!-- Stats Bar -->
        <g transform="translate(32, 95)">
          <rect width="215" height="90" rx="12" fill="#0F172A" />
          <text x="20" y="34" font-family="sans-serif" font-size="12" font-weight="700" fill="#94A3B8">WAITLIST LEADS</text>
          <text x="20" y="72" font-family="sans-serif" font-size="34" font-weight="900" fill="#34D399">89 Founders</text>

          <rect x="235" y="0" width="215" height="90" rx="12" fill="#0F172A" />
          <text x="255" y="34" font-family="sans-serif" font-size="12" font-weight="700" fill="#94A3B8">ACTIVE PAIN RATE</text>
          <text x="255" y="72" font-family="sans-serif" font-size="34" font-weight="900" fill="#60A5FA">76.8%</text>

          <rect x="470" y="0" width="215" height="90" rx="12" fill="#0F172A" />
          <text x="490" y="34" font-family="sans-serif" font-size="12" font-weight="700" fill="#94A3B8">WILLING TO PAY</text>
          <text x="490" y="72" font-family="sans-serif" font-size="34" font-weight="900" fill="#FBBF24">$200+/mo</text>
        </g>

        <!-- AI Synthesis Box -->
        <g transform="translate(32, 210)">
          <rect width="685" height="335" rx="14" fill="#0B132B" stroke="rgba(99,102,241,0.3)" />
          <text x="24" y="36" font-family="sans-serif" font-size="14" font-weight="800" fill="#A5B4FC">
            AI PATTERN EXTRACTION (MOM-TEST COMPLIANT)
          </text>
          <text x="24" y="68" font-family="sans-serif" font-size="13" font-weight="600" fill="#FFFFFF">
            &#x2022; Primary Frustration: Current tools require 15 minutes of manual entry per patient intake.
          </text>
          <text x="24" y="105" font-family="sans-serif" font-size="13" font-weight="600" fill="#FFFFFF">
            &#x2022; Commercial Willingness: 64% currently pay $150–$300/mo for clunky legacy software.
          </text>
          <text x="24" y="142" font-family="sans-serif" font-size="13" font-weight="600" fill="#FFFFFF">
            &#x2022; Fatal Blind Spot Caught: Don&apos;t pitch &apos;AI diagnosis&apos; — clinicians only want scheduling automation.
          </text>

          <rect x="24" y="180" width="635" height="120" rx="10" fill="#1E1B4B" />
          <text x="40" y="210" font-family="sans-serif" font-size="12" font-weight="700" fill="#818CF8">
            VERBATIM FOUNDER QUOTE PULLED INTO BUSINESS PLAN:
          </text>
          <text x="40" y="240" font-family="sans-serif" font-size="13" font-style="italic" fill="#E2E8F0">
            &quot;If you can integrate with our calendar and eliminate Sunday night schedule building, I will sign a 12-month contract tomorrow morning.&quot;
          </text>
          <text x="40" y="275" font-family="sans-serif" font-size="12" fill="#94A3B8">
            — Dr. Sarah M., Private Practice Clinical Director (Interview #4)
          </text>
        </g>
      </g>
    </g>
  </svg>
  `;

  await renderSvgToPng(surveySvg, '02-customer-survey-waitlist-1920x1080.png');

  // =========================================================================
  // IMAGE 3: MODULE F CO-FOUNDER ALIGNMENT & 12 AWKWARD QUESTIONS (1920x1080)
  // Blind-reveal alignment survey, heatmap, and equity split calculator
  // =========================================================================
  const cofounderSvg = `
  <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="cfBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#311042" />
        <stop offset="35%" stop-color="#0F172A" />
        <stop offset="100%" stop-color="#090D16" />
      </linearGradient>
      <filter id="shadow3" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="25" stdDeviation="35" flood-color="#000000" flood-opacity="0.65" />
      </filter>
    </defs>
    <rect width="1920" height="1080" fill="url(#cfBg)" />

    <g transform="translate(960, 95)">
      <rect x="-260" y="-24" width="520" height="48" rx="24" fill="rgba(168, 85, 247, 0.15)" stroke="rgba(192, 132, 252, 0.45)" stroke-width="1.5" />
      <circle cx="-225" cy="0" r="6" fill="#C084FC" />
      <text x="-205" y="6" font-family="-apple-system, BlinkMacSystemFont, &apos;Segoe UI&apos;, Roboto, sans-serif" font-size="16" font-weight="700" fill="#E9D5FF" letter-spacing="1.5">
        MODULE F • CO-FOUNDER ALIGNMENT &amp; TEAM
      </text>
    </g>

    <text x="960" y="185" font-family="-apple-system, BlinkMacSystemFont, &apos;Segoe UI&apos;, Roboto, sans-serif" font-size="52" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="-1">
      Blind-Reveal 12 Awkward Questions &amp; Alignment Heatmap
    </text>
    <text x="960" y="235" font-family="-apple-system, BlinkMacSystemFont, &apos;Segoe UI&apos;, Roboto, sans-serif" font-size="21" font-weight="500" fill="#94A3B8" text-anchor="middle">
      Prevent Co-Founder Breakups • Side-by-Side Reality Check • Dynamic Equity Split Calculator
    </text>

    <!-- UI Mockup Window -->
    <g transform="translate(160, 280)" filter="url(#shadow3)">
      <rect width="1600" height="730" rx="24" fill="#0F172A" stroke="rgba(255, 255, 255, 0.15)" stroke-width="1.5" />
      <path d="M 0 24 C 0 10.745 10.745 0 24 0 L 1576 0 C 1589.255 0 1600 10.745 1600 24 L 1600 64 L 0 64 Z" fill="#1E293B" />
      <circle cx="32" cy="32" r="7" fill="#EF4444" /><circle cx="54" cy="32" r="7" fill="#F59E0B" /><circle cx="76" cy="32" r="7" fill="#10B981" />
      <text x="800" y="38" font-family="sans-serif" font-size="14" font-weight="600" fill="#94A3B8" text-anchor="middle">
        Co-Founder Blind-Reveal Survey — Founder A (CEO) vs. Founder B (CTO)
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
            &#x2022; Founder A (CEO): 6 Months ($3,500/mo personal burn)
          </text>
          <text x="24" y="82" font-family="sans-serif" font-size="13" fill="#6EE7B7">
            &#x2022; Founder B (CTO): 6 Months ($4,000/mo personal burn)
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
            2. What is our stance on an early $10M buyout offer in Year 2?
          </text>
          <text x="24" y="60" font-family="sans-serif" font-size="13" fill="#FCA5A5">
            &#x2022; Founder A (CEO): &quot;Sell immediately, take life-changing liquidity.&quot;
          </text>
          <text x="24" y="82" font-family="sans-serif" font-size="13" fill="#FCA5A5">
            &#x2022; Founder B (CTO): &quot;Reject all buyouts, build a $100M+ independent company.&quot;
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
            &#x2022; Founder A: Full-time (50+ hrs/wk, resigned from day job)
          </text>
          <text x="24" y="82" font-family="sans-serif" font-size="13" fill="#6EE7B7">
            &#x2022; Founder B: Full-time (50+ hrs/wk, resigned from day job)
          </text>
          <rect x="680" y="35" width="130" height="30" rx="6" fill="rgba(16,185,129,0.2)" />
          <text x="745" y="55" font-family="sans-serif" font-size="12" font-weight="800" fill="#34D399" text-anchor="middle">
            ALIGNED (100%)
          </text>
        </g>

        <!-- Bottom Guidance Strip -->
        <g transform="translate(32, 460)">
          <rect width="835" height="95" rx="12" fill="#2E1065" stroke="rgba(168,85,247,0.3)" />
          <text x="24" y="34" font-family="sans-serif" font-size="14" font-weight="800" fill="#E9D5FF">
            AI Mediation Advice Generated for Next Co-Founder Meeting:
          </text>
          <text x="24" y="64" font-family="sans-serif" font-size="13" fill="#D8B4FE">
            &quot;Draft a written Shareholders Agreement clause establishing a formal voting threshold for acquisition offers below $25M before allocating equity.&quot;
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
          Weighted across Idea, Domain IP, Capital, and Execution.
        </text>

        <!-- Equity Chart Representation -->
        <g transform="translate(32, 105)">
          <rect width="516" height="180" rx="16" fill="#0A0F1D" />
          <text x="32" y="44" font-family="sans-serif" font-size="13" font-weight="700" fill="#94A3B8">RECOMMENDED 4-YEAR VESTING SPLIT</text>
          <text x="32" y="100" font-family="sans-serif" font-size="44" font-weight="900" fill="#C084FC">55% / 45%</text>
          <text x="32" y="140" font-family="sans-serif" font-size="13" fill="#94A3B8">
            Includes 1-Year Cliff &amp; Acceleration on Change of Control
          </text>
        </g>

        <!-- Factors List -->
        <g transform="translate(32, 310)">
          <text x="0" y="24" font-family="sans-serif" font-size="14" font-weight="800" fill="#FFFFFF">Contribution Weights Breakdown:</text>
          <g transform="translate(0, 45)">
            <text x="0" y="16" font-family="sans-serif" font-size="13" fill="#CBD5E1">Cash Invested ($25k vs. $10k)</text>
            <text x="516" y="16" font-family="sans-serif" font-size="13" font-weight="700" fill="#FFFFFF" text-anchor="end">60 / 40</text>
            <rect x="0" y="25" width="516" height="6" rx="3" fill="#334155" />
            <rect x="0" y="25" width="310" height="6" rx="3" fill="#A855F7" />
          </g>

          <g transform="translate(0, 95)">
            <text x="0" y="16" font-family="sans-serif" font-size="13" fill="#CBD5E1">Full-Time Commitment &amp; Opportunity Cost</text>
            <text x="516" y="16" font-family="sans-serif" font-size="13" font-weight="700" fill="#FFFFFF" text-anchor="end">50 / 50</text>
            <rect x="0" y="25" width="516" height="6" rx="3" fill="#334155" />
            <rect x="0" y="25" width="258" height="6" rx="3" fill="#38BDF8" />
          </g>

          <g transform="translate(0, 145)">
            <text x="0" y="16" font-family="sans-serif" font-size="13" fill="#CBD5E1">Proprietary IP &amp; Customer Network</text>
            <text x="516" y="16" font-family="sans-serif" font-size="13" font-weight="700" fill="#FFFFFF" text-anchor="end">70 / 30</text>
            <rect x="0" y="25" width="516" height="6" rx="3" fill="#334155" />
            <rect x="0" y="25" width="361" height="6" rx="3" fill="#34D399" />
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
        <stop offset="0%" stop-color="#1E1B4B" />
        <stop offset="40%" stop-color="#0F172A" />
        <stop offset="100%" stop-color="#020617" />
      </linearGradient>
      <filter id="shadow4" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="25" stdDeviation="35" flood-color="#000000" flood-opacity="0.65" />
      </filter>
    </defs>
    <rect width="1920" height="1080" fill="url(#compBg)" />

    <g transform="translate(960, 95)">
      <rect x="-260" y="-24" width="520" height="48" rx="24" fill="rgba(59, 130, 246, 0.15)" stroke="rgba(96, 165, 250, 0.45)" stroke-width="1.5" />
      <circle cx="-225" cy="0" r="6" fill="#60A5FA" />
      <text x="-205" y="6" font-family="-apple-system, BlinkMacSystemFont, &apos;Segoe UI&apos;, Roboto, sans-serif" font-size="16" font-weight="700" fill="#BFDBFE" letter-spacing="1.5">
        MODULE L • BUSINESS PLAN &amp; COMPILER
      </text>
    </g>

    <text x="960" y="185" font-family="-apple-system, BlinkMacSystemFont, &apos;Segoe UI&apos;, Roboto, sans-serif" font-size="52" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="-1">
      Living Business Plan &amp; Pre-Flight AI Contradiction Audit
    </text>
    <text x="960" y="235" font-family="-apple-system, BlinkMacSystemFont, &apos;Segoe UI&apos;, Roboto, sans-serif" font-size="21" font-weight="500" fill="#94A3B8" text-anchor="middle">
      Boardroom &amp; Bank Ready • Cross-Checks Narrative vs. Projections • 1-Click PDF Export
    </text>

    <!-- UI Mockup Window -->
    <g transform="translate(160, 280)" filter="url(#shadow4)">
      <rect width="1600" height="730" rx="24" fill="#0F172A" stroke="rgba(255, 255, 255, 0.15)" stroke-width="1.5" />
      <path d="M 0 24 C 0 10.745 10.745 0 24 0 L 1576 0 C 1589.255 0 1600 10.745 1600 24 L 1600 64 L 0 64 Z" fill="#1E293B" />
      <circle cx="32" cy="32" r="7" fill="#EF4444" /><circle cx="54" cy="32" r="7" fill="#F59E0B" /><circle cx="76" cy="32" r="7" fill="#10B981" />
      <text x="800" y="38" font-family="sans-serif" font-size="14" font-weight="600" fill="#94A3B8" text-anchor="middle">
        Official Compiler Dossier — 5 Submission Modes Supported (Bank, Investor, LEO, Innovate UK)
      </text>

      <!-- Left Column: Pre-flight Audit Scan -->
      <g transform="translate(40, 95)">
        <rect width="780" height="585" rx="18" fill="#1E293B" stroke="rgba(255, 255, 255, 0.08)" />
        <text x="32" y="44" font-family="sans-serif" font-size="18" font-weight="800" fill="#FFFFFF">
          Pre-Flight Contradiction Audit Results
        </text>
        <text x="32" y="70" font-family="sans-serif" font-size="13" font-weight="500" fill="#94A3B8">
          The AI engine stress-tests every module to ensure figures align perfectly before lenders review.
        </text>

        <!-- Audit Score Banner -->
        <g transform="translate(32, 95)">
          <rect width="715" height="85" rx="12" fill="#0F172A" stroke="rgba(16,185,129,0.3)" />
          <text x="24" y="35" font-family="sans-serif" font-size="12" font-weight="700" fill="#94A3B8">PRE-FLIGHT READINESS SCORE</text>
          <text x="24" y="68" font-family="sans-serif" font-size="30" font-weight="900" fill="#10B981">
            94 / 100 • Ready for Investor &amp; Lender Review
          </text>
          <rect x="560" y="24" width="130" height="36" rx="8" fill="#10B981" />
          <text x="625" y="47" font-family="sans-serif" font-size="13" font-weight="800" fill="#090D16" text-anchor="middle">
            PASSED
          </text>
        </g>

        <!-- Contradiction Check 1 (Passed) -->
        <g transform="translate(32, 200)">
          <rect width="715" height="95" rx="12" fill="#0F172A" />
          <circle cx="36" cy="48" r="14" fill="rgba(16,185,129,0.2)" />
          <text x="36" y="53" font-family="sans-serif" font-size="14" font-weight="800" fill="#34D399" text-anchor="middle">&#x2713;</text>
          <text x="68" y="38" font-family="sans-serif" font-size="14" font-weight="800" fill="#FFFFFF">
            Pricing vs. Survey Willingness Check
          </text>
          <text x="68" y="66" font-family="sans-serif" font-size="12" fill="#94A3B8">
            Module H price ($249/mo) matches Module C survey median willingness-to-pay ($200–$300).
          </text>
        </g>

        <!-- Contradiction Check 2 (Resolved) -->
        <g transform="translate(32, 315)">
          <rect width="715" height="110" rx="12" fill="#0F172A" />
          <circle cx="36" cy="55" r="14" fill="rgba(245,158,11,0.2)" />
          <text x="36" y="60" font-family="sans-serif" font-size="14" font-weight="800" fill="#FBBF24" text-anchor="middle">!</text>
          <text x="68" y="38" font-family="sans-serif" font-size="14" font-weight="800" fill="#FFFFFF">
            Headcount vs. Payroll Synchronisation
          </text>
          <text x="68" y="66" font-family="sans-serif" font-size="12" fill="#94A3B8">
            Module F Year-2 hiring schedule (Senior Engineer @ $85k) was verified against Module J cashflow projections.
          </text>
          <text x="68" y="90" font-family="sans-serif" font-size="12" font-weight="700" fill="#34D399">
            ✓ 100% Mathematically Reconciled
          </text>
        </g>

        <!-- Export Buttons -->
        <g transform="translate(32, 450)">
          <rect width="715" height="90" rx="12" fill="#1E1B4B" stroke="rgba(99,102,241,0.4)" />
          <text x="24" y="38" font-family="sans-serif" font-size="15" font-weight="800" fill="#FFFFFF">
            Export Verified Business Plan Dossier
          </text>
          <text x="24" y="65" font-family="sans-serif" font-size="12" fill="#A5B4FC">
            Exports 35-page structured PDF complete with Appendix A (Surveys) and Appendix B (Financials).
          </text>
        </g>
      </g>

      <!-- Right Column: Document Preview -->
      <g transform="translate(860, 95)">
        <rect width="700" height="585" rx="18" fill="#FFFFFF" />

        <!-- Mock PDF Document Paper Look -->
        <g transform="translate(45, 40)">
          <rect width="180" height="24" rx="4" fill="#E0E7FF" />
          <text x="90" y="16" font-family="sans-serif" font-size="11" font-weight="700" fill="#4338CA" text-anchor="middle">
            OFFICIAL BUSINESS PLAN
          </text>

          <text x="0" y="60" font-family="sans-serif" font-size="24" font-weight="900" fill="#0F172A">
            Acme AI Health Ltd.
          </text>
          <text x="0" y="85" font-family="sans-serif" font-size="13" font-weight="600" fill="#64748B">
            Commercial Business Plan &amp; 3-Year Capital Allocation
          </text>
          <line x1="0" y1="105" x2="610" y2="105" stroke="#E2E8F0" stroke-width="1.5" />

          <!-- Table of contents / Preview -->
          <g transform="translate(0, 125)">
            <text x="0" y="20" font-family="sans-serif" font-size="13" font-weight="800" fill="#1E293B">1. Executive Summary &amp; Customer Problem (Mod A)</text>
            <text x="0" y="55" font-family="sans-serif" font-size="13" font-weight="800" fill="#1E293B">2. Target Market TAM/SAM/SOM Sizing (Mod B)</text>
            <text x="0" y="90" font-family="sans-serif" font-size="13" font-weight="800" fill="#1E293B">3. Primary Customer Validation &amp; Waitlist Proof (Mod C)</text>
            <text x="0" y="125" font-family="sans-serif" font-size="13" font-weight="800" fill="#1E293B">4. Technical Architecture &amp; V1 Work Packages (Mod D)</text>
            <text x="0" y="160" font-family="sans-serif" font-size="13" font-weight="800" fill="#1E293B">5. Operations Blueprint &amp; Risk Register (Mod E &amp; G)</text>
            <text x="0" y="195" font-family="sans-serif" font-size="13" font-weight="800" fill="#1E293B">6. Co-Founder Profiles &amp; Headcount Plan (Mod F)</text>
            <text x="0" y="230" font-family="sans-serif" font-size="13" font-weight="800" fill="#1E293B">7. 3-Year Pocket Profit &amp; Breakeven Model (Mod H &amp; J)</text>
          </g>

          <rect x="0" y="420" width="610" height="70" rx="8" fill="#F8FAFC" stroke="#E2E8F0" />
          <text x="24" y="450" font-family="sans-serif" font-size="12" font-weight="700" fill="#0F172A">
            Boardroom Assurance Seal:
          </text>
          <text x="24" y="472" font-family="sans-serif" font-size="12" fill="#64748B">
            Zero mathematical hallucinations. Every line backed by live workspace validation data.
          </text>
        </g>
      </g>
    </g>
  </svg>
  `;

  await renderSvgToPng(compilerSvg, '04-business-plan-compiler-1920x1080.png');

  // =========================================================================
  // IMAGE 5: 12-MODULE SUITE OVERVIEW (1920x1080)
  // Grid showing all 12 modules from Ideation to Business Plan
  // =========================================================================
  const modulesGridSvg = `
  <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gridBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0F172A" />
        <stop offset="100%" stop-color="#020617" />
      </linearGradient>
    </defs>
    <rect width="1920" height="1080" fill="url(#gridBg)" />

    <g transform="translate(960, 85)">
      <rect x="-240" y="-22" width="480" height="44" rx="22" fill="rgba(99, 102, 241, 0.15)" stroke="rgba(129, 140, 248, 0.45)" stroke-width="1.5" />
      <text x="0" y="6" font-family="sans-serif" font-size="15" font-weight="700" fill="#C7D2FE" text-anchor="middle" letter-spacing="1.5">
        COMPLETE 12-MODULE STARTUP PREFLIGHT ENGINE
      </text>
    </g>

    <text x="960" y="165" font-family="sans-serif" font-size="46" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="-1">
      All 12 Founder Modules Included in Every AppSumo Tier
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
        { code: 'Mod K', title: 'Capital Stack & Funding', tag: 'Funding Strategy', desc: 'Bootstrapping runway, commercial loans & angel/seed readiness.' },
        { code: 'Mod L', title: 'Living Business Plan', tag: 'Compiler Vault', desc: 'Investor-ready business plan & Pre-Flight contradiction audit.' },
      ].map((item, idx) => {
        const col = idx % 4;
        const row = Math.floor(idx / 4);
        const x = col * 410;
        const y = row * 250;
        return `
        <g transform="translate(${x}, ${y})">
          <rect width="380" height="225" rx="16" fill="#1E293B" stroke="rgba(255, 255, 255, 0.08)" />
          <rect x="20" y="20" width="70" height="26" rx="6" fill="#4F46E5" />
          <text x="55" y="38" font-family="sans-serif" font-size="12" font-weight="800" fill="#FFFFFF" text-anchor="middle">${item.code}</text>

          <rect x="100" y="20" width="160" height="26" rx="6" fill="rgba(255, 255, 255, 0.06)" />
          <text x="180" y="38" font-family="sans-serif" font-size="11" font-weight="600" fill="#94A3B8" text-anchor="middle">${xmlEscape(item.tag)}</text>

          <text x="20" y="85" font-family="sans-serif" font-size="17" font-weight="800" fill="#FFFFFF">${xmlEscape(item.title)}</text>
          <text x="20" y="125" font-family="sans-serif" font-size="13" fill="#94A3B8">${xmlEscape(item.desc)}</text>

          <text x="20" y="195" font-family="sans-serif" font-size="11" font-weight="700" fill="#34D399">✓ Full Lifetime Access (Tier 1 &amp; Tier 2)</text>
        </g>
        `;
      }).join('')}
    </g>
  </svg>
  `;

  await renderSvgToPng(modulesGridSvg, '05-all-12-modules-suite-1920x1080.png');

  console.log('All 5 AppSumo listing images rendered successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
