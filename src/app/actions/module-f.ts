'use server';

import {
  parseCvAndDraftPromoterBioViaRouter,
  type ParseCvAndDraftBioResult,
} from '@/lib/ai/router';
import type { SupportedCountryCode } from '@/lib/localization';

export type { ParseCvAndDraftBioResult };

export async function parseCvAndDraftPromoterBioAction(params: {
  planTitle?: string;
  industryCategory?: string;
  hqCountryCode?: SupportedCountryCode;
  fileBase64?: string;
  fileMimeType?: string;
  rawText?: string;
  currentRoleTitle?: string;
  candidateName?: string;
}): Promise<ParseCvAndDraftBioResult> {
  return await parseCvAndDraftPromoterBioViaRouter(params);
}
