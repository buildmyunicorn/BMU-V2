import type { LandingEdition } from '@/components/marketing/platform-ui-previews';

export interface FaqItem {
  question: string;
  answer: string;
}

export function getFaqsForEdition(edition: LandingEdition): FaqItem[] {
  if (edition === 'IE') {
    return [
      {
        question:
          'Which Irish startup grants and schemes does Startup Preflight prepare me for?',
        answer:
          'Startup Preflight scores your eligibility and structures your application evidence for Local Enterprise Office (LEO) Feasibility Study Grants (up to €15,000), LEO Priming Grants (up to €80,000+), LEO Digital for Business & Grow Digital Vouchers (up to €5,000), Enterprise Ireland Digital Discovery & New Frontiers (€30,000 tax-free founder stipend), the Revenue SURE income tax refund scheme (reclaim up to 41% of previous PAYE tax), and EII investor tax relief.',
      },
      {
        question:
          'Does Startup Preflight enforce the LEO 3-Quote procurement rule and laptop ban?',
        answer:
          'Yes. Module E automatically flags standard consumer laptops as ineligible for LEO grant reimbursement, calculates eligible expenditure, and organizes your 3-quote supplier schedule so your Appendix C matches Local Enterprise Office procurement rules.',
      },
      {
        question:
          'Do I need accounting or Excel experience to build the 3-year cashflow?',
        answer:
          'No. You never touch a blank spreadsheet formula. You answer plain-English questions about your price, cost per sale, hiring timeline, and overheads (with Irish Employers PRSI at 11.15% and VAT rules built in), and Module J builds your 36-month cashflow and funding gap automatically.',
      },
      {
        question: 'What is included in the 100% Free Forever tier?',
        answer:
          'Every founder gets full access to Module A (Steps 1–8) for free forever. You can brain-dump your raw idea, generate your 1-Page Concept Canvas, check .ie/.com domain availability, get a supportive AI blind-spot review, and run an instant Irish Grant Sector Pre-Check before deciding to upgrade.',
      },
      {
        question:
          'Why do LEO and Enterprise Ireland mentors recommend primary customer survey proof?',
        answer:
          'Grant evaluation committees routinely reject applications that only cite generic global industry reports. Module C generates a bias-free customer validation survey & waitlist link (startuppreflight.com/v/your-idea) so you can attach real Irish & international buyer demand directly to your application.',
      },
      {
        question: 'Can my co-founder or LEO mentor review my plan?',
        answer:
          'Yes. The Co-Founder Pass includes 3 team seats and unlocks the Module F Blind-Reveal Co-Founder Alignment Survey (12 awkward questions answered privately before comparing side-by-side). You can also export clean PDF/print packs for your LEO mentor at any time.',
      },
    ];
  }

  if (edition === 'UK') {
    return [
      {
        question:
          'Which UK startup loans, grants, and tax schemes does Startup Preflight support?',
        answer:
          'Startup Preflight prepares your business plan, financials, and supporting appendices for British Business Bank Start Up Loans (up to £25,000 per co-founder at 6% fixed interest), Innovate UK Smart & Feasibility Grants (structured into the official 9-Question IFS format), HMRC SEIS & EIS Advance Assurance packs, and UK R&D Tax Relief (ERIS/RDEC).',
      },
      {
        question:
          'Is the British Business Bank Personal Survival Budget included?',
        answer:
          'Yes. Module F includes a dedicated UK Personal Survival Budget builder that calculates your personal household income, mortgage/rent, and minimum founder draw requirements—and automatically syncs that survival draw into your 36-month cashflow in Module J.',
      },
      {
        question: 'How does the Innovate UK 9-Question compiler work?',
        answer:
          'In Module L, switching to the Innovate UK export mode maps your Module A–K inputs directly into the 9 scored IFS application sections (Need or Challenge, Approach & Innovation, Team & Resources, Market Awareness, Outcomes & Route to Market, Project Management & Work Packages, Risks, Added Value, and Costs & Value for Money).',
      },
      {
        question:
          'Do I need to know Excel to build my 3-year financial projections?',
        answer:
          'Not at all. Our guided financial engine (Modules H & J) translates plain-English answers about your pricing, unit costs, UK Employer NIC (13.8%), workplace pension (3%), and VAT threshold (£90,000) into a 36-month cashflow forecast and interactive Breakeven Sandbox.',
      },
      {
        question: 'What do I get in Module A for free?',
        answer:
          'Module A (Steps 1–8) is 100% free forever with no credit card required. In about 10 minutes, you get a structured 1-Page Concept Canvas, a supportive AI "Things to Consider" blind-spot review, a Founder-Idea Fit score, and an instant UK Funding & SEIS sector pre-check.',
      },
      {
        question:
          'How does Startup Preflight help with HMRC SEIS / EIS Advance Assurance?',
        answer:
          'Raising from UK angel investors is significantly easier when you can offer 50% SEIS income tax relief. Modules K and L verify qualifying trade rules, flag excluded activities early, and compile a structured SEIS/EIS business plan & 3-year financial forecast ready for your Advance Assurance submission.',
      },
    ];
  }

  return [
    {
      question:
        'How is Startup Preflight different from asking ChatGPT to write a business plan?',
      answer:
        'Generic AI chatbots agree with whatever you type and produce 20 pages of fluffy buzzwords with fake market numbers. Startup Preflight is a structured 12-module system ("Capture First, Expand Second"): it helps you clarify your concept, launches a real public customer survey link to gather buyer proof, aligns co-founders on 12 awkward questions, calculates true unit economics, and runs a Pre-Flight AI Contradiction Audit so your narrative and 3-year financials match.',
    },
    {
      question:
        'Do I need accounting knowledge or Excel skills to build the financial model?',
      answer:
        'Zero spreadsheets required. In Modules H and J, you simply enter your price, direct delivery costs, and expected monthly overheads. You get an interactive "Pocket Profit" breakeven chart, a What-If Sandbox (Worst-Case, Ramen Survival, and Aggressive Growth presets), and a complete 36-month cashflow projection.',
    },
    {
      question: 'What is included in the 100% Free Forever tier?',
      answer:
        'Module A (Steps 1–8) is completely free with no credit card required. You can brain-dump your raw idea in plain English, generate a 1-Page Concept Canvas, check live domain & email availability, receive a constructive AI Blind-Spot Review, and get your Founder-Idea Fit Scorecard.',
    },
    {
      question: 'How does the Co-Founder Alignment Engine (Module F) work?',
      answer:
        'Each co-founder privately answers 12 critical questions covering weekly hours, personal salary runway, cash contributions, decision-making authority, and exit expectations. Answers remain locked until both founders submit—then Startup Preflight reveals a side-by-side Alignment Heatmap so you can resolve conflicts before incorporating.',
    },
    {
      question: 'What if I get stuck on a question I cannot answer yet?',
      answer:
        'Every step includes 4 built-in guardrails: (1) a "Why Are We Asking This?" coaching card, (2) industry-tailored examples, (3) a "Use Industry Benchmark" fallback for numbers, and (4) a "Park It in Open Questions" button so you never lose momentum.',
    },
    {
      question: 'Can I test multiple startup ideas or pivot my plan later?',
      answer:
        'Yes. You can clone or pivot any existing startup plan in one click to test a new pricing model, target customer, or product direction without losing your original baseline.',
    },
  ];
}
