import 'dotenv/config';
import { eq, and } from 'drizzle-orm';
import {
  db,
  users,
  startupPlans,
  planModulesData,
  planCollaborators,
  validationSurveys,
  surveyResponses,
  openQuestionsParkingLot,
} from '../src/db/index';

async function seedStartupSidekick() {
  console.log('🚀 Seeding 100% Startup Sidekick Plan for thomaswalsh@google.com...');

  // 1. Find Thomas Walsh user
  const [thomas] = await db
    .select()
    .from(users)
    .where(eq(users.email, 'thomaswalsh@google.com'))
    .limit(1);

  if (!thomas) {
    console.error('❌ User thomaswalsh@google.com not found in database.');
    process.exit(1);
  }

  console.log(`Found user: ${thomas.name} (${thomas.id})`);

  // Check if a plan titled 'Startup Sidekick' already exists
  const existingPlans = await db
    .select()
    .from(startupPlans)
    .where(
      and(
        eq(startupPlans.ownerUserId, thomas.id),
        eq(startupPlans.title, 'Startup Sidekick')
      )
    );

  if (existingPlans.length > 0) {
    console.log(`Found existing Startup Sidekick plan (${existingPlans[0].id}). Cleaning up old plan records...`);
    await db.delete(startupPlans).where(eq(startupPlans.id, existingPlans[0].id));
  }

  const nowIso = new Date().toISOString();
  const planTitle = 'Startup Sidekick';
  const oneLinerSummary =
    'The opinionated flight simulator and supportive co-founder operating system for early-stage founders navigating validation, unit economics, and Irish/UK grants.';

  // 2. Insert into startup_plans
  const [newPlan] = await db
    .insert(startupPlans)
    .values({
      ownerUserId: thomas.id,
      tenantId: thomas.tenantId,
      title: planTitle,
      oneLinerSummary,
      industryCategory: 'B2B SaaS / AI App',
      grantEligibilitySector: 'INTERNALLY_TRADED_SERVICE',
      innovateUkResearchCategory: 'EXPERIMENTAL_DEVELOPMENT_45',
      productVehicleType: 'SOFTWARE',
      primarySalesChannel: 'WEB_SAAS',
      selectedBuildTier: 'TIER_3_CUSTOM_CODE_MANUFACTURING',
      hqCountryCode: 'IE',
      localAuthorityOrRegion: 'LEO Dublin City',
      baseCurrency: 'EUR',
      targetMarketsArray: ['IE', 'GB', 'EU'],
      targetLaunchDate: new Date('2026-03-01T00:00:00Z'),
      currentModuleStep: 'MOD_L_STEP_5',
      grantComplianceMetadataJson: {
        fundingTrackMode: 'GRANT_AND_INVESTOR',
        selectedTargetGrants: ['IE_LEO_FEASIBILITY', 'IE_LEO_PRIMING', 'EI_DIGITAL_DISCOVERY'],
        croOrCompaniesHouseNumber: '748291',
        incorporationDate: '2026-01-15',
        tradingStartDate: '2026-02-01',
        legalStructure: 'LIMITED_COMPANY',
        premisesType: 'HUB_COWORKING',
        taxClearanceAccessNumber: 'TC-99214-IE',
        vatRegistered: true,
        vatNumber: 'IE3984021TH',
        deMinimisAidPast3YearsEur: 0,
        receivingWelfareEnterpriseAllowance: false,
        moneyInvestedByFoundersToDate: 15000,
        matchFundingSource: 'OWN_SAVINGS',
        matchFundingConfirmedInBank: true,
        nonDisplacementJustification:
          'Startup Sidekick operates as an internationally exported, cloud-based B2B software platform. It does not displace local brick-and-mortar consultancies; rather, it empowers early-stage founders to independently structure their validation and financial readiness before engaging local accountants or mentors.',
        exportGrowthNarrative:
          'Our beachhead begins in Ireland with LEO and Enterprise Ireland client pipelines, with immediate cross-border expansion into the UK (Innovate UK, Start Up Loans, Growth Hubs) and English-speaking European founder communities. By Year 2, over 45% of revenue is projected from UK and international subscriptions.',
        projectRiskRegister: [
          {
            id: 'risk-1',
            category: 'TECHNICAL',
            riskDescription: 'AI hallucinations or token cost spikes on complex financial model stress-testing.',
            likelihoodScore1To5: 2,
            impactScore1To5: 3,
            mitigationStrategy: 'Hard-coded server-side daily platform ceilings (500 calls/day), deterministic fallback financial calculation models, and AES-256-GCM encrypted BYOK keys.',
          },
          {
            id: 'risk-2',
            category: 'COMMERCIAL',
            riskDescription: 'Long B2B institutional sales cycles with university incubators and accelerator batches.',
            likelihoodScore1To5: 3,
            impactScore1To5: 3,
            mitigationStrategy: 'Direct-to-founder self-serve passes (€129/€199) drive cashflow velocity and grass-roots founder demand while institutional cohort pilot licenses (€2.5k–€5k) negotiate in parallel.',
          },
          {
            id: 'risk-3',
            category: 'MANAGERIAL',
            riskDescription: 'Founder burnout as solo promoter balancing technical engineering, support, and sales.',
            likelihoodScore1To5: 3,
            impactScore1To5: 4,
            mitigationStrategy: 'Automated Stripe billing and onboarding, self-serve micro-coaching cards, and scheduled Year 2 Customer Success hire budgeted in Module F/J.',
          },
          {
            id: 'risk-4',
            category: 'ENVIRONMENTAL',
            riskDescription: 'Changes to Irish LEO / Enterprise Ireland grant application templates or UK subsidy control rules.',
            likelihoodScore1To5: 2,
            impactScore1To5: 3,
            mitigationStrategy: 'Modular architecture where country rules and grant criteria are separated into config directories updated within 24 hours of official scheme changes.',
          },
        ],
        advisorsDirectory: {
          bankNameAndBranch: 'Revolut Business (Ireland IBAN) / AIB Grafton Street',
          accountantFirm: 'O’Brien & Associates Chartered Certified Accountants, Dublin 2',
          solicitorFirm: 'Flynn O’Driscoll Business Lawyers, Dublin',
          insuranceBroker: 'Hiscox Europe / Arachas Corporate Brokers',
        },
        projectedJobsTable: {
          currentFullTime: 1,
          currentPartTime: 0,
          year1NewFullTime: 1,
          year2NewFullTime: 2,
          year3NewFullTime: 2,
        },
        grantExpenditureSchedule: [
          {
            id: 'item-1',
            itemDescription: 'Market validation & Mom Test survey panel recruitment (300 verified founders)',
            category: 'FEASIBILITY_OWN_LABOUR',
            netCostExVat: 6500,
            isExcludedMobileAsset: false,
          },
          {
            id: 'item-2',
            itemDescription: 'Specialist legal advice for Terms of Service, GDPR data residency & IP protection',
            category: 'CONSULTANCY_SUBCONTRACTOR',
            netCostExVat: 4500,
            isExcludedMobileAsset: false,
          },
          {
            id: 'item-3',
            itemDescription: 'Grant application rules engine development & UK/IE schema localization audit',
            category: 'FEASIBILITY_OWN_LABOUR',
            netCostExVat: 9500,
            isExcludedMobileAsset: false,
          },
          {
            id: 'item-4',
            itemDescription: 'Design prototype usability testing & interactive financial canvas UI verification',
            category: 'MATERIALS',
            netCostExVat: 3500,
            isExcludedMobileAsset: false,
          },
        ],
      },
    })
    .returning();

  console.log(`Created Startup Plan: ${newPlan.id}`);

  // 3. Insert plan collaborator (Thomas Walsh)
  await db.insert(planCollaborators).values({
    planId: newPlan.id,
    userId: thomas.id,
    invitedEmail: thomas.email,
    inviteAccepted: true,
    role: 'OWNER',
    promoterBackgroundProfileJson: {
      educationAndQualifications: 'B.Sc. in Computer Science & Software Engineering. Advanced training in full-stack cloud systems, distributed databases, and product UX.',
      relevantTrainingCourses: 'Local Enterprise Office Start Your Own Business (SYOB) Programme, Enterprise Ireland New Frontiers Phase 1 Workshops.',
      workAndSelfEmploymentHistory: 'Over 8 years of practical experience building and scaling software products. Experienced in technical architecture, modern TypeScript/Next.js frameworks, API design, and founder customer discovery.',
      compiled150WordNarrative:
        'Thomas Walsh is an experienced software engineer and product builder with over 8 years of hands-on experience designing, shipping, and scaling web applications. Having worked directly alongside early-stage startups and experienced firsthand the frustrating, bureaucratic friction of applying for state enterprise support and grant funding, Thomas conceived and architected Startup Sidekick. His background combines deep technical engineering expertise (full-stack TypeScript, PostgreSQL, secure authentication, and generative AI guardrails) with a pragmatic, customer-led product philosophy. He completed the Local Enterprise Office Start Your Own Business programme and has personally conducted in-depth discovery interviews with dozens of early-stage Irish and UK founders. As Founder and Chief Executive Promoter, Thomas leads all product roadmap engineering, system architecture, and strategic growth initiatives.',
      cvReadyForAppendixD: true,
      cvFileName: 'Thomas_Walsh_Executive_CV.pdf',
      cvFileSizeBytes: 184500,
      cvUploadedAt: nowIso,
    },
    personalSurvivalBudgetJson: {
      monthlyMortgageOrRent: 1450,
      monthlyCouncilTaxAndUtilities: 280,
      monthlyFoodAndHousehold: 420,
      monthlyTransportAndCarLoans: 180,
      monthlyPersonalDebtsAndChildcare: 0,
      monthlyOtherPersonalIncome: 0,
      calculatedMinimumMonthlyDrawingsNeeded: 2330,
    },
    assignedHatsArray: ['VISION', 'PRODUCT', 'TECH', 'FINANCE'],
    alignmentInterviewCompleted: true,
    alignmentInterviewAnswersJson: {
      mediaSpokesperson: 'Thomas Walsh is the sole official spokesperson for product, technical architecture, and press.',
      willingToRelocate: 'Based in Dublin, Ireland with frequent travel to London and regional UK innovation hubs.',
      weeklyHoursCommitment: 'Full-time commitment (50+ hours/week dedicated exclusively to Startup Sidekick).',
      dayJobQuitMilestone: 'Already 100% full-time on the project.',
      personalRunwayMonths: 14,
      minimumMonthlySalaryNeeded: 2400,
      dayOneCashContribution: 15000,
      earlyExit2MDecision: 'Focus on building a durable, profitable €5M+ ARR European SaaS business; open to strategic acquisition if aligned with founder mission.',
      hireFriendsAndFamilyRule: 'Strict merit-based hiring only with standard probationary reviews.',
      pivotCommittedIfIdeaFails: 'Fully committed to the founder-enablement problem space, iterating product vehicles until product-market fit is indisputable.',
      underperformanceEquityRule: 'Standard 4-year reverse vesting with 1-year cliff for any future co-founders or key hires.',
      deadlockResolutionMethod: 'Founder holding majority voting equity maintains final operational decision authority.',
    },
    proposedEquityPercent: '100.00',
    vestingScheduleMonths: 48,
    cliffMonths: 12,
  });

  // 4. Insert Validation Survey (Module C)
  const [survey] = await db
    .insert(validationSurveys)
    .values({
      planId: newPlan.id,
      title: 'Early-Stage Founder Validation & Grant Hurdles Survey',
      publicSlug: `startup-sidekick-founder-survey-${Date.now().toString(36)}`,
      introDescription: 'Help us de-risk startup planning and fix the grant consultant racket for early-stage founders.',
      isActive: true,
      collectLeadEmails: true,
      waitlistIncentiveText: 'Get early access to Startup Sidekick + free pre-flight grant checklist',
      questionsJsonb: [
        {
          id: 'q1',
          questionText: 'When working on your business plan or grant application, what has been your single biggest operational headache?',
          type: 'MULTIPLE_CHOICE',
          options: [
            'Dread of building financial projections & cashflow forecasts in Excel',
            'Understanding complex grant rules (e.g. LEO match-funding, ineligible laptop costs)',
            'Getting honest, bias-free feedback from target customers before spending money',
            'Dealing with co-founder role splits and equity vesting conversations',
            'Paying €3k–€8k to grant consultants who write generic AI-generated fluff',
          ],
          allowOther: true,
          momTestPassed: true,
          momTestFeedback: 'Focuses directly on past operational friction and concrete founder pain points.',
        },
        {
          id: 'q2',
          questionText: 'How much money or consulting spend have you already put toward business planning, financial modeling, or grant applications?',
          type: 'MULTIPLE_CHOICE',
          options: [
            '€0 (just burning our own late-night hours and stress)',
            '€100 – €500 (books, software templates, basic online courses)',
            '€500 – €2,500 (accountants for forecasts, small freelance reviews)',
            '€2,500 – €7,500+ (professional grant writers or advisory consultancies)',
          ],
          allowOther: true,
          momTestPassed: true,
          momTestFeedback: 'Measures verified past economic commitments rather than speculative hypothetical willingness.',
        },
        {
          id: 'q3',
          questionText: 'Have you ever tested your pricing and unit economics with real prospective customers prior to submitting a funding application?',
          type: 'MULTIPLE_CHOICE',
          options: [
            'No, we pulled our prices from competitor websites or guessed',
            'We asked friends and family (who told us it sounded great)',
            'Yes, we secured paid pre-orders or signed Letters of Intent',
            'We ran a Mom Test customer survey focused on past spending behaviors',
          ],
          allowOther: true,
          momTestPassed: true,
        },
        {
          id: 'q4',
          questionText: 'On a scale of 1 to 5, how confident are you that your current financial forecast reconciles with your payroll and grant rules?',
          type: 'SCALE_1_5',
          scaleMinLabel: 'Completely unconfident (formulas are fragile)',
          scaleMaxLabel: '100% audit-proof (ready for a strict assessor)',
          momTestPassed: true,
        },
        {
          id: 'q5',
          questionText: 'If an opinionated software tool guided you through the exact 12 steps required for LEO/Enterprise Ireland or Innovate UK and highlighted blind spots automatically, what would you expect to pay for 6 months of full access?',
          type: 'MULTIPLE_CHOICE',
          options: [
            '€99 – €149 one-off (Solo Founder Pass)',
            '€199 – €249 (Co-Founder Pass with multi-seat alignment interviews)',
            '€29/month subscription',
            'Would prefer our university incubator or local enterprise office to license it for our cohort',
          ],
          allowOther: true,
          momTestPassed: true,
        },
      ],
      outreachTemplatesJsonb: {
        linkedinDm: 'Fellow founders: after watching yet another great team get rejected for a LEO Feasibility grant because of easily avoidable spreadsheet errors and ineligible equipment line items, we built Startup Sidekick. We are stress-testing the flight simulator—would love 3 mins of your honest feedback!',
        coldEmailSubject: 'Quick question on your LEO/Innovate UK grant experience',
        coldEmailBody: 'Hi [Name],\n\nSaw you are building [Startup] in Dublin. I’m an engineer working on a tool to help founders bypass the €5k grant consultant racket and build audit-proof business plans without spreadsheets.\n\nCould I ask 3 quick questions about your biggest headache with financial forecasts?\n\nBest,\nThomas',
        whatsappBlurb: 'Hey! Quick favor—building a founder operating system that cuts out the BS in grant applications and financial models. Mind taking 2 mins on this Mom Test survey? Would mean the world: [Link]',
      },
      interviewLogsJsonb: [
        {
          id: 'int-1',
          intervieweeNameOrRole: 'Cian Kelly (Founder, MedTech IoT Devices, Galway)',
          date: '2026-01-20',
          channel: 'ZOOM_VIDEO',
          painScore1To5: 5,
          commitmentOutcome: 'ASKED_TO_PILOT_OR_BUY',
          rawNotes: 'Cian applied for LEO Feasibility in September. Spent €3,800 on a Dublin grant writer who delivered a 48-page Word doc. The assessor tore it apart in 10 minutes because the cashflow had circular formulas and included iPads which are excluded from LEO equipment claims.',
          keyTakeaway: 'Excluding laptops/mobile hardware and validating cashflow integrity are critical must-haves for founders.',
          verbatimQuote: 'If I had a tool that literally gave me a red alert saying "You cannot claim mobile laptops/iPads in LEO Section 6", it would have saved me 4 months of wasted time.',
          workaroundAndSpend: 'Spent €3,800 out-of-pocket on consulting with zero grant outcome.',
          signalBadge: 'STRONG_SIGNAL',
        },
        {
          id: 'int-2',
          intervieweeNameOrRole: 'Aisling Murphy (Co-Founder, Sustainable Packaging SaaS, Dublin)',
          date: '2026-01-28',
          channel: 'IN_PERSON_COFFEE',
          painScore1To5: 5,
          commitmentOutcome: 'SHARED_DEEP_WORKFLOW_PAIN',
          rawNotes: 'Aisling and her technical co-founder had a major falling out 6 months in because they never agreed on salary expectations or equity vesting. She assumed they were both working 50 hours a week for free; he needed €2,500/month after month 3 to pay his mortgage.',
          keyTakeaway: 'Blind-reveal co-founder alignment prevents fatal team fallouts before incorporation.',
          verbatimQuote: 'Nobody wants to ask the awkward questions out loud. If the software forces both of us to answer secretly and only reveals the heat-map when both submit, that saves startups from imploding.',
          workaroundAndSpend: 'Lost 4 months of engineering momentum due to co-founder split.',
          signalBadge: 'STRONG_SIGNAL',
        },
        {
          id: 'int-3',
          intervieweeNameOrRole: 'Dr. Liam O’Connor (Programme Director, University Spinout Accelerator)',
          date: '2026-02-04',
          channel: 'ZOOM_VIDEO',
          painScore1To5: 4,
          commitmentOutcome: 'ASKED_TO_PILOT_OR_BUY',
          rawNotes: 'Liam oversees 24 spinout teams a year. Mentors spend excessive time marking up messy, contradictory business plans where revenue models do not match unit pricing.',
          keyTakeaway: 'University accelerators are eager to license cohort seats at €2.5k–€5k per batch.',
          verbatimQuote: 'We would happily pay €3,000 to €5,000 per cohort to give all 24 founders access to Startup Sidekick so they arrive at mentor sessions with clean, coherent numbers.',
          workaroundAndSpend: 'Accelerator spends €20k/year on external financial modeling workshops.',
          signalBadge: 'STRONG_SIGNAL',
        },
      ],
      aiInsightsSummaryJsonb: {
        totalResponsesCount: 8,
        analyzedAt: nowIso,
        topThreePainThemes: [
          'Spreadsheet dread: 82% of founders report spending weeks fighting Excel cashflow templates with zero confidence in their formulas.',
          'Grant rule blind spots: Rejection or clawbacks due to simple technical mistakes (un-vouched equipment, excluded laptops, missing 150-word promoter bios).',
          'Co-founder misalignment: Founders avoid discussing personal survival runways, salaries, and vesting schedules until crisis hits.',
        ],
        pricingWillingnessConclusion:
          'High willingness to pay for a one-off 6-month pass between €129 and €199, perceived as a 95% discount compared to hiring traditional €3,000+ grant consultants. Strong secondary demand from university incubators for cohort licenses at €2,500–€5,000.',
        recommendedV1Priorities: [
          'Keep the Pocket Profit 3-Year Breakeven visual and interactive with zero raw formula editing.',
          'Double down on the automated Pre-Flight Contradiction Audit (Module L) highlighting mismatches before submission.',
          'Provide instant export of official LEO and UK Innovate UK grant forms.',
        ],
      },
    })
    .returning();

  // Insert realistic survey responses
  const sampleResponses = [
    {
      answersJsonb: {
        q1: { selectedOption: 'Dread of building financial projections & cashflow forecasts in Excel' },
        q2: { selectedOption: '€500 – €2,500 (accountants for forecasts, small freelance reviews)' },
        q3: { selectedOption: 'No, we pulled our prices from competitor websites or guessed' },
        q4: { scaleValue: 2 },
        q5: { selectedOption: '€199 – €249 (Co-Founder Pass with multi-seat alignment interviews)' },
      },
      respondentEmail: 'ciara.founder@dublintech.ie',
      joinedWaitlist: true,
      source: 'ORGANIC',
      submittedAt: new Date(Date.now() - 86400000 * 6),
    },
    {
      answersJsonb: {
        q1: { selectedOption: 'Paying €3k–€8k to grant consultants who write generic AI-generated fluff' },
        q2: { selectedOption: '€2,500 – €7,500+ (professional grant writers or advisory consultancies)' },
        q3: { selectedOption: 'We asked friends and family (who told us it sounded great)' },
        q4: { scaleValue: 1 },
        q5: { selectedOption: '€99 – €149 one-off (Solo Founder Pass)' },
      },
      respondentEmail: 'mark@corkartisans.com',
      joinedWaitlist: true,
      source: 'ORGANIC',
      submittedAt: new Date(Date.now() - 86400000 * 5),
    },
    {
      answersJsonb: {
        q1: { selectedOption: 'Understanding complex grant rules (e.g. LEO match-funding, ineligible laptop costs)' },
        q2: { selectedOption: '€0 (just burning our own late-night hours and stress)' },
        q3: { selectedOption: 'We ran a Mom Test customer survey focused on past spending behaviors' },
        q4: { scaleValue: 3 },
        q5: { selectedOption: '€99 – €149 one-off (Solo Founder Pass)' },
      },
      respondentEmail: 'niamh@belfastfintech.co.uk',
      joinedWaitlist: true,
      source: 'ORGANIC',
      submittedAt: new Date(Date.now() - 86400000 * 4),
    },
    {
      answersJsonb: {
        q1: { selectedOption: 'Dealing with co-founder role splits and equity vesting conversations' },
        q2: { selectedOption: '€100 – €500 (books, software templates, basic online courses)' },
        q3: { selectedOption: 'No, we pulled our prices from competitor websites or guessed' },
        q4: { scaleValue: 2 },
        q5: { selectedOption: '€199 – €249 (Co-Founder Pass with multi-seat alignment interviews)' },
      },
      respondentEmail: 'conor.health@galwaymed.ie',
      joinedWaitlist: true,
      source: 'ORGANIC',
      submittedAt: new Date(Date.now() - 86400000 * 3),
    },
    {
      answersJsonb: {
        q1: { selectedOption: 'Dread of building financial projections & cashflow forecasts in Excel' },
        q2: { selectedOption: '€500 – €2,500 (accountants for forecasts, small freelance reviews)' },
        q3: { selectedOption: 'Yes, we secured paid pre-orders or signed Letters of Intent' },
        q4: { scaleValue: 4 },
        q5: { selectedOption: 'Would prefer our university incubator or local enterprise office to license it for our cohort' },
      },
      respondentEmail: 'spinout.lead@ucd.ie',
      joinedWaitlist: true,
      source: 'ORGANIC',
      submittedAt: new Date(Date.now() - 86400000 * 2),
    },
    {
      answersJsonb: {
        q1: { selectedOption: 'Understanding complex grant rules (e.g. LEO match-funding, ineligible laptop costs)' },
        q2: { selectedOption: '€0 (just burning our own late-night hours and stress)' },
        q3: { selectedOption: 'No, we pulled our prices from competitor websites or guessed' },
        q4: { scaleValue: 2 },
        q5: { selectedOption: '€99 – €149 one-off (Solo Founder Pass)' },
      },
      respondentEmail: 'eoin@cleantechshannon.ie',
      joinedWaitlist: true,
      source: 'ORGANIC',
      submittedAt: new Date(Date.now() - 86400000 * 1),
    },
  ];

  for (const resp of sampleResponses) {
    await db.insert(surveyResponses).values({
      surveyId: survey.id,
      answersJsonb: resp.answersJsonb,
      respondentEmail: resp.respondentEmail,
      joinedWaitlist: resp.joinedWaitlist,
      source: resp.source,
      submittedAt: resp.submittedAt,
    });
  }

  // 5. Populate All 12 Modules (MOD_A to MOD_L) in plan_modules_data
  console.log('Seeding 12 Modules in plan_modules_data...');

  // --- MODULE A: IDEATION & CONCEPT CANVAS (100%) ---
  await db.insert(planModulesData).values({
    planId: newPlan.id,
    moduleCode: 'MOD_A_IDEATION',
    completionPercentage: 100,
    structuredInputsJsonb: {
      brainDumpText:
        'First-time founders waste 3 to 6 months and thousands of euros paying consultancies to write generic, 40-page business plans that assessors see right through. They get stuck in financial spreadsheets with circular references and make simple, fatal mistakes on grant rules like asking for laptops or guessing PRSI rates. We built Startup Sidekick as an opinionated, step-by-step flight simulator. It captures their vision without jargon, stress-tests their unit economics visually, runs bias-free Mom Test surveys, tests co-founder alignment secretly, and auto-compiles official grant-ready applications for LEO, Enterprise Ireland, and UK Innovate UK with a pre-flight contradiction audit.',
      conceptCanvas: {
        problem: 'Early-stage founders face overwhelming bureaucracy, conflicting advice, and spreadsheet dread when preparing business plans and grant submissions. Over 60% of grant applications are rejected due to simple errors in unit economics, ineligible expenditure line items, or unvalidated market demand.',
        solution: 'An opinionated founder operating system and flight simulator that guides teams through 12 structured micro-steps. Replaces static text boxes with interactive calculators, automated grant compliance rules, Mom Test survey engines, and contradiction auditing.',
        targetCustomer: 'First-time tech, hybrid, and productized service founders in Ireland & the UK preparing for validation, pre-seed funding, or government grants (LEO Feasibility/Priming, Enterprise Ireland, Innovate UK).',
        uniqueAdvantage: 'Deep multi-jurisdictional underwriting logic built directly into the UI (Irish LEO 3-quote rules, de minimis caps, UK MFA limits, SEIS rules) + visual Pocket Profit breakeven sandbox + live Mom Test survey engine.',
        channels: 'Direct digital founder passes, university accelerator & incubator batch licenses (UCD, Trinity, NDRC), and Local Enterprise Office mentor referral networks.',
        revenueModel: '€129 Solo Pass & €199 Co-Founder 6-month passes, €9/month Living Vault micro-subscription, €2,500–€5,000 cohort accelerator licenses, and ancillary incorporation/banking partner referral fees.',
        costStructure: 'Zero inventory. Ultra-lean cloud infrastructure (Vercel, Google Cloud Run, Cloud SQL, Resend), strict capped AI usage ceiling (500 platform calls/day), and founder-led product execution.',
        keyMetrics: 'Monthly active plans, module completion rates (target >75% vs. industry 15%), customer survey responses gathered per founder, and grant approval success rate.',
      },
      founderMotivation: {
        motivationType: 'PROFESSIONAL_BACKGROUND',
        otherMotivationText: '',
        hoursPerWeek: 'FULL_TIME_PLUS',
        urgencyTimeline: 'LAUNCH_UNDER_30_DAYS',
        founderStory:
          'Having watched countless brilliant engineers and creative founders lose heart and burn thousands of euros on outdated business planning templates and predatory grant writers, I decided to build the exact software I wish had existed when I started out. Startup Sidekick transforms an intimidating, bureaucratic hurdle into a sharp, energizing founder superpower.',
      },
      teamAndBudget: {
        teamStructure: 'SOLO',
        otherTeamStructureText: '',
        skillCoverage: 'FULL_TECHNICAL_AND_PRODUCT',
        startingBudget: 'BRACKET_10K_TO_25K',
        budgetNotes: 'Self-funded €15,000 initial founder equity runway for cloud infrastructure, legal formation, and marketing validation.',
      },
      founderRealityCheck: {
        connectionLevel: 'STRONG_INDUSTRY_NETWORK',
        incomeUrgency: 'COMFORTABLE_12_MONTHS',
        dealbreaker: 'MISSION_AND_CULTURE',
        growthPreference: 'BALANCED_PROFITABLE_GROWTH',
        biggestWorry: 'CUSTOMER_ACQUISITION_SPEED',
        notes: 'Founder possesses 14+ months of personal runway, eliminating premature desperation and allowing total focus on customer delight and product rigor.',
      },
      grantEligibilityCheck: {
        selectedSector: 'INTERNALLY_TRADED_SERVICE',
        targetGrants: ['IE_LEO_FEASIBILITY', 'IE_LEO_PRIMING', 'EI_DIGITAL_DISCOVERY'],
        croIncorporated: true,
        matchFundingConfirmed: true,
      },
    },
    aiThingsToConsiderJsonb: [
      {
        id: 'ttc-a1',
        title: 'Institutional Sales Cycles vs. Founder Velocity',
        category: 'COMMERCIAL',
        observation: 'University incubators move slowly (quarterly budget approvals). Ensure direct-to-founder self-serve passes remain your primary cash engine in Year 1.',
        suggestedAction: 'Keep the €129/€199 Stripe checkout front-and-centre on the public landing page while pursuing enterprise cohort pilots.',
      },
      {
        id: 'ttc-a2',
        title: 'Maintaining Human Voice in AI Outputs',
        category: 'PRODUCT',
        observation: 'Assessors penalize generic ChatGPT buzzwords instantly. Retain the "Capture First, Expand Second" standard so the founder’s authentic words are never replaced by generic prose.',
        suggestedAction: 'Ensure all AI coaching prompts remain grounded in plain-spoken founder terminology.',
      },
    ],
  });

  // --- MODULE B: MARKET, COMPETITORS & TAM/SAM/SOM (100%) ---
  await db.insert(planModulesData).values({
    planId: newPlan.id,
    moduleCode: 'MOD_B_MARKET',
    completionPercentage: 100,
    structuredInputsJsonb: {
      beachhead: {
        personaName: 'Early-Stage Pre-Seed Founder (Ciara)',
        personaJobTitle: 'Founder & CEO (First-time or early second-time)',
        industryVertical: 'Technology, Productized Services & Innovative SMBs',
        targetGeography: 'Ireland & UK (expanding to English-speaking EU)',
        demographicProfile: 'Ages 26–48, tech-literate, motivated by ownership, highly protective of cash runway.',
        coreProblemToSolve:
          'Overwhelmed by confusing grant application requirements and terrified of spreadsheet errors. Needs a concrete, credible business plan for an upcoming LEO Feasibility, Enterprise Ireland, or Innovate UK deadline without paying €5k to an external consultant.',
        budgetAuthorityNotes: 'Has discretionary authority over company formation and planning spend up to €500 without committee approval.',
      },
      competitorsAndStatusQuo: {
        workaroundFrustrationNotes:
          'Founders currently stitch together messy Google Sheets templates from Reddit, pay €3,000+ to grant writing agencies, or ask generic ChatGPT prompts that invent fake financial formulas and hallucinate ineligible grant items.',
        competitors: [
          {
            id: 'c1',
            name: 'Generic AI (ChatGPT / Claude / Copilot)',
            category: 'INDIRECT_ALTERNATIVE',
            typicalPriceText: '€20/month',
            whatTheyDoWell: 'Rapid text generation and infinite patience.',
            whereTheyFallShort:
              'Hallucinates financial calculations, circular formulas, has zero context on Irish LEO 3-quote rules or laptop bans, and generates detectable robotic prose that grant assessors instantly reject.',
          },
          {
            id: 'c2',
            name: 'Outdated Planning Software (LivePlan / Bizplan)',
            category: 'DIRECT_COMPETITOR',
            typicalPriceText: '€20–€40/month',
            whatTheyDoWell: 'Long-standing brand presence and basic accounting integrations.',
            whereTheyFallShort:
              'US-centric architecture built in 2008. Clunky 40-page document approach with zero Mom Test survey integration, zero co-founder alignment tooling, and zero awareness of European/UK grant programs.',
          },
          {
            id: 'c3',
            name: 'Boutique Grant Writers & Consultancies',
            category: 'STATUS_QUO',
            typicalPriceText: '€3,000 – €8,000 upfront + 10% success fee',
            whatTheyDoWell: 'Hands-off done-for-you experience for founders with large budgets.',
            whereTheyFallShort:
              'Extremely expensive for pre-revenue founders. Often copy-paste generic templates. Founders cannot defend the plan in committee interviews because they didn’t build the numbers themselves.',
          },
        ],
        whySwitchEdges: ['SAVES_TIME_AUTOMATIC', 'BUILT_FOR_LOCAL_MARKET', 'CHEAPER_MORE_TRANSPARENT', 'NO_MORE_SPREADSHEETS'],
        whySwitchOneSentence:
          'Startup Sidekick replaces €5,000 grant consultant fees and brittle Excel spreadsheets with an opinionated, step-by-step flight simulator built specifically for Irish and UK grant criteria.',
      },
      marketSizing: {
        segments: [
          {
            id: 'seg-1',
            segmentName: 'Ireland Active Early-Stage Founders (LEO & EI Pipeline)',
            billingCadence: 'ONE_OFF_PASS',
            pricePerCustomerInput: '160',
            year1To2CustomerGoalInput: '450',
            reachableCustomersInTargetMarketsInput: '5200',
          },
          {
            id: 'seg-2',
            segmentName: 'UK Early-Stage Tech & Innovate UK Applicants',
            billingCadence: 'ONE_OFF_PASS',
            pricePerCustomerInput: '160',
            year1To2CustomerGoalInput: '800',
            reachableCustomersInTargetMarketsInput: '32000',
          },
          {
            id: 'seg-3',
            segmentName: 'University & Accelerator Cohort Enterprise Licenses',
            billingCadence: 'COHORT_LICENSE',
            pricePerCustomerInput: '3500',
            year1To2CustomerGoalInput: '12',
            reachableCustomersInTargetMarketsInput: '180',
          },
        ],
        widerMarketMultiplier: '15X',
        sourceAndAssumptionNotes:
          'Based on official CRO and Companies House incorporation data (over 22,000 new LTDs formed annually in Ireland and 700,000 in the UK, with ~5% representing scalable tech and innovative service ventures eligible for state enterprise support).',
      },
      competitiveWedge: {
        comparisonRows: [
          {
            rowId: 'row-us',
            label: 'Startup Sidekick',
            isYourStartup: true,
            priceValueScore: 'HIGH',
            speedTimeSavedScore: 'HIGH',
            easeOfUseScore: 'HIGH',
            specialistQualityScore: 'HIGH',
          },
          {
            rowId: 'row-consultants',
            label: 'Grant Consultancies (€5k)',
            isYourStartup: false,
            priceValueScore: 'LOW',
            speedTimeSavedScore: 'MEDIUM',
            easeOfUseScore: 'MEDIUM',
            specialistQualityScore: 'MEDIUM',
          },
          {
            rowId: 'row-liveplan',
            label: 'LivePlan / US Templates',
            isYourStartup: false,
            priceValueScore: 'MEDIUM',
            speedTimeSavedScore: 'LOW',
            easeOfUseScore: 'LOW',
            specialistQualityScore: 'LOW',
          },
        ],
        switchingFrictionReducers: ['FREE_TRIAL_OR_FIRST_STEP', 'FAST_SETUP_UNDER_15_MINS', 'INSTANT_AUDIT_REPORT'],
        switchingFrictionPlanNotes:
          'Module A (1-Page Concept Canvas & Grant Sector Pre-Check) is 100% free with zero paywall, allowing founders to immediately extract their vision and experience instant value before unlocking full grant compliance modules.',
        unfairAdvantages: ['LOCAL_COMPLIANCE_OR_GRANTS', 'FOUNDER_INSIDER_EXPERIENCE', 'PROPRIETARY_RULE_ENGINE'],
        competitiveEdgeSummary:
          'We do not offer a blank word processor. We provide an active underwriting engine with hard-coded Irish and UK compliance rules, eliminating spreadsheet dread and giving founders institutional-grade confidence.',
      },
    },
    aiThingsToConsiderJsonb: [],
  });

  // --- MODULE C: SURVEYS & CUSTOMER VALIDATION (100%) ---
  await db.insert(planModulesData).values({
    planId: newPlan.id,
    moduleCode: 'MOD_C_SURVEYS_FEEDBACK',
    completionPercentage: 100,
    structuredInputsJsonb: {
      surveys: [
        {
          id: survey.id,
          planId: newPlan.id,
          publicSlug: survey.publicSlug,
          title: survey.title,
          introDescription: survey.introDescription || '',
          isActive: true,
          collectLeadEmails: true,
          waitlistIncentiveText: survey.waitlistIncentiveText || '',
          focusAreas: ['PROBLEM_AND_PAIN', 'CURRENT_WORKAROUNDS'],
          questions: survey.questionsJsonb,
          responses: sampleResponses.map((r, i) => ({
            id: `resp-${i + 1}`,
            surveyId: survey.id,
            answers: r.answersJsonb,
            respondentEmail: r.respondentEmail,
            joinedWaitlist: r.joinedWaitlist,
            submittedAt: r.submittedAt.toISOString(),
          })),
          outreachTemplates: survey.outreachTemplatesJsonb,
          interviewLogs: survey.interviewLogsJsonb,
          aiInsightsSummary: survey.aiInsightsSummaryJsonb,
          createdAt: nowIso,
          updatedAt: nowIso,
        },
      ],
      activeSurveyId: survey.id,
      interviewLogs: survey.interviewLogsJsonb,
    },
    aiThingsToConsiderJsonb: [],
  });

  // --- MODULE D: PRODUCT BUILD & WORK PACKAGES (100%) ---
  await db.insert(planModulesData).values({
    planId: newPlan.id,
    moduleCode: 'MOD_D_PRODUCT_BUILD',
    completionPercentage: 100,
    structuredInputsJsonb: {
      productVehicle: {
        productTrack: 'SAAS_SOFTWARE_AI',
        formFactor: 'WEB_PLATFORM',
        v1PrototypeApproach: 'FOCUSED_FULL_CODE_V1',
        launchTimeline: 'IMMEDIATE_READY',
        ahaMomentNarrative:
          'The founder enters their high-level business concept, and within 3 minutes the platform displays their interactive Pocket Profit breakeven crossover graph, pre-populates their target grant checklist, and flags 2 immediate blind spots without touching a spreadsheet.',
        whyThisVehicleFitsCustomer:
          'Early-stage founders work across laptops and desktop monitors where information density, side-by-side financial tables, and PDF export reviews require a responsive desktop-first web application.',
      },
      channelMatrix: {
        primaryChannel: 'WEB_SAAS',
        channelRationale: 'Direct self-serve web checkout minimizes friction and gives founders immediate 24/7 access to their living workspace.',
        ownVsRentStrategy: '100% owned domain (startuppreflight.com / startupsidekick.com) with zero third-party app store commissions (avoiding Apple/Google 30% take-rates).',
      },
      scopeFilter: {
        ruthlessV1Features: [
          '12 Collapsible Guided Modules with micro-coaching and jargon tooltips',
          'Interactive Pocket Profit 3-Year Breakeven Engine (two-way synced)',
          'Mom Test Public Customer Survey & Waitlist Page Generator',
          'Blind-Reveal Co-Founder 12-Question Alignment Engine',
          'Pre-Flight Contradiction & Grant Compliance Auditor (Module L)',
          'Official PDF Brief & Grant Dossier Export Binder',
        ],
        cutForV2Roadmap: [
          'Direct bank API open-banking reconciliation (deferred to Month 12)',
          'Automated AI pitch deck slide generator (deferred to V2)',
          'Multi-language localization outside English (Spanish/German deferred)',
        ],
      },
      buildVsBuy: {
        buildComponents: 'Core 12-module workflow engine, Pocket Profit financial mechanics, grant rules evaluator, contradiction audit logic.',
        buyOrLeverageComponents: 'PostgreSQL + Drizzle ORM, Better-Auth session management, Stripe billing, Google GenAI SDK (Vertex AI), Resend email delivery.',
        rationale: 'Focus in-house engineering strictly on the unique domain logic of startup validation and grant underwriting while relying on rock-solid managed infrastructure for plumbing.',
      },
      workPackagesAndFlow: {
        packages: [
          {
            wpNumber: 'WP1',
            title: 'Foundational 12-Module Structured Extraction Engine & UX',
            startMonth: 1,
            endMonth: 2,
            leadPartnerOrRole: 'Thomas Walsh (Technical Lead)',
            deliverablesSummary: 'Complete responsive React/Next.js workspace with collapsible steps, jargon tooltips, and state persistence in PostgreSQL.',
            allocatedLabourCost: 9500,
          },
          {
            wpNumber: 'WP2',
            title: 'Interactive Pocket Profit & Multi-Year Cashflow Engine',
            startMonth: 2,
            endMonth: 3,
            leadPartnerOrRole: 'Thomas Walsh (Technical Lead)',
            deliverablesSummary: 'Dual-axis crossover graph, 3-year P&L projection model, working capital timing calculators, and non-destructive sandbox presets.',
            allocatedLabourCost: 8500,
          },
          {
            wpNumber: 'WP3',
            title: 'IE LEO & UK Innovate UK Grant Rules & Compliance Module',
            startMonth: 3,
            endMonth: 4,
            leadPartnerOrRole: 'Thomas Walsh + Specialist Advisory Subcontractor',
            deliverablesSummary: 'Comprehensive underwriting database covering LEO Feasibility/Priming, Enterprise Ireland, UK Innovate UK, Start Up Loans, and SEIS.',
            allocatedLabourCost: 7500,
          },
          {
            wpNumber: 'WP4',
            title: 'Pre-Flight Contradiction Audit & Document Dossier Compiler',
            startMonth: 4,
            endMonth: 5,
            leadPartnerOrRole: 'Thomas Walsh (Technical Lead)',
            deliverablesSummary: 'Automated cross-module validation engine detecting narrative-vs-financial discrepancies, producing verified LEO Appendices A–F.',
            allocatedLabourCost: 8500,
          },
        ],
      },
    },
    aiThingsToConsiderJsonb: [],
  });

  // --- MODULE E: OPERATIONS & RISK REGISTER (100%) ---
  await db.insert(planModulesData).values({
    planId: newPlan.id,
    moduleCode: 'MOD_E_OPERATIONS',
    completionPercentage: 100,
    structuredInputsJsonb: {
      operationsBlueprint: {
        fulfillmentMode: 'AUTOMATED_CLOUD_SELF_SERVE',
        turnaroundSla: 'INSTANT_UNDER_5_MINS',
        capacityConstraint: 'FOUNDER_MANUAL_HOURS',
        weeklyOpsHoursAllocated: 12,
        orderLifecycleStages: [
          {
            id: 'st-1',
            stageNumber: 1,
            stageTitle: 'Instant Self-Serve Checkout & Onboarding',
            ownerType: 'AUTOMATED_SYSTEM',
            whatHappensStepByStep: 'Founder selects Solo or Co-Founder pass, completes payment via Stripe Checkout. Webhook immediately provisions user entitlements in PostgreSQL and redirects to workspace.',
            toolsEquipmentOrSupplier: 'Stripe, Next.js Server Actions, PostgreSQL',
            activeMinutesPerOrder: 0,
            directVariableCostPerOrder: 4.5,
          },
          {
            id: 'st-2',
            stageNumber: 2,
            stageTitle: 'Guided Workspace Execution & AI Sidekick',
            ownerType: 'AUTOMATED_SYSTEM',
            whatHappensStepByStep: 'Founder progresses through Modules A–L. Server-side AI router processes micro-coaching and Mom Test checks with automatic prompt truncation and rate limits.',
            toolsEquipmentOrSupplier: 'Google GenAI SDK (Vertex AI), Redis burst limiter',
            activeMinutesPerOrder: 0,
            directVariableCostPerOrder: 1.8,
          },
          {
            id: 'st-3',
            stageNumber: 3,
            stageTitle: 'Pre-Flight Audit & One-Click Dossier Export',
            ownerType: 'AUTOMATED_SYSTEM',
            whatHappensStepByStep: 'System runs cross-module consistency verification and generates printer-friendly, grant-compliant PDF dossiers with verified appendices.',
            toolsEquipmentOrSupplier: 'Headless Chromium / Print CSS renderer',
            activeMinutesPerOrder: 0,
            directVariableCostPerOrder: 0.25,
          },
        ],
        endToEndFulfillmentNarrative:
          '100% digital self-serve fulfillment. Founders purchase access, receive instant credentialed access, and work at their own pace with automated cloud persistence.',
        scalingAndBottleneckDeRiskingNarrative:
          'Serverless Google Cloud Run containers and managed Cloud SQL automatically scale to absorb traffic spikes from university cohort launches without requiring manual operational intervention.',
      },
      premisesAndEquipment: {
        premisesType: 'HUB_COWORKING',
        premisesLocation: 'Dublin 2 Innovation Coworking Hub (Guinness Enterprise Centre / Dogpatch Labs)',
        monthlyRentCost: 350,
        equipmentSchedule: [
          {
            id: 'eq-1',
            description: 'Dedicated cloud server instances & managed database cluster',
            supplier: 'Google Cloud Platform Europe-West1 (Dublin)',
            category: 'SOFTWARE_CLOUD_AI',
            costNet: 240,
            monthlyCost: true,
          },
          {
            id: 'eq-2',
            description: 'Transactional email infrastructure & domain reputation monitoring',
            supplier: 'Resend / Postmark',
            category: 'SOFTWARE_CLOUD_AI',
            costNet: 35,
            monthlyCost: true,
          },
        ],
      },
      riskRegister: {
        risks: [
          {
            id: 'r1',
            category: 'TECHNICAL',
            riskTitle: 'API Downtime or Token Exhaustion',
            impactScore: 3,
            likelihoodScore: 2,
            mitigation: 'Dual-fallback architecture with deterministic rule-based synthesizers if external AI APIs experience latency or rate limits.',
          },
          {
            id: 'r2',
            category: 'COMMERCIAL',
            riskTitle: 'Price Sensitivity among Pre-Revenue Founders',
            impactScore: 3,
            likelihoodScore: 3,
            mitigation: '100% free Module A Concept Canvas hook proving immediate value before requiring payment.',
          },
          {
            id: 'r3',
            category: 'MANAGERIAL',
            riskTitle: 'Founder Support Workload',
            impactScore: 4,
            likelihoodScore: 2,
            mitigation: 'In-app micro-coaching cards ("Why Are We Asking This?", "Show Me an Example") resolve 85%+ of founder questions in-context.',
          },
        ],
      },
      permitsAndInsurance: {
        croRegistrationConfirmed: true,
        gdprCompliantDataPolicy: true,
        cyberInsuranceInPlace: true,
        professionalIndemnityInPlace: true,
      },
    },
    aiThingsToConsiderJsonb: [],
  });

  // --- MODULE F: TEAM, SURVIVAL BUDGET & HATS (100%) ---
  await db.insert(planModulesData).values({
    planId: newPlan.id,
    moduleCode: 'MOD_F_COFOUNDER_TEAM',
    completionPercentage: 100,
    structuredInputsJsonb: {
      promoterProfiles: {
        teamStructurePosture: 'SOLO_FOUNDER_CURRENT',
        teamMembers: [
          {
            id: 'promoter-1',
            fullName: 'Thomas Walsh',
            roleClassification: 'FOUNDER_PROMOTER',
            jobTitle: 'Founder & Chief Executive Promoter',
            weeklyCommitment: 'FULL_TIME_40H_PLUS',
            equitySharePercent: 100,
            linkedInUrl: 'https://www.linkedin.com/in/thomaswalsh',
            compiled150WordNarrative:
              'Thomas Walsh is an experienced software engineer and product builder with over 8 years of hands-on experience designing, shipping, and scaling web applications. Having worked directly alongside early-stage startups and experienced firsthand the frustrating, bureaucratic friction of applying for state enterprise support and grant funding, Thomas conceived and architected Startup Sidekick. His background combines deep technical engineering expertise (full-stack TypeScript, PostgreSQL, secure authentication, and generative AI guardrails) with a pragmatic, customer-led product philosophy. He completed the Local Enterprise Office Start Your Own Business programme and has personally conducted in-depth discovery interviews with dozens of early-stage Irish and UK founders. As Founder and Chief Executive Promoter, Thomas leads all product roadmap engineering, system architecture, and strategic growth initiatives.',
            cvReadyForAppendixD: true,
            isCurrentUserFounder: true,
          },
        ],
        executiveTeamCapabilityNarrative:
          'Thomas Walsh possesses the complete end-to-end technical, architectural, and commercial capability required to execute Startup Sidekick without reliance on external dev agencies.',
      },
      step2RoleMatrixData: {
        hatAssignments: [
          { hat: 'VISION', ownerName: 'Thomas Walsh' },
          { hat: 'PRODUCT', ownerName: 'Thomas Walsh' },
          { hat: 'TECH', ownerName: 'Thomas Walsh' },
          { hat: 'FINANCE', ownerName: 'Thomas Walsh' },
          { hat: 'MARKETING', ownerName: 'Thomas Walsh' },
          { hat: 'OPERATIONS', ownerName: 'Thomas Walsh' },
          { hat: 'CUSTOMER_SUCCESS', ownerName: 'Thomas Walsh (Year 1) -> Dedicated Hire (Year 2)' },
        ],
      },
      step3SurvivalBudgetData: {
        currencyCode: 'EUR',
        founderBudgets: [
          {
            memberId: 'promoter-1',
            memberName: 'Thomas Walsh',
            presetUsed: 'LEAN_SOLO',
            housingAndUtilities: 1730,
            groceriesAndEssentials: 420,
            transportAndCommute: 180,
            debtAndLoanCommitments: 0,
            dependentsAndFamily: 0,
            incomeOffsetCushion: 0,
            personalSavingsBuffer: 28000,
            notes: 'Verified lean survival drawings baseline for Dublin living costs.',
          },
        ],
      },
      step4AlignmentData: {
        alignmentInterviewCompleted: true,
        alignmentSummaryNotes: 'Solo founder ownership. Standard 4-year reverse vesting with 1-year cliff mandated for any future equity recruits.',
      },
      step5HiringPlanData: {
        hiringPosture: 'BALANCED_COFOUNDER_HIRES',
        roles: [
          {
            id: 'role-1',
            title: 'Full-Stack Software Engineer',
            department: 'ENGINEERING_PRODUCT',
            employmentMode: 'FULL_TIME',
            yearScheduled: 1,
            targetQuarter: 'Q3',
            compensationModel: 'SALARY_AND_EQUITY',
            grossAnnualSalary: 55000,
            isGrantReimbursableEligible: true,
            notes: 'Accelerate core platform development and API connectors.',
          },
          {
            id: 'role-2',
            title: 'Customer Success & Grant Specialist',
            department: 'OPERATIONS_SUPPORT',
            employmentMode: 'FULL_TIME',
            yearScheduled: 2,
            targetQuarter: 'Q1',
            compensationModel: 'BASE_SALARY',
            grossAnnualSalary: 42000,
            isGrantReimbursableEligible: true,
            notes: 'Manage growing cohort customer onboarding and mentor support inquiries.',
          },
          {
            id: 'role-3',
            title: 'Senior Full-Stack Engineer',
            department: 'ENGINEERING_PRODUCT',
            employmentMode: 'FULL_TIME',
            yearScheduled: 2,
            targetQuarter: 'Q2',
            compensationModel: 'BASE_SALARY',
            grossAnnualSalary: 65000,
            isGrantReimbursableEligible: true,
            notes: 'Accelerate mobile and open-banking roadmap deliverables.',
          },
          {
            id: 'role-4',
            title: 'Growth & Partnerships Lead',
            department: 'SALES_MARKETING',
            employmentMode: 'FULL_TIME',
            yearScheduled: 3,
            targetQuarter: 'Q1',
            compensationModel: 'BASE_SALARY',
            grossAnnualSalary: 55000,
            isGrantReimbursableEligible: true,
            notes: 'Lead Irish and UK incubator partnerships and customer acquisition.',
          },
          {
            id: 'role-5',
            title: 'AI/ML Systems Engineer',
            department: 'ENGINEERING_PRODUCT',
            employmentMode: 'FULL_TIME',
            yearScheduled: 3,
            targetQuarter: 'Q2',
            compensationModel: 'BASE_SALARY',
            grossAnnualSalary: 70000,
            isGrantReimbursableEligible: true,
            notes: 'Advance automated grant auditing models and reasoning engine.',
          },
        ],
        rolesToHire: [
          {
            year: 2,
            roleTitle: 'Customer Success & Grant Specialist',
            salaryGross: 42000,
            justification: 'Manage growing cohort customer onboarding and mentor support inquiries.',
          },
          {
            year: 2,
            roleTitle: 'Senior Full-Stack Engineer',
            salaryGross: 65000,
            justification: 'Accelerate mobile and open-banking roadmap deliverables.',
          },
        ],
        currentFullTime: 1,
        year1NewFullTime: 1,
        year2NewFullTime: 2,
        year3NewFullTime: 2,
        contractorBudgetYear1: 5000,
        contractorBudgetYear2: 8000,
        contractorBudgetYear3: 12000,
        executiveHiringStrategyNarrative: 'Prudent milestone-gated hiring: Year 1 adds 1 full-time engineer to pair with Thomas, Year 2 adds Customer Success & Senior Full-Stack Engineer (reaching 4 full-time staff), and Year 3 scales to 6 full-time staff.',
      },
    },
    aiThingsToConsiderJsonb: [],
  });

  // --- MODULE G: LAUNCHPAD & GETTING SET UP (100%) ---
  await db.insert(planModulesData).values({
    planId: newPlan.id,
    moduleCode: 'MOD_G_LAUNCHPAD',
    completionPercentage: 100,
    structuredInputsJsonb: {
      step1: {
        state: 'ALREADY_HAVE',
        legalStructure: 'LTD',
        registeredEntityName: 'Startup Preflight Limited (trading as Startup Sidekick)',
        registrationNumber: '748291',
        registrationDate: '2026-01-15',
        targetFormationTimeline: 'COMPLETED',
        incorporationNotes: 'Incorporated via CRO Dublin with standard single-class ordinary voting shares.',
      },
      step2: {
        state: 'ALREADY_HAVE',
        primaryDomain: 'startuppreflight.com',
        isDomainLive: true,
        officialBusinessEmail: 'thomas@startuppreflight.com',
        emailProvider: 'GOOGLE_WORKSPACE',
        notes: 'Dual domains secured: startuppreflight.com and startupsidekick.com with SPF/DKIM/DMARC authenticated.',
      },
      step3: {
        state: 'ALREADY_HAVE',
        bankProvider: 'REVOLUT_BUSINESS',
        hasDedicatedIban: true,
        ibanLast4: '4091',
        targetOpeningTimeline: 'COMPLETED',
        notes: 'Irish dedicated IBAN operational with integrated Stripe payouts and corporate debit cards.',
      },
      step4: {
        state: 'ALREADY_HAVE',
        softwareChoice: 'XERO',
        hasAccountant: true,
        accountantFirmName: 'O’Brien & Associates Chartered Certified Accountants',
        vatStatus: 'REGISTERED',
        payrollSetup: 'DIRECTOR_ONLY',
        notes: 'Cloud accounting linked directly to business bank feed with quarterly VAT filing enabled.',
      },
      step5: {
        state: 'ALREADY_HAVE',
        hasPublicLiability: true,
        hasEmployersLiability: false,
        hasProfessionalIndemnity: true,
        hasProductLiability: true,
        currentInsurerName: 'Hiscox Europe',
        policyRenewalDate: '2027-01-15',
        targetCoverageTimeline: 'COMPLETED',
        notes: '€1M professional indemnity and cyber liability coverage active.',
      },
      step6: {
        state: 'ALREADY_HAVE',
        hasIpAssignmentSigned: true,
        hasPrivacyPolicy: true,
        hasTermsOfService: true,
        hasStandardNda: true,
        gdprOfficerDesignated: true,
        legalAdvisorOrPlatform: 'Flynn O’Driscoll Business Lawyers',
        notes: 'Full IP assignment deed executed transferring all software IP to the limited company.',
      },
    },
    aiThingsToConsiderJsonb: [],
  });

  // --- MODULE H: REVENUE & POCKET PROFIT BREAKEVEN (100%) ---
  await db.insert(planModulesData).values({
    planId: newPlan.id,
    moduleCode: 'MOD_H_REVENUE',
    completionPercentage: 100,
    structuredInputsJsonb: {
      step1RevenueModel: {
        revenueModelVehicle: 'SUBSCRIPTION_RECURRING',
        offeringStructure: 'MULTI_OFFERING_TIERS',
        valueMetric: 'per active startup plan / cohort pass',
        billingCadenceDefault: 'ONE_OFF',
        offeringRangeSummary: 'Solo Pass (€129 net), Co-Founder Pass (€199 net), Living Vault (€9/mo), Cohort Pilot License (€3,500/batch).',
        selectedCurrency: 'EUR',
        lastSavedAt: nowIso,
      },
      step2PricingTiers: {
        tiers: [
          {
            id: 'tier-solo',
            name: 'Solo Founder 6-Month Pass',
            targetPersona: 'Individual solo founder preparing a grant application or MVP launch',
            priceGross: 158.67,
            priceNetOfTax: 129.0,
            taxRatePercent: 23,
            billingFrequency: 'ONE_OFF',
            salesMixPercent: 55,
            deliverablesSummary: '6 months full access to all 12 modules, Pocket Profit breakeven sandbox, Mom Test survey generator, and LEO/Innovate UK PDF export.',
            isRecommendedDefault: false,
          },
          {
            id: 'tier-cofounder',
            name: 'Co-Founder 6-Month Pass (Flagship)',
            targetPersona: 'Founding teams of 2–3 co-founders preparing investor or grant rounds',
            priceGross: 244.77,
            priceNetOfTax: 199.0,
            taxRatePercent: 23,
            billingFrequency: 'ONE_OFF',
            salesMixPercent: 35,
            deliverablesSummary: 'Includes up to 3 founder seats, 3 active startup plans, and the Blind-Reveal Co-Founder Alignment 12-question interview.',
            isRecommendedDefault: true,
          },
          {
            id: 'tier-vault',
            name: 'Grant Radar & Living Vault Micro-Sub',
            targetPersona: 'Alumni founders maintaining living business plans and tracking quarterly grant deadlines',
            priceGross: 11.07,
            priceNetOfTax: 9.0,
            taxRatePercent: 23,
            billingFrequency: 'MONTHLY',
            salesMixPercent: 10,
            deliverablesSummary: 'Continuous workspace editability, automated quarterly grant radar alerts, and cloud financial model syncing.',
            isRecommendedDefault: false,
          },
        ],
        blendedAveragePriceNet: 155.0,
        pricingStrategyNotes: 'High-value one-off pass removes subscription fatigue while providing 97% gross margins.',
      },
      step3BreakevenCalculator: {
        selectedSimulationYear: 1,
        activePriceSlider: 155,
        activeCustomerSlider: 18,
        frictionCosts: {
          paymentGatewayPercent: 1.7,
          paymentGatewayFixedCents: 25,
          directVariableCogsPerUnit: 2.2,
          disputeRefundBufferPercent: 1.5,
          affiliateCommissionPercent: 0,
        },
        yearTargets: [
          {
            yearNumber: 1,
            monthlyPayrollBaseline: 2400,
            otherFixedMonthlyOverheads: 420,
            customersNeededToBreakeven: 19,
            monthlyRevenueAtBreakeven: 2945,
            monthlyPocketProfitAtTarget: 2150,
          },
          {
            yearNumber: 2,
            monthlyPayrollBaseline: 7500,
            otherFixedMonthlyOverheads: 850,
            customersNeededToBreakeven: 56,
            monthlyRevenueAtBreakeven: 8680,
            monthlyPocketProfitAtTarget: 6200,
          },
          {
            yearNumber: 3,
            monthlyPayrollBaseline: 15000,
            otherFixedMonthlyOverheads: 1500,
            customersNeededToBreakeven: 110,
            monthlyRevenueAtBreakeven: 17050,
            monthlyPocketProfitAtTarget: 14800,
          },
        ],
        paymentTerms: 'INSTANT_PAYMENT',
        exportSalesPercent: 45,
        exportFocusRegions: 'UK, EU',
        breakevenNarrative:
          'With near-zero physical COGS and strict serverless infrastructure controls, our contribution margin exceeds 96%. Startup Sidekick reaches operational breakeven on just 19 passes per month, ensuring extreme resilience and eliminating dependency on external venture capital.',
      },
      step4SalesAssumptions: {
        salesCycleDays: 7,
        primarySalesMotion: 'SELF_SERVE_WEB',
        expectedConversionRatePercent: 4.8,
        expectedMonthlyChurnOrRepeatPercent: 3.5,
        teamMonthlyCapacityCap: 500,
        writtenAssumptionsNarrative:
          'Conversion driven by the frictionless Module A free hook, organic founder-community word-of-mouth, and institutional accelerator partnerships.',
      },
      step5RevenueBrief: {
        blindSpots: [],
        readinessConfidence: 'BANK_AND_GRANT_UNDERWRITING_READY',
        executiveCommercialSummaryNarrative:
          'Startup Sidekick demonstrates robust unit economics with a 96.9% gross margin, low working-capital requirements, and a rapid 7-day conversion velocity from free Concept Canvas completion to paid pass unlock.',
      },
    },
    aiThingsToConsiderJsonb: [],
  });

  // --- MODULE I: MARKETING & GO-TO-MARKET (100%) ---
  await db.insert(planModulesData).values({
    planId: newPlan.id,
    moduleCode: 'MOD_I_MARKETING',
    completionPercentage: 100,
    structuredInputsJsonb: {
      step1Positioning: {
        elevatorHook140: 'The opinionated flight simulator for early-stage founders to de-risk ideas, fix unit economics, and secure LEO and UK grants.',
        positioningFormula: {
          targetCustomer: 'For ambitious first-time founders in Ireland and the UK',
          customerProblem: 'who are overwhelmed by spreadsheet formulas and bureaucratic grant application rules',
          solutionCategory: 'Startup Sidekick is a guided founder operating system',
          primaryBenefit: 'that produces audit-proof business plans and verified unit economics in days instead of months',
          competitiveWedge: 'unlike generic ChatGPT or €5,000 grant consultants, we combine live Mom Test surveys, visual Pocket Profit breakeven graphs, and hard-coded regional grant criteria.',
        },
        toneOfVoice: 'AUTHORITATIVE_TRUSTED',
        toneOfVoiceBoundary: {
          weAre: 'Direct, supportive, pragmatic, and mathematically rigorous.',
          weAreNever: 'Jargon-filled, cynical, overly academic, or promotional.',
        },
        corePillars: [
          'No-Spreadsheet Financial Rigor (Pocket Profit visual mechanics)',
          'Hard-Coded Underwriting Compliance (LEO, Enterprise Ireland, Innovate UK)',
          'Mom Test Validation Engine (Proof before you spend)',
        ],
      },
      step2FourPs: {
        productStrategy: 'SaaS platform delivering 12 sequential modules from ideation through to official grant application dossier export.',
        pricingStrategy: 'Frictionless entry (€0 Module A) leading into value-packed one-off passes (€129/€199) and institutional cohort pilots (€3,500).',
        placementChannels: 'Direct online self-serve, partnered university startup incubators, and Local Enterprise Office advisor clinics.',
        promotionalMix: 'Founder content sharing real grant teardowns on LinkedIn, free Concept Canvas generator, and guest workshops at tech hubs.',
      },
      step3First10: {
        targetLaunchDate: '2026-03-01',
        playbookPhases: [
          {
            phaseTitle: 'Phase 1: Founder Community Beta (First 25 Paid Founders)',
            tacticDescription: 'Direct 1-on-1 outreach to founders currently preparing for LEO Feasibility deadlines across Dublin and Galway.',
          },
          {
            phaseTitle: 'Phase 2: University Accelerator Pilots (Next 100 Founders)',
            tacticDescription: 'Provide sponsored cohort batches to NovaUCD, Trinity Tangent, and NDRC pre-accelerator participants.',
          },
          {
            phaseTitle: 'Phase 3: UK Cross-Border Expansion',
            tacticDescription: 'Launch targeted UK campaigns focusing on British Business Bank Start Up Loans and Innovate UK Smart Grants.',
          },
        ],
      },
      step4Budget: {
        monthlyBudget: 650,
        allocationBreakdown: [
          { channel: 'Community Sponsorships & Meetup Workshops', percent: 45 },
          { channel: 'Targeted LinkedIn Founder Search & Content', percent: 35 },
          { channel: 'Search Engine Optimization & Grant Directory Tools', percent: 20 },
        ],
      },
      step5MarketingBrief: {
        executiveMarketingSummaryNarrative:
          'Go-to-market combines bottom-up founder adoption driven by the free Module A Concept Canvas with top-down accelerator cohort licenses, keeping customer acquisition cost below €35 against a €155 blended order value.',
      },
    },
    aiThingsToConsiderJsonb: [],
  });

  // --- MODULE J: FINANCIAL PROJECTIONS & CASHFLOW (100%) ---
  await db.insert(planModulesData).values({
    planId: newPlan.id,
    moduleCode: 'MOD_J_FINANCE',
    completionPercentage: 100,
    structuredInputsJsonb: {
      step1OverheadsTax: {
        operatingCostPosture: 'BOOTSTRAPPED_HOME_LEAN',
        selectedCurrency: 'EUR',
        monthlyOverheadsItems: [
          { id: 'ov-1', category: 'PREMISES_RENT_UTILITIES', label: 'Innovation Hub Coworking Desk', monthlyAmount: 350 },
          { id: 'ov-2', category: 'SOFTWARE_CLOUD_AI', label: 'Google Cloud, Vercel & AI Router Infrastructure', monthlyAmount: 220 },
          { id: 'ov-3', category: 'PROFESSIONAL_FEES_INSURANCE', label: 'Accounting, Compliance & SaaS Insurance', monthlyAmount: 280 },
          { id: 'ov-4', category: 'MARKETING_SALES_COMMUNITY', label: 'Founder Community Outreach & Digital Tools', monthlyAmount: 300 },
        ],
        monthlyDirectorDrawingsYear1: 2400,
        monthlyTeamSalariesYear2: 7500,
        monthlyTeamSalariesYear3: 15000,
        autoApplyEmployerPayrollTax: true,
        employerPayrollTaxRatePercent: 11.15,
        corporationTaxRatePercent: 12.5,
        vatRegistrationStrategy: 'IMMEDIATE_STANDARD',
        standardVatRatePercent: 23,
        exportRevenueSharePercent: 45,
        exportTargetMarketsSummary: 'United Kingdom, Germany, Netherlands, and English-speaking European startup hubs.',
        totalCapExEquipmentValue: 1200,
        capExDepreciationYears: 3,
        overheadsAndTaxNarrative:
          'Financial model calibrated for Irish standard 12.5% Corporation Tax, 11.15% Employer PRSI on future headcount, and standard 23% VAT with comprehensive reverse-charge mechanics on UK and EU B2B export revenues.',
      },
      step2WorkingCapital: {
        customerCollectionTiming: 'INSTANT_CARD_STRIPE_0',
        inventoryStockTiming: 'NO_PHYSICAL_STOCK_DIGITAL',
        upfrontStockMonthsBuffer: 0,
        seasonalityRampCurve: 'STEADY_LINEAR_RAMP',
        monthToStartRevenue: 1,
        workingCapitalNarrative:
          'Instant digital payment capture via Stripe ensures negative working-capital cycle—cash is collected 30 to 60 days before server and cloud vendor invoices fall due.',
      },
      step3CashflowGap: {
        primaryFundingStrategy: 'GRANT_PLUS_MATCH_FUNDING',
        startingCashBalanceDay1: 15000,
        safetyBufferPercent: 20,
        fundingSources: [
          {
            id: 'fs-1',
            sourceType: 'FOUNDER_SAVINGS_EQUITY',
            label: 'Founder Seed Capital Equity Contribution',
            amount: 15000,
            isReimbursementArrears: false,
            reimbursementLagMonths: 0,
          },
          {
            id: 'fs-2',
            sourceType: 'LEO_EI_INNOVATE_GRANT',
            label: 'LEO Feasibility Study Grant (50% Matched)',
            amount: 15000,
            isReimbursementArrears: true,
            reimbursementLagMonths: 3,
          },
        ],
        loanInterestRatePercent: 0,
        loanTermMonths: 0,
        fundingGapNarrative:
          'Maximum projected cash trough is €11,800 occurring in Month 3 prior to LEO Feasibility grant drawdown. The founder\'s initial €15,000 equity injection provides a complete liquidity safety cushion throughout.',
      },
      step4Statements: {
        activeStressScenario: 'BASE_CASE_OFFICIAL',
        writtenFinancialAssumptionsBlock:
          '3-Year Forecast Summary:\n- Year 1: €68,400 Turnover (440 passes) | €44,200 Total Operating Costs | €24,200 Net Profit before Tax\n- Year 2: €248,000 Turnover (1,250 passes + 6 cohorts + Vault subs) | €152,000 Total Operating Costs | €96,000 Net Profit before Tax\n- Year 3: €620,000 Turnover (International expansion, 18 cohorts) | €385,000 Total Operating Costs | €235,000 Net Profit before Tax',
      },
      step5FinanceBrief: {
        blindSpots: [],
        financeReadinessConfidence: 'BANK_AND_GRANT_UNDERWRITING_READY',
        executiveFinancialSummaryNarrative:
          'Robust, stress-tested multi-year financial statements demonstrating profitability from Year 1, zero reliance on speculative debt, and a high cashflow margin that qualifies for Enterprise Ireland High Potential Start-Up (HPSU) progression.',
      },
    },
    aiThingsToConsiderJsonb: [],
  });

  // --- MODULE K: GRANTS & NON-DILUTIVE FUNDING (100%) ---
  await db.insert(planModulesData).values({
    planId: newPlan.id,
    moduleCode: 'MOD_K_GRANTS_FUNDING',
    completionPercentage: 100,
    structuredInputsJsonb: {
      step1Audit: {
        selectedGrantKey: 'IE_LEO_FEASIBILITY',
        targetCountry: 'IE',
        overallAssessorReadinessScore: 98,
        stackedFundingRoadmapSelected: true,
        activeFilterTab: 'ALL',
        founderNotes: 'Fully compliant with LEO eligibility criteria: internationally traded service, zero local market displacement, matching funds confirmed in bank.',
      },
      step2CapitalStack: {
        presetUsed: 'NON_DILUTIVE_LEO_BOOTSTRAP',
        totalTargetFundingGap: 30000,
        skinInTheGameCash: 15000,
        totalGrantsAllocated: 15000,
        totalLoansAllocated: 0,
        totalAngelAllocated: 0,
        skinInTheGamePercent: 50,
        projectedEquityDilutionPercent: 0,
        assessorSoundnessScore: 96,
        fundingStrategyNarrative:
          '100% non-dilutive funding strategy combining €15,000 founder equity savings with €15,000 matched LEO Feasibility funding, preserving 100% promoter equity for future growth.',
      },
      step3ReimbursementBridge: {
        grantEligibleVouchedBudget: 30000,
        expectedGrantDrawdownAmount: 15000,
        estimatedClaimTurnaroundWeeks: 10,
        bridgeStrategy: 'FOUNDER_DIRECTOR_LOAN_BUFFER',
        minimumLiquidityBufferRequired: 12000,
        actualConfirmedBridgeLiquidity: 15000,
        liquiditySafetySurplusOrDeficit: 3000,
        isAssessorLiquidityCompliant: true,
        vendorPaymentTermsDays: 30,
        bridgeRiskMitigationNarrative:
          'Founder has dedicated €15,000 liquid capital in the company bank account, fully satisfying LEO rules that all supplier invoices must be settled prior to retrospective grant drawdown.',
      },
      step4TaxRelief: {
        primaryTaxScheme: 'IE_EII_EMPLOYMENT_INVESTMENT_INCENTIVE',
        targetReliefRaiseAmount: 100000,
        investorReliefPercentage: 40,
        estimatedInvestorTaxSavings: 40000,
        advanceAssuranceStatus: 'NOT_STARTED',
        grossAssetsWithinThreshold: true,
        lessThan250Employees: true,
        qualifyingTradeStatus: 'QUALIFYING',
        taxCatalystPitchNarrative:
          'Startup Sidekick qualifies for Irish EII and R&D Tax Credit (30% refundable credit on algorithmic underwriting logic), providing substantial downside protection for future angel investors.',
      },
      step5FundingBrief: {
        executiveSummary:
          'Comprehensive non-dilutive capital roadmap progressing from LEO Feasibility (€15k) to LEO Priming (€80k) and Enterprise Ireland Digital Discovery, positioning the business for sustained export growth.',
        fundingRoadmap: [
          {
            phaseNumber: 1,
            grantOrFundingName: 'LEO Feasibility Study Grant',
            agency: 'Local Enterprise Office Dublin City',
            amountFormatted: '€15,000 (50% match on €30k spend)',
            timingTrigger: 'Immediate (Months 1–4)',
            prerequisites: 'CRO registered, €15k matching cash confirmed in bank',
            unlocksNext: 'Validates export market channels and unlocks LEO Priming application',
          },
          {
            phaseNumber: 2,
            grantOrFundingName: 'Enterprise Ireland Digital Discovery Voucher',
            agency: 'Enterprise Ireland',
            amountFormatted: '€5,000 (80% grant)',
            timingTrigger: 'Month 6',
            prerequisites: 'Trading track record and documented technical roadmap',
            unlocksNext: 'Advanced AI infrastructure optimization and data architecture audit',
          },
          {
            phaseNumber: 3,
            grantOrFundingName: 'LEO Priming Grant',
            agency: 'Local Enterprise Office Dublin City',
            amountFormatted: '€50,000 – €80,000 (Salary & Capital support)',
            timingTrigger: 'Year 2 (Months 12–16)',
            prerequisites: 'Year 1 turnover milestone achieved and 2 full-time hires scheduled',
            unlocksNext: 'Funds international expansion into UK and European regional hubs',
          },
        ],
        assessorReadinessScore: 98,
        underwriterContradictionFlags: [],
        recommendedActionChecklist: [
          'Submit LEO Feasibility application form with Appendices A–F.',
          'Schedule formal LEO Dublin City Enterprise Clinic review.',
          'Execute statutory Director declaration and confirm bank statements.',
        ],
        moduleLGrantMode: 'IE_LEO',
      },
    },
    aiThingsToConsiderJsonb: [],
  });

  // --- MODULE L: BUSINESS PLAN STUDIO & COMPILER (100%) ---
  await db.insert(planModulesData).values({
    planId: newPlan.id,
    moduleCode: 'MOD_L_BUSINESS_PLAN',
    completionPercentage: 100,
    structuredInputsJsonb: {
      step1Mode: {
        compilerMode: 'IE_LEO_OFFICIAL_GRANT',
        narrativeTone: 'AUTHORITATIVE_DATA_BACKED',
        submissionObjective: 'FEASIBILITY_STUDY_GRANT',
        submissionWindow: 'ROLLING_MONTHLY_COMMITTEE',
        targetAgencyOrCommitteeName: 'Local Enterprise Office Dublin City Evaluation Committee',
        targetFundingAskAmount: 15000,
        includeAppendicesBinder: true,
        strictWordCountEnforcement: true,
        compilerMandateNotes: 'Compiled specifically to satisfy Irish Local Enterprise Office statutory grant evaluation criteria.',
      },
      step2Audit: {
        overallAuditScore: 100,
        auditItems: [
          {
            id: 'audit-1',
            category: 'PRICING_VS_VALIDATION',
            severity: 'PASS',
            status: 'RESOLVED',
            ruleTitle: 'Pricing Tiers reconcile with Mom Test survey willingness',
            findingDescription: 'Pricing tiers (€129/€199) align with survey findings where 68% of founders preferred a one-off pass under €250.',
            mitigationNotes: 'Verified against Module C response distribution.',
          },
          {
            id: 'audit-2',
            category: 'PAYROLL_VS_HEADCOUNT',
            severity: 'PASS',
            status: 'RESOLVED',
            ruleTitle: 'Module F headcount syncs with Module J salary expense',
            findingDescription: 'Scheduled Year 2 hires (Customer Success & Senior Engineer) correctly match Module J salary line items.',
            mitigationNotes: 'Employer PRSI (11.15%) correctly applied across all future hires.',
          },
          {
            id: 'audit-3',
            category: 'PROCUREMENT_ELIGIBILITY',
            severity: 'PASS',
            status: 'RESOLVED',
            ruleTitle: 'Capital expenditure excludes non-eligible mobile assets',
            findingDescription: 'Zero mobile laptops, tablets, or vehicles are included in grant expenditure schedules.',
            mitigationNotes: 'Compliant with Irish statutory LEO equipment guidelines.',
          },
        ],
        acknowledgedItemIds: ['audit-1', 'audit-2', 'audit-3'],
        preFlightDefenseSummary:
          'Audit confirmed: Zero discrepancies found between financial models, salary schedules, and official LEO eligibility rules.',
      },
      step3Compiler: {
        modeCompiledFor: 'IE_LEO_OFFICIAL_GRANT',
        executiveHookStatement:
          'Startup Sidekick is an internationally traded B2B SaaS platform that transforms the complex, error-prone process of startup validation and grant preparation into a guided, audit-proof experience for early-stage founders.',
        sections: [
          {
            id: 'sec-1',
            sectionNumber: 1,
            title: '1. Executive Summary & Business Concept',
            assessorQuestionPrompt: 'Provide a clear, concise overview of the proposed business, core innovation, and commercial objectives.',
            scoringWeightPercent: 15,
            wordLimit: 400,
            sourceModules: ['MOD_A_IDEATION', 'MOD_B_MARKET'],
            compiledResponseText:
              'Startup Sidekick is an opinionated founder operating system and flight simulator developed by Startup Preflight Limited (CRO #748291). The platform replaces static Word templates and brittle financial spreadsheets with an interactive 12-step guided workspace. Founders are led through customer discovery, Mom Test survey generation, visual unit economics modeling ("Pocket Profit"), co-founder alignment interviews, and automated grant compliance checks. The company operates as an internally traded service eligible for LEO enterprise support, with significant cross-border export focus targeting the UK and English-speaking European startup ecosystems.',
          },
          {
            id: 'sec-2',
            sectionNumber: 2,
            title: '2. Market Analysis & Target Customers',
            assessorQuestionPrompt: 'Describe your target market, beachhead customer persona, competitive differentiation, and market sizing.',
            scoringWeightPercent: 20,
            wordLimit: 500,
            sourceModules: ['MOD_B_MARKET', 'MOD_C_SURVEYS_FEEDBACK'],
            compiledResponseText:
              'The beachhead market comprises early-stage, pre-incorporation, and pre-seed founders across Ireland and the UK applying for state grants (LEO Feasibility, Enterprise Ireland New Frontiers, Innovate UK, Start Up Loans). Over 22,000 companies incorporate annually in Ireland and 700,000 in the UK; approximately 5% represent innovative tech or productized services eligible for enterprise support. While generic AI tools hallucinate financial formulas and boutique grant writers charge upwards of €5,000, Startup Sidekick provides an accessible, mathematically rigorous alternative priced from €129. Over 140 founders surveyed confirmed overwhelming spreadsheet dread and a strong willingness to pay for structured, audit-proof software guidance.',
          },
          {
            id: 'sec-3',
            sectionNumber: 3,
            title: '3. Technical Product & Operations Blueprint',
            assessorQuestionPrompt: 'Detail the product architecture, work packages, technical execution feasibility, and day-to-day operations.',
            scoringWeightPercent: 20,
            wordLimit: 500,
            sourceModules: ['MOD_D_PRODUCT_BUILD', 'MOD_E_OPERATIONS'],
            compiledResponseText:
              'Startup Sidekick is architected on a high-performance, enterprise-grade cloud stack: Next.js 15 App Router, TypeScript, PostgreSQL managed database with Drizzle ORM, Better-Auth security, and the official Google GenAI SDK with strict server-side daily platform ceilings (500 calls/day) and AES-256-GCM encryption for BYOK keys. Fulfillment is 100% automated via Stripe Checkout. The development roadmap is structured into 4 disciplined Work Packages (WP1: Core Extraction Engine; WP2: Pocket Profit Breakeven Model; WP3: LEO/Innovate UK Rules Engine; WP4: Pre-Flight Audit Compiler) led by technical promoter Thomas Walsh.',
          },
          {
            id: 'sec-4',
            sectionNumber: 4,
            title: '4. Promoter Capability & Management Team',
            assessorQuestionPrompt: 'Outline the background, technical skills, and commitment of the promoter(s) to execute the business plan.',
            scoringWeightPercent: 20,
            wordLimit: 400,
            sourceModules: ['MOD_F_COFOUNDER_TEAM'],
            compiledResponseText:
              'The venture is led by sole promoter Thomas Walsh, an experienced software engineer and product architect with over 8 years of full-stack engineering expertise. Thomas completed the LEO Start Your Own Business programme and possesses full in-house capability to build, deploy, and maintain the platform. A verified personal survival budget (€2,330/month) supported by existing founder savings ensures 100% full-time dedication without financial distraction. In Year 2, the team will expand with a dedicated Customer Success & Grant Specialist (€42k) and a Senior Full-Stack Engineer (€65k).',
          },
          {
            id: 'sec-5',
            sectionNumber: 5,
            title: '5. Financial Projections & Viability',
            assessorQuestionPrompt: 'Present your unit economics, 3-year turnover and profit projections, and cashflow funding requirements.',
            scoringWeightPercent: 25,
            wordLimit: 500,
            sourceModules: ['MOD_H_REVENUE', 'MOD_J_FINANCE', 'MOD_K_GRANTS_FUNDING'],
            compiledResponseText:
              'Unit economics reflect exceptional software fundamentals: blended average order value of €155 net against direct transaction and variable AI token costs of €4.75, yielding a 96.9% gross margin. The business achieves monthly operational breakeven at just 19 passes per month. Projected turnover grows from €68,400 in Year 1 to €248,000 in Year 2 and €620,000 in Year 3. Operating profit before tax is €24,200 in Year 1, rising to €96,000 in Year 2. Maximum projected cashflow trough is €11,800 in Month 3, fully safeguarded by the founder\'s €15,000 confirmed cash contribution and the requested €15,000 LEO Feasibility grant.',
          },
        ],
      },
      step4Appendices: {
        declarationConfirmed: true,
        signatoryName: 'Thomas Walsh',
        signatoryTitle: 'Founder & Chief Executive Promoter',
        appendices: [
          {
            code: 'APPENDIX_A',
            title: 'Appendix A: Validated Customer Discovery & Mom Test Survey Insights',
            included: true,
            readinessStatus: 'VERIFIED_READY',
            sourceModuleCode: 'MOD_C_SURVEYS_FEEDBACK',
            signOffNote: 'Complete summary of 8 founder survey responses and 3 in-depth interview transcripts.',
          },
          {
            code: 'APPENDIX_B',
            title: 'Appendix B: Technical Architecture & Work Packages Specification',
            included: true,
            readinessStatus: 'VERIFIED_READY',
            sourceModuleCode: 'MOD_D_PRODUCT_BUILD',
            signOffNote: 'Detailed breakdown of WP1–WP4 deliverables, technology choices, and engineering milestones.',
          },
          {
            code: 'APPENDIX_C',
            title: 'Appendix C: Vouched Feasibility Expenditure & Supplier Quotes',
            included: true,
            readinessStatus: 'VERIFIED_READY',
            sourceModuleCode: 'MOD_E_OPERATIONS',
            signOffNote: 'LEO-compliant €30,000 expenditure schedule with zero ineligible mobile hardware.',
          },
          {
            code: 'APPENDIX_D',
            title: 'Appendix D: Promoter Profile & Verified Curriculum Vitae',
            included: true,
            readinessStatus: 'VERIFIED_READY',
            sourceModuleCode: 'MOD_F_COFOUNDER_TEAM',
            signOffNote: 'Thomas Walsh comprehensive CV, SYOB certification, and verified 150-word promoter bio.',
          },
          {
            code: 'APPENDIX_E',
            title: 'Appendix E: 36-Month Projected Cashflow & P&L Statement',
            included: true,
            readinessStatus: 'VERIFIED_READY',
            sourceModuleCode: 'MOD_J_FINANCE',
            signOffNote: 'Fully integrated monthly cashflow model showing Year 1–3 turnover, PRSI, VAT, and trough analysis.',
          },
          {
            code: 'APPENDIX_F',
            title: 'Appendix F: Non-Displacement Justification & Export Strategy Memo',
            included: true,
            readinessStatus: 'VERIFIED_READY',
            sourceModuleCode: 'MOD_K_GRANTS_FUNDING',
            signOffNote: 'Formal declaration confirming international B2B software export focus and zero local displacement.',
          },
        ],
      },
      step5DossierBrief: {
        executiveDossierSummary:
          'Startup Sidekick represents a fully validated, technically robust, and economically sound enterprise initiative. The plan demonstrates zero internal contradictions, audit-tested financial viability, and complete compliance with Irish statutory grant criteria.',
        committeeReadinessScore: 100,
        finalSubmissionChecklist: [
          'LEO Feasibility Study Application Form completed and signed',
          'Appendices A through F verified and bound',
          'Bank statement verifying €15,000 promoter matching funds attached',
          'eTax Clearance Certificate confirmed valid',
          'CRO Certificate of Incorporation attached',
        ],
      },
      versions: [
        {
          id: 'ver-1',
          title: 'Official IE LEO Feasibility Grant Application Dossier (Final)',
          archetype: 'IE_LEO_OFFICIAL_GRANT',
          createdAt: nowIso,
          lastEditedAt: nowIso,
          isPrimary: true,
          targetAudience: 'GRANT_COMMITTEE',
        },
        {
          id: 'ver-2',
          title: 'Executive Investor Summary Memo (Angel / Pre-Seed)',
          archetype: 'INVESTOR_ANGEL_MEMO',
          createdAt: nowIso,
          lastEditedAt: nowIso,
          isPrimary: false,
          targetAudience: 'ANGEL_INVESTOR',
        },
      ],
      activeVersionId: 'ver-1',
    },
    aiThingsToConsiderJsonb: [],
  });

  // 6. Insert sample items into openQuestionsParkingLot
  await db.insert(openQuestionsParkingLot).values([
    {
      planId: newPlan.id,
      sourceModule: 'MOD_B_MARKET',
      questionText: 'Should we offer discounted annual passes for founders who already have a company incorporated?',
      status: 'RESOLVED',
      resolutionNotes: 'Resolved: Kept simple with 6-month one-off passes (€129/€199) + €9/month Living Vault micro-subscription to maximize conversion velocity.',
      resolvedAt: new Date(),
    },
    {
      planId: newPlan.id,
      sourceModule: 'MOD_K_GRANTS_FUNDING',
      questionText: 'Confirm whether Enterprise Ireland Digital Discovery Voucher can run in parallel with LEO Priming.',
      status: 'RESOLVED',
      resolutionNotes: 'Confirmed: EI vouchers can be stacked with LEO grants provided expenditure items are distinct and non-overlapping.',
      resolvedAt: new Date(),
    },
  ]);

  // 7. Update Thomas's founderProfileJson.lastActivePlanId so workspace opens this immediately
  const existingProfile = thomas.founderProfileJson || {};
  await db
    .update(users)
    .set({
      founderProfileJson: {
        ...existingProfile,
        lastActivePlanId: newPlan.id,
      },
      updatedAt: new Date(),
    })
    .where(eq(users.id, thomas.id));

  console.log('✅ Updated Thomas Walsh lastActivePlanId to Startup Sidekick!');
  console.log(`🎉 Successfully seeded 100% completed Startup Sidekick plan (${newPlan.id})!`);
  process.exit(0);
}

seedStartupSidekick().catch((err) => {
  console.error('❌ Error seeding Startup Sidekick:', err);
  process.exit(1);
});
