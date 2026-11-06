'use server';

import fs from 'fs';
import path from 'path';
import type { ModuleCode } from '@/lib/entitlements';
import {
  getAdminSessionCookie,
  getServerSessionCookie,
  checkRateLimit,
} from '@/lib/auth/server-auth';
import {
  PERSONA_ARCHETYPES,
  COMPREHENSION_LEVELS,
  PLATFORM_MODULES_CATALOG,
  JARGON_LEXICON_RULES,
  type PersonaArchetypeId,
  type ComprehensionLevelId,
  type AuditViewportId,
  type ModuleAuditSummaryItem,
  type PersonaAuditFinding,
  type PersonaAuditReport,
  type ModuleBuildLifecycleStatus,
  type CognitiveLoadRating,
} from '@/lib/personas/persona-audit-engine';

interface SourceFileInspectionResult {
  exists: boolean;
  filePath: string;
  content: string;
  lineCount: number;
}

function readWorkspaceSourceFile(relativeFilePath: string): SourceFileInspectionResult {
  try {
    const absPath = path.join(process.cwd(), relativeFilePath);
    if (!fs.existsSync(absPath)) {
      return {
        exists: false,
        filePath: relativeFilePath,
        content: '',
        lineCount: 0,
      };
    }
    const content = fs.readFileSync(absPath, 'utf8');
    return {
      exists: true,
      filePath: relativeFilePath,
      content,
      lineCount: content.split('\n').length,
    };
  } catch {
    return {
      exists: false,
      filePath: relativeFilePath,
      content: '',
      lineCount: 0,
    };
  }
}

/**
 * Extracts the slice of `src/app/(workspace)/workspace/page.tsx` relevant to a specific module
 * when a module is implemented inline or as a scaffold inside workspace/page.tsx.
 */
function extractModuleSliceFromMainWorkspace(
  mainWorkspaceContent: string,
  moduleCode: ModuleCode
): string {
  if (!mainWorkspaceContent) return '';
  const idx = mainWorkspaceContent.indexOf(moduleCode);
  if (idx === -1) return '';
  // For Module A, grab the main Module A rendering region
  if (moduleCode === 'MOD_A_IDEATION') {
    const modAStart = mainWorkspaceContent.indexOf('{/* Module A Top Header Banner');
    const fallbackStart = mainWorkspaceContent.indexOf("activeModule === 'MOD_A_IDEATION'");
    const start = modAStart !== -1 ? modAStart : fallbackStart;
    if (start !== -1) {
      const endIdx = mainWorkspaceContent.indexOf('{/* LAYER 2: SLIDE-OUT "ASK PREFLIGHT AI"', start);
      if (endIdx !== -1) {
        return mainWorkspaceContent.slice(start, endIdx);
      }
      return mainWorkspaceContent.slice(start, start + 180000);
    }
  }
  return mainWorkspaceContent.slice(Math.max(0, idx - 500), idx + 35000);
}

/**
 * Dynamically audits all 12 modules (A–L) against the selected Persona, Comprehension Level (L1–L4),
 * and Viewport Matrix (Mobile 375px / Tablet 768px / Laptop 1366px).
 * Never crashes on unfinished modules—automatically detects live vs scaffold modules.
 */
export async function runPersonaPlatformAuditAction(input: {
  personaId: PersonaArchetypeId;
  comprehensionId: ComprehensionLevelId;
  viewports?: AuditViewportId[];
  moduleFilter?: ModuleCode | 'ALL';
}): Promise<{
  ok: boolean;
  report: PersonaAuditReport;
}> {
  const adminSession = await getAdminSessionCookie();
  const founderSession = await getServerSessionCookie();
  const callerId = adminSession?.userId || founderSession?.userId || 'anon';
  const rl = checkRateLimit(`persona_audit:${callerId}`, 15, 60_000);
  if (!rl.allowed || (process.env.NODE_ENV === 'production' && !adminSession)) {
    throw new Error('Unauthorized or rate-limited persona audit request.');
  }

  const persona =
    PERSONA_ARCHETYPES.find((p) => p.id === input.personaId) ||
    PERSONA_ARCHETYPES[0];
  const comprehension =
    COMPREHENSION_LEVELS.find((c) => c.id === input.comprehensionId) ||
    COMPREHENSION_LEVELS[0];
  const selectedViewports: AuditViewportId[] =
    input.viewports && input.viewports.length > 0
      ? input.viewports
      : ['MOBILE_375', 'TABLET_768', 'LAPTOP_1366'];

  const mainWorkspace = readWorkspaceSourceFile(
    'src/app/(workspace)/workspace/page.tsx'
  );

  const moduleSummaries: ModuleAuditSummaryItem[] = [];
  const findings: PersonaAuditFinding[] = [];
  const flaggedJargonSet = new Set<string>();

  for (const modMeta of PLATFORM_MODULES_CATALOG) {
    const isModA = modMeta.code === 'MOD_A_IDEATION';
    const standaloneFile = readWorkspaceSourceFile(modMeta.expectedStandaloneFile);

    let buildStatus: ModuleBuildLifecycleStatus = 'SCAFFOLD_UNFINISHED';
    let analyzedContent = '';
    let activeTargetFilePath = modMeta.expectedStandaloneFile;

    if (isModA && mainWorkspace.exists) {
      buildStatus = 'LIVE_INLINE';
      analyzedContent = extractModuleSliceFromMainWorkspace(
        mainWorkspace.content,
        'MOD_A_IDEATION'
      );
      activeTargetFilePath = 'src/app/(workspace)/workspace/page.tsx';
    } else if (standaloneFile.exists && standaloneFile.lineCount > 250) {
      buildStatus = 'LIVE_STANDALONE';
      analyzedContent = standaloneFile.content;
      activeTargetFilePath = modMeta.expectedStandaloneFile;
    } else {
      buildStatus = 'SCAFFOLD_UNFINISHED';
      analyzedContent = extractModuleSliceFromMainWorkspace(
        mainWorkspace.content,
        modMeta.code
      );
      activeTargetFilePath = modMeta.expectedStandaloneFile;
    }

    // Detect structural invariants from live source
    const hasCollapsibleStepState =
      analyzedContent.includes('openStep') ||
      analyzedContent.includes('setOpenStep');
    const hasExpandAllToggle =
      analyzedContent.includes('Expand All Steps') ||
      analyzedContent.includes('Focus Step-by-Step');
    const hasOverviewBriefStep =
      analyzedContent.includes('Brief') &&
      (analyzedContent.includes('Open Overview') ||
        analyzedContent.includes('Things to Consider') ||
        analyzedContent.includes('Readiness'));
    const hasOtherOptionCoverage =
      analyzedContent.includes("'OTHER'") || analyzedContent.includes('"OTHER"');
    const hasMicroCoachingWhyCards =
      analyzedContent.includes('Why Are We Asking This') ||
      analyzedContent.includes('Why we ask') ||
      analyzedContent.includes('Assessor Lens');
    const hasShowMeExampleCards =
      analyzedContent.includes('Show Me an Example') ||
      analyzedContent.includes('Example') ||
      analyzedContent.includes('Benchmark');
    const hasParkOpenQuestionHook =
      analyzedContent.includes('Park It') ||
      analyzedContent.includes('Open Questions') ||
      analyzedContent.includes('onParkQuestion');

    // Estimate step count
    const stepMatches = analyzedContent.match(/openStep\s*===\s*\d+/g) || [];
    const uniqueSteps = new Set(stepMatches.map((m) => m.replace(/\D+/g, '')));
    const detectedStepsCount =
      buildStatus === 'SCAFFOLD_UNFINISHED'
        ? 0
        : Math.max(uniqueSteps.size, isModA ? 8 : 4);

    const moduleFindings: PersonaAuditFinding[] = [];

    // ------------------------------------------------------------------------
    // CASE 1: UNFINISHED / SCAFFOLD MODULE (Graceful Handling!)
    // ------------------------------------------------------------------------
    if (buildStatus === 'SCAFFOLD_UNFINISHED') {
      moduleFindings.push({
        id: `${modMeta.code}-unfinished-spec`,
        moduleCode: modMeta.code,
        moduleShortName: modMeta.shortName,
        stepLabel: 'Module Architecture & Build Readiness',
        targetFilePath: modMeta.expectedStandaloneFile,
        category: 'UNFINISHED_MODULE_SPEC',
        severity: 'SUGGESTION',
        viewport: 'ALL_VIEWPORTS',
        comprehensionLevel: comprehension.id,
        personaId: persona.id,
        title: `${modMeta.shortName} is currently a work-in-progress scaffold — Ready for Full Build`,
        personaFirstPersonQuote: `As ${persona.name} (${comprehension.shortBadge}), I haven't filled out ${modMeta.shortName} (${modMeta.title}) yet because this module is still being built. When you build it, make sure the steps use plain-English examples for ${persona.industryCategory}!`,
        technicalFinding: `No standalone workspace file found at \`${modMeta.expectedStandaloneFile}\`. The checker automatically marked ${modMeta.shortName} as \`SCAFFOLD_UNFINISHED\` so it does not penalize your live modules.`,
        recommendedFix: `When you are ready to build ${modMeta.shortName}, click "Copy Build-to-Standard Prompt" on this card to generate the full \`${modMeta.expectedStandaloneFile}\` component with Collapsible Steps, ${comprehension.shortBadge} plain-English tooltips, "OTHER" selectors, and Mobile/Tablet/Laptop responsive invariants.`,
      });

      moduleSummaries.push({
        moduleCode: modMeta.code,
        shortName: modMeta.shortName,
        title: modMeta.title,
        targetFilePath: activeTargetFilePath,
        buildStatus,
        detectedStepsCount: 0,
        hasCollapsibleStepState: false,
        hasExpandAllToggle: false,
        hasOverviewBriefStep: false,
        hasOtherOptionCoverage: false,
        hasMicroCoachingWhyCards: false,
        hasShowMeExampleCards: false,
        hasParkOpenQuestionHook: false,
        clarityScore: 100,
        formattingScore: 100,
        viewportScore: 100,
        personaFitScore: 100,
        followabilityScore: 100,
        cognitiveLoadRating: 'EFFORTLESS_TO_FOLLOW',
        personaCheckInSummary: 'Scaffold module awaiting implementation.',
        issuesCount: moduleFindings.length,
      });

      if (
        !input.moduleFilter ||
        input.moduleFilter === 'ALL' ||
        input.moduleFilter === modMeta.code
      ) {
        findings.push(...moduleFindings);
      }
      continue;
    }

    // ------------------------------------------------------------------------
    // CASE 2: LIVE BUILT MODULE — DEEP CODE, COMPREHENSION, PERSONA & VIEWPORT AUDIT
    // ------------------------------------------------------------------------

    // 2A. Check Jargon & Comprehension Level (L1 - L4)
    for (const rule of JARGON_LEXICON_RULES) {
      if (!rule.flaggedAtLevels.includes(comprehension.id)) continue;

      const patternStr = rule.termPattern.includes('/')
        ? rule.termPattern.replace(/\//g, '\\/')
        : `\\b${rule.termPattern}\\b`;
      const regex = new RegExp(patternStr, 'i');
      if (regex.test(analyzedContent)) {
        // Check if plain-English helper or tooltip is already right next to it or replaces it
        const hasPlainExplanationNearby =
          analyzedContent.includes(rule.plainEnglishReplacement) ||
          analyzedContent.includes(rule.inlineTooltipExplanation) ||
          analyzedContent.toLowerCase().includes('simply means') ||
          analyzedContent.toLowerCase().includes('in plain terms');

        if (!hasPlainExplanationNearby) {
          flaggedJargonSet.add(rule.displayTerm);
          moduleFindings.push({
            id: `${modMeta.code}-jargon-${rule.termPattern.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
            moduleCode: modMeta.code,
            moduleShortName: modMeta.shortName,
            stepLabel: `Step Labels & Micro-Coaching (${rule.displayTerm})`,
            targetFilePath: activeTargetFilePath,
            category: 'COMPREHENSION_JARGON',
            severity:
              comprehension.id === 'L1_EVERYDAY' ? 'IMPORTANT' : 'SUGGESTION',
            viewport: 'ALL_VIEWPORTS',
            comprehensionLevel: comprehension.id,
            personaId: persona.id,
            title: `Jargon Check (${comprehension.shortBadge}): "${rule.displayTerm}" needs a simpler everyday label`,
            personaFirstPersonQuote: `As ${persona.name} reading at ${comprehension.shortBadge}, when I see "${rule.displayTerm}" in ${modMeta.shortName}, I have to stop and guess what that means for my ${persona.industryCategory.toLowerCase()} business.`,
            technicalFinding: `Detected term \`${rule.termPattern}\` in \`${activeTargetFilePath}\`. For ${comprehension.label}, formal startup/grant terminology should lead with a plain-English phrase and tuck the technical term into brackets or an inline tooltip.`,
            recommendedFix: `Update the visible heading/label in \`${activeTargetFilePath}\` to lead with "${rule.plainEnglishReplacement}" and include an inline tooltip explaining "${rule.displayTerm}".`,
            suggestedPlainEnglishCopy: `${rule.plainEnglishReplacement} — (${rule.inlineTooltipExplanation})`,
          });
        }
      }
    }

    // 2B. Check Viewport Matrix (Mobile 375px / Tablet 768px / Laptop 1366px)
    if (selectedViewports.includes('MOBILE_375')) {
      // Check 1: iOS Safari < 16px auto-zoom check on <input> / <textarea>
      const rawSmallInputMatches =
        analyzedContent.match(
          /<(input|textarea|select)[^>]*className="[^"]*text-(xs|sm)(?!\s+sm:text-)[^"]*"/g
        ) || [];
      if (rawSmallInputMatches.length > 0 && !analyzedContent.includes('text-base sm:text-')) {
        moduleFindings.push({
          id: `${modMeta.code}-mobile-ios-zoom`,
          moduleCode: modMeta.code,
          moduleShortName: modMeta.shortName,
          stepLabel: 'Form Inputs & Textareas (Mobile 375px)',
          targetFilePath: activeTargetFilePath,
          category: 'VIEWPORT_RESPONSIVE',
          severity: 'IMPORTANT',
          viewport: 'MOBILE_375',
          comprehensionLevel: comprehension.id,
          personaId: persona.id,
          title: `Mobile (375px) iOS Safari Auto-Zoom Risk on ${rawSmallInputMatches.length} Form Input(s)`,
          personaFirstPersonQuote: `When I tap into a text box in ${modMeta.shortName} on my phone (375px width), iOS Safari zooms the screen in if the input font class is \`text-xs\` or \`text-sm\` without \`text-base sm:text-xs\`.`,
          technicalFinding: `Found ${rawSmallInputMatches.length} \`<input>\`/\`<textarea>\`/\`<select>\` element(s) in \`${activeTargetFilePath}\` using \`text-xs\` or \`text-sm\` directly without \`text-base sm:text-xs\` / \`text-base sm:text-sm\`.`,
          recommendedFix: `Update form input \`className\` strings in \`${activeTargetFilePath}\` to use \`text-base sm:text-xs\` or \`text-base sm:text-sm\` per GEMINI.md Section 5.2.`,
        });
      }

      // Check 2: Tables without overflow-x-auto on Mobile 375px
      const tableCount = (analyzedContent.match(/<table\b/g) || []).length;
      const overflowXCount = (analyzedContent.match(/overflow-x-auto/g) || []).length;
      if (tableCount > 0 && overflowXCount < tableCount) {
        moduleFindings.push({
          id: `${modMeta.code}-mobile-table-overflow`,
          moduleCode: modMeta.code,
          moduleShortName: modMeta.shortName,
          stepLabel: 'Comparison / Financial Tables (Mobile 375px)',
          targetFilePath: activeTargetFilePath,
          category: 'VIEWPORT_RESPONSIVE',
          severity: 'CRITICAL',
          viewport: 'MOBILE_375',
          comprehensionLevel: comprehension.id,
          personaId: persona.id,
          title: `Mobile (375px) Horizontal Table Overflow Risk in ${modMeta.shortName}`,
          personaFirstPersonQuote: `On my 375px phone screen, the multi-column table in ${modMeta.shortName} pushes wider than the card border, making it hard to read the right-hand columns.`,
          technicalFinding: `Detected ${tableCount} \`<table>\` element(s) in \`${activeTargetFilePath}\` but only ${overflowXCount} \`overflow-x-auto\` wrapper(s).`,
          recommendedFix: `Wrap every \`<table>\` in \`${activeTargetFilePath}\` inside \`<div className="overflow-x-auto"><table className="min-w-[600px] w-full ...">\` so mobile users can swipe horizontally cleanly.`,
        });
      }
    }

    if (selectedViewports.includes('TABLET_768')) {
      // Check Tablet 768px (sm:grid-cols-3 or sm:grid-cols-4 without md:/lg: stepping)
      const denseSmGrids =
        analyzedContent.match(/sm:grid-cols-(3|4)(?!\s+md:|\s+lg:)/g) || [];
      if (denseSmGrids.length > 2) {
        moduleFindings.push({
          id: `${modMeta.code}-tablet-grid-density`,
          moduleCode: modMeta.code,
          moduleShortName: modMeta.shortName,
          stepLabel: 'Option Tile Grids & KPI Cards (Tablet 768px)',
          targetFilePath: activeTargetFilePath,
          category: 'VIEWPORT_RESPONSIVE',
          severity: 'SUGGESTION',
          viewport: 'TABLET_768',
          comprehensionLevel: comprehension.id,
          personaId: persona.id,
          title: `Tablet (768×1024) Card Grid Squeeze (${denseSmGrids.length} multi-column grids)`,
          personaFirstPersonQuote: `On my iPad in portrait mode (768px), ${modMeta.shortName} puts 3 or 4 option cards into a single row right at 640px+, which makes longer titles and badges wrap onto multiple lines.`,
          technicalFinding: `Found ${denseSmGrids.length} instances of \`sm:grid-cols-3\` or \`sm:grid-cols-4\` in \`${activeTargetFilePath}\` without an intermediate \`sm:grid-cols-2 lg:grid-cols-3\` progression for 768px tablets.`,
          recommendedFix: `Change dense tile grids in \`${activeTargetFilePath}\` from \`grid-cols-1 sm:grid-cols-3\` to \`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3\` (or \`xl:grid-cols-4\`) so 768px iPad portrait cards have comfortable breathing room.`,
        });
      }
    }

    if (selectedViewports.includes('LAPTOP_1366')) {
      // Check Laptop 1366x768 header button wrapping & Collapsible Step standard
      if (!hasCollapsibleStepState || !hasExpandAllToggle) {
        moduleFindings.push({
          id: `${modMeta.code}-laptop-collapsible-steps`,
          moduleCode: modMeta.code,
          moduleShortName: modMeta.shortName,
          stepLabel: 'Module Header & Step Accordion (Laptop 1366×768)',
          targetFilePath: activeTargetFilePath,
          category: 'FORMATTING_TYPOGRAPHY',
          severity: 'IMPORTANT',
          viewport: 'LAPTOP_1366',
          comprehensionLevel: comprehension.id,
          personaId: persona.id,
          title: `Laptop (1366×768) Vertical Scroll Fatigue — Ensure Full Collapsible Step Accordion`,
          personaFirstPersonQuote: `On my 13" laptop (1366×768), vertical screen height is tight. I need to be able to collapse completed steps or toggle "Focus Step-by-Step" so I don't have to scroll forever.`,
          technicalFinding: `Module \`${modMeta.code}\` in \`${activeTargetFilePath}\` is missing ${!hasCollapsibleStepState ? '`openStep` collapsible accordion state' : '`Expand All Steps / Focus Step-by-Step` toggle button'} required by GEMINI.md Section 6.`,
          recommendedFix: `Ensure \`${activeTargetFilePath}\` implements \`const [openStep, setOpenStep] = useState<number | 'ALL'>(...)\` and renders the top header \`Expand All Steps\` / \`Focus Step-by-Step\` button and Overview Brief step.`,
        });
      }
    }

    // 2C. Check GEMINI.md Section 1.5 ("OTHER" Option Invariant)
    if (!hasOtherOptionCoverage) {
      moduleFindings.push({
        id: `${modMeta.code}-missing-other-option`,
        moduleCode: modMeta.code,
        moduleShortName: modMeta.shortName,
        stepLabel: 'Tile & Pill Selectors ("OTHER" Edge-Case Protection)',
        targetFilePath: activeTargetFilePath,
        category: 'EDGE_CASE_OTHER_OPTION',
        severity: 'IMPORTANT',
        viewport: 'ALL_VIEWPORTS',
        comprehensionLevel: comprehension.id,
        personaId: persona.id,
        title: `Missing "OTHER" Custom Option on Tile/Pill Selectors in ${modMeta.shortName}`,
        personaFirstPersonQuote: `As ${persona.name} (${persona.businessTitle}), my model doesn't always fit standard preset tiles. I need an "Other (Specify)" option so I don't feel boxed in.`,
        technicalFinding: `Did not detect \`'OTHER'\` option values in \`${activeTargetFilePath}\` per GEMINI.md Section 1.5.`,
        recommendedFix: `Add an \`"OTHER"\` option to all single-select and multi-select tile/pill groups in \`${activeTargetFilePath}\` that reveals an inline custom text input persisted to the plan state and rendered in the Overview Brief.`,
      });
    }

    // 2D. Persona-Specific Model Fit Checks
    if (
      persona.id === 'AOIFE_IE_FOOD' &&
      (modMeta.code === 'MOD_D_PRODUCT_BUILD' || modMeta.code === 'MOD_H_REVENUE') &&
      !analyzedContent.toLowerCase().includes('wholesale') &&
      !analyzedContent.toLowerCase().includes('retail')
    ) {
      moduleFindings.push({
        id: `${modMeta.code}-aoife-food-fit`,
        moduleCode: modMeta.code,
        moduleShortName: modMeta.shortName,
        stepLabel: 'Industry Examples & Presets (Physical Food & Retail)',
        targetFilePath: activeTargetFilePath,
        category: 'PERSONA_MODEL_FIT',
        severity: 'SUGGESTION',
        viewport: 'ALL_VIEWPORTS',
        comprehensionLevel: comprehension.id,
        personaId: persona.id,
        title: `Add Physical Product / Food & Wholesale Examples in ${modMeta.shortName}`,
        personaFirstPersonQuote: `As Aoife making canned functional drinks in Cork, make sure the examples and placeholders in ${modMeta.shortName} mention physical units, cases, and retail/wholesale margins—not just monthly software subscriptions!`,
        technicalFinding: `Persona fit check for \`AOIFE_IE_FOOD\` (${persona.industryCategory}) in \`${activeTargetFilePath}\`.`,
        recommendedFix: `Include physical product / food & drink examples (e.g., cost per batch/case, retail stockist margin vs D2C online checkout) in the "Show Me an Example" cards and placeholders of \`${activeTargetFilePath}\`.`,
      });
    }

    if (
      persona.id === 'SARAH_IE_STUCK' &&
      (!hasMicroCoachingWhyCards || !hasParkOpenQuestionHook)
    ) {
      moduleFindings.push({
        id: `${modMeta.code}-sarah-momentum-support`,
        moduleCode: modMeta.code,
        moduleShortName: modMeta.shortName,
        stepLabel: '4-Layer Built-In Support & Momentum Protection',
        targetFilePath: activeTargetFilePath,
        category: 'MICRO_COACHING_SUPPORT',
        severity: 'IMPORTANT',
        viewport: 'ALL_VIEWPORTS',
        comprehensionLevel: comprehension.id,
        personaId: persona.id,
        title: `Strengthen "I'm Stuck / Park Question" Support in ${modMeta.shortName}`,
        personaFirstPersonQuote: `As a first-time founder who gets overwhelmed by numbers, if a step in ${modMeta.shortName} doesn't have a clear "Why Are We Asking This?" card or a "Park It in Open Questions" button, I get stuck and close the tab.`,
        technicalFinding: `Checked \`${activeTargetFilePath}\` for 4-Layer Built-In Support hooks: \`hasMicroCoachingWhyCards=${hasMicroCoachingWhyCards}\`, \`hasParkOpenQuestionHook=${hasParkOpenQuestionHook}\`.`,
        recommendedFix: `Ensure every core step in \`${activeTargetFilePath}\` includes a collapsible "Why Are We Asking This?" helper, an industry-aware "Show Me an Example" button, and a "Park It in Open Questions" button wired to \`onParkQuestion\`.`,
      });
    }

    // Compute 0-100 scores for this live module
    const jargonFindingsCount = moduleFindings.filter(
      (f) => f.category === 'COMPREHENSION_JARGON'
    ).length;
    const viewportFindingsCount = moduleFindings.filter(
      (f) => f.category === 'VIEWPORT_RESPONSIVE'
    ).length;

    const clarityScore = Math.max(
      60,
      100 -
        jargonFindingsCount * 10 -
        (hasMicroCoachingWhyCards ? 0 : 12) -
        (hasShowMeExampleCards ? 0 : 8)
    );
    const formattingScore = Math.max(
      65,
      100 -
        (hasCollapsibleStepState ? 0 : 15) -
        (hasExpandAllToggle ? 0 : 10) -
        (hasOverviewBriefStep ? 0 : 15)
    );
    const viewportScore = Math.max(60, 100 - viewportFindingsCount * 14);
    const personaFitScore = Math.max(
      68,
      100 -
        (hasOtherOptionCoverage ? 0 : 15) -
        (hasParkOpenQuestionHook ? 0 : 10) -
        moduleFindings.filter((f) => f.category === 'PERSONA_MODEL_FIT').length * 10
    );

    const followabilityScore = Math.max(
      60,
      100 - (hasMicroCoachingWhyCards ? 0 : 15) - (hasShowMeExampleCards ? 0 : 15) - moduleFindings.length * 2
    );
    const cognitiveLoadRating: CognitiveLoadRating =
      followabilityScore >= 80
        ? 'EFFORTLESS_TO_FOLLOW'
        : followabilityScore >= 65
        ? 'SLIGHT_FRICTION'
        : 'TOO_COMPLICATED_OVERWHELMING';

    moduleSummaries.push({
      moduleCode: modMeta.code,
      shortName: modMeta.shortName,
      title: modMeta.title,
      targetFilePath: activeTargetFilePath,
      buildStatus,
      detectedStepsCount,
      hasCollapsibleStepState,
      hasExpandAllToggle,
      hasOverviewBriefStep,
      hasOtherOptionCoverage,
      hasMicroCoachingWhyCards,
      hasShowMeExampleCards,
      hasParkOpenQuestionHook,
      clarityScore,
      formattingScore,
      viewportScore,
      personaFitScore,
      followabilityScore,
      cognitiveLoadRating,
      personaCheckInSummary: `${persona.name} finds ${modMeta.shortName} followable with score ${followabilityScore}/100.`,
      issuesCount: moduleFindings.length,
    });

    if (
      !input.moduleFilter ||
      input.moduleFilter === 'ALL' ||
      input.moduleFilter === modMeta.code
    ) {
      findings.push(...moduleFindings);
    }
  }

  // Compute overall health score across LIVE built modules so unfinished modules don't drag down the score
  const liveModules = moduleSummaries.filter(
    (m) => m.buildStatus !== 'SCAFFOLD_UNFINISHED'
  );
  const overallHealthScore =
    liveModules.length > 0
      ? Math.round(
          liveModules.reduce(
            (acc, m) =>
              acc +
              (m.clarityScore +
                m.formattingScore +
                m.viewportScore +
                m.personaFitScore) /
                4,
            0
          ) / liveModules.length
        )
      : 100;

  const report: PersonaAuditReport = {
    generatedAt: new Date().toISOString(),
    persona,
    comprehension,
    selectedViewports,
    overallHealthScore,
    readabilitySummary: {
      estimatedReadingGrade:
        flaggedJargonSet.size === 0
          ? 'Grade 7–8 (Plain Commercial English — Passes L1–L4)'
          : flaggedJargonSet.size <= 3
            ? 'Grade 9–10 (Mostly Clear — Minor Jargon to Simplify for L1)'
            : 'Grade 11–12 (Startup/Grant Dense — Needs Plain-English Sub-Labels for L1/L2)',
      jargonTermsFlaggedCount: flaggedJargonSet.size,
      flaggedTerms: Array.from(flaggedJargonSet),
      overallFollowabilityVerdict:
        overallHealthScore >= 80
          ? 'Clear and intuitive across tested founder personas.'
          : 'High cognitive load detected in technical or grant sections.',
      modulesFlaggedTooComplicatedCount: moduleSummaries.filter(
        (m) => m.cognitiveLoadRating === 'TOO_COMPLICATED_OVERWHELMING'
      ).length,
    },
    followabilityCheckIns: [],
    moduleSummaries,
    findings,
  };

  return {
    ok: true,
    report,
  };
}
