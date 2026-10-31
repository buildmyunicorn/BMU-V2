'use server';

import {
  parseCvAndDraftPromoterBioViaRouter,
  generateRoleMatrixSummaryViaRouter,
  type ParseCvAndDraftBioResult,
  type GenerateRoleMatrixSummaryResult,
} from '@/lib/ai/router';
import type { SupportedCountryCode } from '@/lib/localization';

export type { ParseCvAndDraftBioResult, GenerateRoleMatrixSummaryResult };

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

export async function generateRoleMatrixSummaryAction(params: {
  planTitle?: string;
  industryCategory?: string;
  hqCountryCode?: SupportedCountryCode;
  teamMembers: Array<{
    id: string;
    fullName: string;
    jobTitle: string;
  }>;
  hatAssignments: Array<{
    hatKey: string;
    title: string;
    primaryOwnerMemberId: string;
    backupOwnerMemberId?: string;
    weeklyHours: number;
    confidence: string;
    notes?: string;
  }>;
  advisors?: Array<{
    name: string;
    roleOrSpecialty: string;
    organizationOrAffiliation?: string;
    cadence?: string;
  }>;
}): Promise<GenerateRoleMatrixSummaryResult> {
  return await generateRoleMatrixSummaryViaRouter(params);
}
