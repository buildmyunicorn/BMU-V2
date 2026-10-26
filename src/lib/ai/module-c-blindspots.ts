import type { BlindSpotItem } from '@/db/schema';
import type {
  SavedConceptCanvas,
  SavedCustomerInterviewLog,
  SavedModuleBData,
  SavedValidationSurvey,
} from '@/lib/auth/session-store';
import {
  getCountryRulePack,
  getGrantsForCountry,
  type SupportedCountryCode,
} from '@/lib/localization';

export interface DynamicModuleCBlindSpotInput {
  planTitle: string;
  industryCategory: string;
  hqCountryCode: SupportedCountryCode;
  exportPotential?: 'DOMESTIC_ONLY' | 'EXPORTING_INTERNATIONALLY' | boolean;
  conceptCanvas?: SavedConceptCanvas;
  moduleBData?: SavedModuleBData;
  surveys: SavedValidationSurvey[];
  activeSurvey?: SavedValidationSurvey;
  interviewLogs: SavedCustomerInterviewLog[];
}

/**
 * Strict guard: Module C Blind-Spot Checker & Validation Brief are ONLY unlocked
 * when the founder has at least one Customer Survey (with questions) OR at least
 * one logged 1-on-1 Customer Interview.
 */
export function hasModuleCValidationData(
  surveys: SavedValidationSurvey[] = [],
  interviewLogs: SavedCustomerInterviewLog[] = []
): boolean {
  const hasActiveSurvey = surveys.some(
    (s) => Array.isArray(s.questions) && s.questions.length > 0
  );
  const hasLoggedInterviews =
    Array.isArray(interviewLogs) && interviewLogs.length > 0;
  return hasActiveSurvey || hasLoggedInterviews;
}

/**
 * Generates 6 live, dynamic Module C ("Things to Consider") blind-spot cards
 * auditing the founder's Customer Surveys, "Mom Test" question quality,
 * real vs. simulated sample size, 1-on-1 Customer Interviews, politeness bias,
 * and early-bird waitlist conversion for Module D & Grant readiness.
 *
 * Returns `[]` if there are no surveys and no 1-on-1 interviews.
 */
export function buildDynamicModuleCBlindSpots(
  input: DynamicModuleCBlindSpotInput
): BlindSpotItem[] {
  const surveys = input.surveys || [];
  const interviewLogs = input.interviewLogs || [];

  if (!hasModuleCValidationData(surveys, interviewLogs)) {
    return [];
  }

  const countryPack = getCountryRulePack(input.hqCountryCode);
  const matchedGrants = getGrantsForCountry(input.hqCountryCode);
  const topGrant = matchedGrants[0];

  const validSurveys = surveys.filter((s) => s.questions.length > 0);
  const primarySurvey =
    input.activeSurvey && input.activeSurvey.questions.length > 0
      ? input.activeSurvey
      : validSurveys[0];

  const allQuestions = validSurveys.flatMap((s) => s.questions || []);
  const allResponses = validSurveys.flatMap((s) => s.responses || []);
  const realResponses = allResponses.filter((r) => !r.isSimulated);
  const simulatedResponses = allResponses.filter((r) => r.isSimulated);
  const waitlistResponses = allResponses.filter(
    (r) => r.joinedWaitlist && Boolean(r.respondentEmail?.trim())
  );
  const realWaitlistLeads = waitlistResponses.filter((r) => !r.isSimulated);

  const beachheadLabel =
    input.moduleBData?.beachhead?.beachheadSegment?.trim() ||
    input.conceptCanvas?.targetCustomer?.trim() ||
    'your target customer segment';

  // -------------------------------------------------------------------------
  // CARD 1: Sample Size & Real vs. Simulated Evidence Check
  // -------------------------------------------------------------------------
  const totalRealTouchpoints = realResponses.length + interviewLogs.length;

  const card1: BlindSpotItem =
    totalRealTouchpoints === 0
      ? {
          id: 'mod-c-bs-sample-size',
          category: 'Sample Size & Real-World Evidence',
          severity: 'WARNING',
          title:
            simulatedResponses.length > 0
              ? `Only Simulated Sample Responses Logged So Far (${simulatedResponses.length} Simulated, 0 Real)`
              : 'Zero Real Customer Responses or 1-on-1 Calls Logged Yet',
          explanation:
            simulatedResponses.length > 0
              ? `You have ${simulatedResponses.length} simulated test response(s) in your survey, which is great for previewing charts, but you have 0 real customer responses and 0 logged 1-on-1 interviews for ${input.planTitle}. Building Module D's product scope on unvalidated assumptions is the #1 cause of wasted V1 spend.`
              : `You have drafted your validation questions for ${input.planTitle}, but haven't collected any real survey responses or logged any 1-on-1 customer interviews yet.`,
          suggestedAction: primarySurvey
            ? `Publish & lock your "/v/${primarySurvey.publicSlug}" survey link, send it to 15–20 people matching "${beachheadLabel}" using the Outreach Kit, or log at least 3–5 real 1-on-1 discovery calls before locking your V1 feature list in Module D.`
            : `Log at least 5 real 1-on-1 customer discovery calls with "${beachheadLabel}" or publish a public "/v/[slug]" validation survey to gather baseline evidence.`,
        }
      : totalRealTouchpoints < 10
        ? {
            id: 'mod-c-bs-sample-size',
            category: 'Sample Size & Statistical Signal',
            severity: 'WARNING',
            title: `Early Sample Size (${realResponses.length} Real Survey Response${realResponses.length === 1 ? '' : 's'} + ${interviewLogs.length} 1-on-1 Call${interviewLogs.length === 1 ? '' : 's'})`,
            explanation: `You have ${totalRealTouchpoints} real customer data point(s) across ${validSurveys.length} survey(s) and ${interviewLogs.length} 1-on-1 interview(s). Below 10–15 total touchpoints, a single vocal outlier can skew your feature and pricing decisions.`,
            suggestedAction: `Aim for at least 15 real survey responses and 5 logged 1-on-1 calls with "${beachheadLabel}" so recurring pain patterns become undeniable before Module D.`,
          }
        : {
            id: 'mod-c-bs-sample-size',
            category: 'Sample Size & Statistical Signal',
            severity: 'INFO',
            title: `Strong Primary Evidence Base (${realResponses.length} Real Survey Responses + ${interviewLogs.length} 1-on-1 Calls)`,
            explanation: `You have collected ${realResponses.length} real survey response(s) and ${interviewLogs.length} 1-on-1 customer interview(s) (${totalRealTouchpoints} real customer touchpoints total). This puts ${input.planTitle} ahead of 90% of early-stage founders who build in the dark.`,
            suggestedAction: `Segment your top respondents by pain severity so you only design your V1 product (Module D) around the highest-urgency buyers, not casual browsers.`,
          };

  // -------------------------------------------------------------------------
  // CARD 2: Quantitative Survey vs. Qualitative 1-on-1 Balance
  // -------------------------------------------------------------------------
  const card2: BlindSpotItem =
    validSurveys.length > 0 && interviewLogs.length === 0
      ? {
          id: 'mod-c-bs-method-balance',
          category: 'Surveys vs. 1-on-1 Discovery Balance',
          severity: 'WARNING',
          title: `Surveys Created (${validSurveys.length}), But 0 1-on-1 Customer Interviews Logged`,
          explanation: `Multiple-choice surveys tell you WHAT percentage of people experience a problem, but they rarely reveal the emotional trigger, internal approval politics, or exact workaround workflow behind WHY they would switch to ${input.planTitle}.`,
          suggestedAction:
            waitlistResponses.length > 0
              ? `You already have ${waitlistResponses.length} waitlist lead(s)! Click "Log 1-on-1 Call" next to 3 of those leads in your Waitlist tab and run a 10-minute Mom-Test chat.`
              : `Switch to the "1-on-1 Customer Interviews" section in Module C and log at least 3 live 10-minute calls (Phone, Zoom, or Coffee Chat) alongside your survey.`,
        }
      : validSurveys.length === 0 && interviewLogs.length > 0
        ? {
            id: 'mod-c-bs-method-balance',
            category: 'Surveys vs. 1-on-1 Discovery Balance',
            severity: 'INFO',
            title: `${interviewLogs.length} 1-on-1 Interview${interviewLogs.length === 1 ? '' : 's'} Logged Without a Broad Survey Funnel`,
            explanation: `Your ${interviewLogs.length} 1-on-1 interview(s) provide rich qualitative quotes and deep context, which is fantastic. However, without an async "/v/[slug]" validation survey, you may miss broader quantitative pattern matching and automated waitlist email capture.`,
            suggestedAction: `Consider launching a 5-question Mom-Test survey in Module C using the problems uncovered in your 1-on-1 calls to test if the same pain holds true across 25+ people in "${beachheadLabel}".`,
          }
        : {
            id: 'mod-c-bs-method-balance',
            category: 'Surveys vs. 1-on-1 Discovery Balance',
            severity: 'INFO',
            title: `Balanced Hybrid Validation (${validSurveys.length} Survey${validSurveys.length === 1 ? '' : 's'} + ${interviewLogs.length} 1-on-1 Interview${interviewLogs.length === 1 ? '' : 's'})`,
            explanation: `Combining async survey data (${allResponses.length} total responses) with ${interviewLogs.length} 1-on-1 interview(s) gives you both statistical breadth and verbatim qualitative depth.`,
            suggestedAction: `Cross-check whether the #1 frustration selected in your survey matches the exact stories shared in your 1-on-1 calls. Any mismatch is a high-value positioning insight for Module G.`,
          };

  // -------------------------------------------------------------------------
  // CARD 3: "Mom Test" Bias & Tamper-Proof Integrity Audit
  // -------------------------------------------------------------------------
  const failedMomTestQuestions = allQuestions.filter((q) => !q.momTestPassed);
  const openTextQuestions = allQuestions.filter((q) => q.type === 'OPEN_TEXT');
  const unpublishedSurveys = validSurveys.filter((s) => !s.isPublished);

  const card3: BlindSpotItem =
    allQuestions.length > 0 && failedMomTestQuestions.length > 0
      ? {
          id: 'mod-c-bs-mom-test-bias',
          category: 'Mom-Test Bias & Question Integrity',
          severity: 'WARNING',
          title: `${failedMomTestQuestions.length} of ${allQuestions.length} Survey Question${failedMomTestQuestions.length === 1 ? '' : 's'} Flagged for Hypothetical / Pitch Bias`,
          explanation: `Questions like "Would you buy X?" or leading feature pitches invite polite compliments rather than factual truth. ${failedMomTestQuestions.length} question(s) in your survey have not passed the Mom Test check yet.`,
          suggestedAction: `Use the "Mom-Test Check & Rewrite" button in the Survey Builder to reframe flagged questions around past behavior ("When was the last time you dealt with...") before sharing your link.`,
        }
      : validSurveys.length > 0 && unpublishedSurveys.length > 0
        ? {
            id: 'mod-c-bs-mom-test-bias',
            category: 'Mom-Test Bias & Survey Lock Integrity',
            severity: 'INFO',
            title: `${unpublishedSurveys.length} Survey${unpublishedSurveys.length === 1 ? ' Is' : 's Are'} Still in Editable Draft Mode`,
            explanation: `All ${allQuestions.length} survey questions pass the Mom Test (${openTextQuestions.length} open-text question${openTextQuestions.length === 1 ? '' : 's'} included), but ${unpublishedSurveys.map((s) => `"${s.title}"`).join(', ')} has not been Published & Locked yet.`,
            suggestedAction: `Click "Publish & Lock Survey" before distributing your link externally so investors, accelerators, and grant assessors can trust that questions were never altered after responses arrived.`,
          }
        : {
            id: 'mod-c-bs-mom-test-bias',
            category: 'Mom-Test Bias & Evidence Integrity',
            severity: 'INFO',
            title:
              validSurveys.length > 0
                ? `100% Mom-Test Checked & Tamper-Proof Published Survey`
                : `1-on-1 Discovery Anchored in Past Customer Behavior`,
            explanation:
              validSurveys.length > 0
                ? `Your survey questions focus on concrete past behavior rather than hypotheticals, and your published survey is locked against retroactive edits.`
                : `Logging structured 1-on-1 interviews with concrete workaround notes and pain scores protects ${input.planTitle} from "false positive" politeness.`,
            suggestedAction: `Keep capturing exact verbatim customer phrases — those raw words will become your highest-converting landing page headline in Module G.`,
          };

  // -------------------------------------------------------------------------
  // CARD 4: "Polite Compliments" vs. Concrete Commitment Signal
  // -------------------------------------------------------------------------
  const politeFluffInterviews = interviewLogs.filter(
    (i) =>
      i.signalBadge === 'POLITE_FLUFF' ||
      i.commitmentOutcome === 'POLITE_COMPLIMENTS_ONLY'
  );
  const highSignalInterviews = interviewLogs.filter(
    (i) =>
      i.signalBadge === 'STRONG_SIGNAL' ||
      i.commitmentOutcome === 'ASKED_TO_PILOT_OR_BUY' ||
      i.commitmentOutcome === 'SHARED_DEEP_WORKFLOW_PAIN' ||
      i.commitmentOutcome === 'INTRODUCED_PEERS'
  );
  const avgInterviewPain =
    interviewLogs.length > 0
      ? Number(
          (
            interviewLogs.reduce((acc, i) => acc + i.painScore1To5, 0) /
            interviewLogs.length
          ).toFixed(1)
        )
      : null;
  const aiSignalScore = primarySurvey?.aiInsightsSummary?.signalScoreOutOf100;

  const card4: BlindSpotItem =
    interviewLogs.length > 0 &&
    politeFluffInterviews.length >= Math.ceil(interviewLogs.length / 2)
      ? {
          id: 'mod-c-bs-politeness-trap',
          category: 'Polite Compliments vs. Real Commitment',
          severity: 'WARNING',
          title: `High "Polite Fluff" Ratio (${politeFluffInterviews.length} of ${interviewLogs.length} Interviews Ended in Compliments Only)`,
          explanation: `In ${politeFluffInterviews.length} of your ${interviewLogs.length} logged interviews (Avg Pain: ${avgInterviewPain}/5), interviewees said nice things about ${input.planTitle} without offering a concrete next step (waitlist signup, intro, or pilot commitment). In The Mom Test, compliments without commitment are a polite "no".`,
          suggestedAction: `End every 1-on-1 call with a concrete commitment test: ask for a warm intro to a peer, a 15-minute workflow shadow session, or a paid beta reservation. If they hesitate, ask what makes the problem a "nice-to-solve" instead of a "must-solve".`,
        }
      : typeof aiSignalScore === 'number' && aiSignalScore < 55
        ? {
            id: 'mod-c-bs-politeness-trap',
            category: 'Polite Compliments vs. Real Commitment',
            severity: 'WARNING',
            title: `Moderate Validation Signal Score (${aiSignalScore}/100) — Watch for Lukewarm Interest`,
            explanation: `Your AI Survey Synthesis scored customer urgency at ${aiSignalScore}/100 (${primarySurvey?.aiInsightsSummary?.politenessAlertOrRisks?.[0] || 'Several respondents reported mild inconvenience rather than hair-on-fire urgency'}).`,
            suggestedAction: `Narrow your target persona in Module B/D to the specific sub-segment of respondents who reported weekly/daily pain and opted into your early-bird waitlist.`,
          }
        : {
            id: 'mod-c-bs-politeness-trap',
            category: 'Polite Compliments vs. Real Commitment',
            severity: 'INFO',
            title:
              highSignalInterviews.length > 0
                ? `${highSignalInterviews.length} High-Intent Interview Commitment${highSignalInterviews.length === 1 ? '' : 's'} Logged${avgInterviewPain ? ` (Avg Pain ${avgInterviewPain}/5)` : ''}`
                : typeof aiSignalScore === 'number'
                  ? `Strong Customer Urgency Signal (${aiSignalScore}/100 AI Validation Score)`
                  : 'Run AI Signal Synthesis to Audit Politeness Risk',
            explanation:
              highSignalInterviews.length > 0
                ? `${highSignalInterviews.length} of your ${interviewLogs.length} 1-on-1 interviewees backed up their words with real skin in the game (asking to pilot/buy, joining the waitlist, or introducing peers).`
                : typeof aiSignalScore === 'number'
                  ? `Your survey responses show genuine problem frequency and concrete workarounds rather than passive compliments.`
                  : `Once you have collected responses, run the AI Sentiment Synthesizer on Tab 3 to separate genuine problem urgency from polite compliments.`,
            suggestedAction: `Prioritize the exact workflow bottleneck described by your highest-pain respondents when filtering your V1 feature list in Module D.`,
          };

  // -------------------------------------------------------------------------
  // CARD 5: Workaround Spend & Willingness-to-Pay Evidence (Feeds Module D & F)
  // -------------------------------------------------------------------------
  const hasSpendSurveyQuestion =
    validSurveys.some((s) =>
      s.focusAreas?.includes('PAST_SPENDING_BUDGET')
    ) ||
    allQuestions.some((q) =>
      /spend|cost|pay|budget|price|money|hour|time/i.test(q.questionText)
    );
  const interviewsWithWorkaroundSpend = interviewLogs.filter(
    (i) => i.workaroundAndSpend && i.workaroundAndSpend.trim().length > 8
  );

  const card5: BlindSpotItem =
    !hasSpendSurveyQuestion && interviewsWithWorkaroundSpend.length === 0
      ? {
          id: 'mod-c-bs-workaround-spend',
          category: 'Willingness-to-Pay & Workaround Spend',
          severity: 'WARNING',
          title:
            'Missing Evidence on What Customers Currently Spend (Money or Hours)',
          explanation: `Neither your survey questions nor your 1-on-1 interview logs currently capture what "${beachheadLabel}" already spends (in money or wasted staff hours) on duct-tape workarounds. Without a baseline cost of the status quo, pricing ${input.planTitle} in Module F will be guesswork.`,
          suggestedAction: `Ask in your survey or next 1-on-1 call: "What are you currently using to handle this today, and roughly how much money or time does that workaround cost you each month?"`,
        }
      : {
          id: 'mod-c-bs-workaround-spend',
          category: 'Willingness-to-Pay & Workaround Spend',
          severity: 'INFO',
          title: `Status-Quo Workaround & Budget Anchors Captured (${interviewsWithWorkaroundSpend.length} Interview Log${interviewsWithWorkaroundSpend.length === 1 ? '' : 's'}${hasSpendSurveyQuestion ? ' + Survey Spend Question' : ''})`,
          explanation: `You are actively tracking what customers already spend in time and money on existing workarounds. This gives you a factual anchor for both V1 scope (Module D) and Pocket Profit pricing (Module F).`,
          suggestedAction: `When you move to Module F (Pricing Architect), anchor your price against the monthly cost or time wasted on the customer's current workaround rather than pricing based on your build costs.`,
        };

  // -------------------------------------------------------------------------
  // CARD 6: Waitlist Conversion & Non-Dilutive Grant Evidence (`countryPack`)
  // -------------------------------------------------------------------------
  const pilotCallLeads = interviewLogs.filter(
    (i) =>
      i.commitmentOutcome === 'ASKED_TO_PILOT_OR_BUY' ||
      i.commitmentOutcome === 'INTRODUCED_PEERS'
  );
  const totalWarmLeads = realWaitlistLeads.length + pilotCallLeads.length;

  // Also check if any custom "OTHER" channel or outcome was used (GEMINI.md Rule 1.5)
  const customChannelInterviews = interviewLogs.filter(
    (i) => i.channel === 'OTHER' && i.otherChannelText?.trim()
  );
  const customOutcomeInterviews = interviewLogs.filter(
    (i) =>
      i.commitmentOutcome === 'OTHER' && i.otherCommitmentText?.trim()
  );
  const customEdgeNote =
    customChannelInterviews.length > 0 || customOutcomeInterviews.length > 0
      ? ` (including custom discovery channels/outcomes: ${[
          ...customChannelInterviews.map((i) => i.otherChannelText?.trim()),
          ...customOutcomeInterviews.map((i) =>
            i.otherCommitmentText?.trim()
          ),
        ]
          .filter(Boolean)
          .slice(0, 2)
          .join(', ')})`
      : '';

  const card6: BlindSpotItem = {
    id: 'mod-c-bs-waitlist-grant-fit',
    category: `${countryPack.countryName} Grant & First-10-Customers Pipeline`,
    severity: totalWarmLeads === 0 ? 'WARNING' : 'INFO',
    title:
      totalWarmLeads === 0
        ? `0 Early-Bird Waitlist Emails or Pilot Commitments Captured Yet`
        : `${totalWarmLeads} Warm Early-Bird / Pilot Lead${totalWarmLeads === 1 ? '' : 's'} Ready for Module D & G${customEdgeNote}`,
    explanation:
      totalWarmLeads === 0
        ? `Validation shouldn't just produce charts — it should build your first pipeline of beta buyers. In ${countryPack.countryName}, programs like ${topGrant ? topGrant.grantName : 'local feasibility grants'} and angel investors look for documented primary market research and named early-adopter interest.`
        : `You have captured ${realWaitlistLeads.length} real survey waitlist lead(s) (${waitlistResponses.length} including samples) and ${pilotCallLeads.length} high-intent 1-on-1 interview lead(s)${customEdgeNote}. In ${countryPack.countryName}, this primary validation log directly strengthens ${topGrant ? topGrant.grantName : 'grant & investor'} applications in Module H & Module I.`,
    suggestedAction:
      totalWarmLeads === 0
        ? `Enable "Collect Early-Bird Waitlist Emails" on your survey with a clear beta incentive, and ask every 1-on-1 interviewee if they want early access when your V1 launches.`
        : `Export your Module C Customer Validation Brief below as proof of primary market demand, then carry these ${totalWarmLeads} warm lead(s) into Module D (V1 Scope) and Module G (First 10 Customers Playbook).`,
  };

  return [card1, card2, card3, card4, card5, card6];
}
