import fs from 'fs';
import path from 'path';
import {
  PERSONA_ARCHETYPES,
  COMPREHENSION_LEVELS,
  generateAntigravityBatchFixPrompt,
  generateUnfinishedModuleBuildPrompt,
  type PersonaArchetypeId,
  type ComprehensionLevelId,
} from '../src/lib/personas/persona-audit-engine';
import { runPersonaPlatformAuditAction } from '../src/app/actions/persona-audit';

async function main() {
  const args = process.argv.slice(2);
  const personaArg = args
    .find((a) => a.startsWith('--persona='))
    ?.split('=')[1]
    ?.toUpperCase() as PersonaArchetypeId | undefined;
  const levelArg = args
    .find((a) => a.startsWith('--level='))
    ?.split('=')[1]
    ?.toUpperCase() as ComprehensionLevelId | undefined;

  const personaId: PersonaArchetypeId =
    PERSONA_ARCHETYPES.find((p) => p.id === personaArg)?.id || 'AOIFE_IE_FOOD';
  const comprehensionId: ComprehensionLevelId =
    COMPREHENSION_LEVELS.find((l) => l.id === levelArg)?.id || 'L1_EVERYDAY';

  console.log('==============================================================');
  console.log(' Startup Preflight 2.0 — Synthetic Persona & UX Audit Runner');
  console.log('==============================================================');
  console.log(`• Persona:             ${personaId}`);
  console.log(`• Comprehension Lever: ${comprehensionId}`);
  console.log(`• Viewports Checked:   MOBILE_375, TABLET_768, LAPTOP_1366`);
  console.log('');

  const { report } = await runPersonaPlatformAuditAction({
    personaId,
    comprehensionId,
    viewports: ['MOBILE_375', 'TABLET_768', 'LAPTOP_1366'],
  });

  const liveModules = report.moduleSummaries.filter(
    (m) => m.buildStatus !== 'SCAFFOLD_UNFINISHED'
  );
  const unfinishedModules = report.moduleSummaries.filter(
    (m) => m.buildStatus === 'SCAFFOLD_UNFINISHED'
  );

  console.log(
    `✅ Audited ${report.moduleSummaries.length} Total Modules (${liveModules.length} Live Built, ${unfinishedModules.length} Scaffold/Unfinished)`
  );
  console.log(`📊 Overall Live Platform Health Score: ${report.overallHealthScore}/100`);
  console.log(
    `📖 Readability Estimate: ${report.readabilitySummary.estimatedReadingGrade}`
  );
  console.log('');

  for (const mod of report.moduleSummaries) {
    if (mod.buildStatus === 'SCAFFOLD_UNFINISHED') {
      console.log(
        `  [SCAFFOLD] ${mod.shortName.padEnd(10)} (${mod.moduleCode}) — Unfinished / Ready for Build Spec`
      );
    } else {
      console.log(
        `  [LIVE]     ${mod.shortName.padEnd(10)} (${mod.moduleCode}) — Clarity: ${mod.clarityScore}% | Viewports: ${mod.viewportScore}% | Formatting: ${mod.formattingScore}% | Findings: ${mod.issuesCount}`
      );
    }
  }

  const batchFixPrompt = generateAntigravityBatchFixPrompt({
    report,
    moduleFilter: 'ALL',
  });

  const unfinishedPrompts = unfinishedModules
    .map((m) =>
      generateUnfinishedModuleBuildPrompt(
        m,
        report.persona,
        report.comprehension
      )
    )
    .join('\n\n---\n\n');

  const markdownReport = [
    `# Startup Preflight 2.0 — Persona, Comprehension & 3-Viewport Audit Report`,
    `- **Generated At:** ${report.generatedAt}`,
    `- **Persona:** ${report.persona.name} (${report.persona.shortLabel})`,
    `- **Comprehension / Intelligence Lever:** ${report.comprehension.label}`,
    `- **Screen Sizes Checked:** Mobile (375×812), Tablet (768×1024), Laptop (1366×768)`,
    `- **Live Modules Health Score:** **${report.overallHealthScore}/100**`,
    `- **Readability Assessment:** ${report.readabilitySummary.estimatedReadingGrade}`,
    ``,
    `## 1. Module Build & Audit Matrix (All 12 Modules A–L)`,
    `| Module | Status | Steps | Clarity | Viewports | Formatting | "OTHER" Option | Findings |`,
    `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |`,
    ...report.moduleSummaries.map((m) =>
      m.buildStatus === 'SCAFFOLD_UNFINISHED'
        ? `| **${m.shortName}** (${m.title}) | \`SCAFFOLD_UNFINISHED\` | — | — | — | — | — | Ready for Build |`
        : `| **${m.shortName}** (${m.title}) | \`${m.buildStatus}\` | ${m.detectedStepsCount} | ${m.clarityScore}% | ${m.viewportScore}% | ${m.formattingScore}% | ${m.hasOtherOptionCoverage ? '✅ Yes' : '⚠️ Missing'} | ${m.issuesCount} |`
    ),
    ``,
    `---`,
    ``,
    batchFixPrompt,
    ``,
    `---`,
    ``,
    `# Build-to-Standard Prompts for Remaining Unfinished Modules (${unfinishedModules.map((m) => m.shortName).join(', ')})`,
    unfinishedPrompts,
  ].join('\n');

  const outPath = path.join(process.cwd(), 'PERSONA_UX_AUDIT_REPORT.md');
  fs.writeFileSync(outPath, markdownReport, 'utf8');
  console.log('');
  console.log(`📝 Wrote full audit report & Antigravity Fix Prompts to: ${outPath}`);
}

main().catch((err) => {
  console.error('Persona audit script failed:', err);
  process.exit(1);
});
