/**
 * Prolific REST API Client & Automation Bridge
 * Handles study creation, status checking, and automatic participant routing.
 */

const PROLIFIC_API_BASE = 'https://api.prolific.com/api/v1';

export interface ProlificStudyInput {
  name: string;
  description: string;
  externalStudyUrl: string; // e.g. https://startuppreflight.com/v/my-survey?prolific_pid={{%PROLIFIC_PID%}}&boost_id=...
  totalAvailablePlaces: number; // e.g. 50
  estimatedCompletionTimeMinutes?: number; // defaults to 3 mins
  rewardPence?: number; // in pence GBP, e.g. 50 = £0.50 (at 3 mins = £10.00/hr)
  targetCountryCode?: 'IE' | 'GB' | 'US' | 'ALL';
  completionCode?: string;
  ageMin?: number;
  ageMax?: number;
}

export interface ProlificStudyResponse {
  id: string;
  name: string;
  status: string; // 'UNPUBLISHED' | 'ACTIVE' | 'COMPLETED' | 'PAUSED'
  totalAvailablePlaces: number;
  placesTaken: number;
  reward: number;
  averageTimeTaken?: number;
  createdAt: string;
  publishedAt?: string;
}

export class ProlificService {
  private static getApiToken(): string | null {
    return process.env.PROLIFIC_API_TOKEN || null;
  }

  private static getDefaultWorkspaceId(): string {
    return process.env.PROLIFIC_DEFAULT_WORKSPACE_ID || '6aeb567b587ae49b75bc6305';
  }

  private static getDefaultProjectId(): string {
    return process.env.PROLIFIC_DEFAULT_PROJECT_ID || '6aeb567c587ae49b75bc6309';
  }

  /**
   * Test current connection and return researcher account info
   */
  static async getAccountDetails() {
    const token = this.getApiToken();
    if (!token) {
      return { success: false, error: 'PROLIFIC_API_TOKEN is not configured in server environment.' };
    }

    try {
      const res = await fetch(`${PROLIFIC_API_BASE}/users/me/`, {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!res.ok) {
        const errText = await res.text();
        return { success: false, error: `Prolific API returned ${res.status}: ${errText}` };
      }

      const data = await res.json();
      return {
        success: true,
        account: {
          id: data.id,
          name: data.name,
          email: data.email,
          balance: data.balance / 100, // converted from pence
          availableBalance: data.available_balance / 100,
          currency: data.currency_code,
          feesPercentage: data.fees_percentage,
        },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: `Network error connecting to Prolific: ${msg}` };
    }
  }

  /**
   * Programmatically create a Draft study on Prolific
   */
  static async createStudy(input: ProlificStudyInput): Promise<{
    success: boolean;
    study?: ProlificStudyResponse;
    error?: string;
  }> {
    const token = this.getApiToken();
    if (!token) {
      return { success: false, error: 'PROLIFIC_API_TOKEN is not configured.' };
    }

    const projectId = this.getDefaultProjectId();
    const completionCode = input.completionCode || 'SPF_SURVEY_VERIFIED';
    const estimatedMins = input.estimatedCompletionTimeMinutes || 3;
    // Base reward: £0.50 (50p) for 3 mins corresponds to £10.00/hr, well above Prolific's £6.00/hr baseline
    const rewardPence = input.rewardPence || Math.max(45, estimatedMins * 17);

    // Build filters for location if specified
    const filters: any[] = [];
    if (input.targetCountryCode === 'IE') {
      filters.push({
        filter_id: 'current_country_of_residence',
        selected_values: ['IE'],
      });
    } else if (input.targetCountryCode === 'GB') {
      filters.push({
        filter_id: 'current_country_of_residence',
        selected_values: ['GB'],
      });
    }

    if (input.ageMin || input.ageMax) {
      filters.push({
        filter_id: 'age',
        selected_range: {
          min: input.ageMin || 18,
          max: input.ageMax || 75,
        },
      });
    }

    const payload = {
      project: projectId,
      name: input.name,
      internal_name: `SPF Boost: ${input.name}`,
      description: input.description,
      external_study_url: input.externalStudyUrl,
      prolific_id_option: 'url_parameters',
      total_available_places: input.totalAvailablePlaces,
      estimated_completion_time: estimatedMins,
      reward: rewardPence,
      completion_codes: [
        {
          code: completionCode,
          code_type: 'completed',
          action: 'AUTOMATICALLY_APPROVE',
        },
      ],
      filters: filters.length > 0 ? filters : undefined,
    };

    try {
      const res = await fetch(`${PROLIFIC_API_BASE}/projects/${projectId}/studies/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        return { success: false, error: `Prolific study creation failed (${res.status}): ${errText}` };
      }

      const data = await res.json();
      return {
        success: true,
        study: {
          id: data.id,
          name: data.name,
          status: data.status,
          totalAvailablePlaces: data.total_available_places,
          placesTaken: data.places_taken || 0,
          reward: data.reward,
          createdAt: data.created_at,
        },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: `Failed to create Prolific study: ${msg}` };
    }
  }

  /**
   * Publish a draft study to begin collecting responses immediately
   */
  static async publishStudy(studyId: string): Promise<{ success: boolean; error?: string }> {
    const token = this.getApiToken();
    if (!token) return { success: false, error: 'PROLIFIC_API_TOKEN is not configured.' };

    try {
      const res = await fetch(`${PROLIFIC_API_BASE}/studies/${studyId}/transition/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'PUBLISH' }),
      });

      if (!res.ok) {
        const errText = await res.text();
        return { success: false, error: `Failed to publish study (${res.status}): ${errText}` };
      }

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: `Network error publishing study: ${msg}` };
    }
  }

  /**
   * Fetch study progress (places taken, status)
   */
  static async getStudyStatus(studyId: string): Promise<{
    success: boolean;
    study?: ProlificStudyResponse;
    error?: string;
  }> {
    const token = this.getApiToken();
    if (!token) return { success: false, error: 'PROLIFIC_API_TOKEN is not configured.' };

    try {
      const res = await fetch(`${PROLIFIC_API_BASE}/studies/${studyId}/`, {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!res.ok) {
        const errText = await res.text();
        return { success: false, error: `Failed to fetch study status (${res.status}): ${errText}` };
      }

      const data = await res.json();
      return {
        success: true,
        study: {
          id: data.id,
          name: data.name,
          status: data.status,
          totalAvailablePlaces: data.total_available_places,
          placesTaken: data.places_taken || 0,
          reward: data.reward,
          averageTimeTaken: data.average_time_taken,
          createdAt: data.created_at,
          publishedAt: data.published_at,
        },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: `Error checking study status: ${msg}` };
    }
  }

  /**
   * Check real-time participant availability for demographic criteria before purchase
   */
  static async checkEligibilityCount(params: {
    countryCode?: 'IE' | 'GB' | 'US' | 'ALL';
    ageMin?: number;
    ageMax?: number;
    gender?: 'ANY' | 'FEMALE' | 'MALE';
    employmentStatus?: 'ANY' | 'FULL_TIME' | 'PART_TIME' | 'UNEMPLOYED';
  }): Promise<{ success: boolean; count?: number; error?: string }> {
    const token = this.getApiToken();
    if (!token) return { success: false, error: 'PROLIFIC_API_TOKEN is not configured.' };

    const workspaceId = this.getDefaultWorkspaceId();
    const filters: any[] = [];

    // Country Filter (current-country-of-residence: "0" = UK, "1" = US, "2" = Ireland)
    if (params.countryCode === 'IE') {
      filters.push({
        filter_id: 'current-country-of-residence',
        selected_values: ['2'],
      });
    } else if (params.countryCode === 'GB') {
      filters.push({
        filter_id: 'current-country-of-residence',
        selected_values: ['0'],
      });
    } else if (params.countryCode === 'US') {
      filters.push({
        filter_id: 'current-country-of-residence',
        selected_values: ['1'],
      });
    } else if (params.countryCode === 'ALL') {
      filters.push({
        filter_id: 'current-country-of-residence',
        selected_values: ['0', '2'], // UK + Ireland
      });
    }

    // Age Filter (range)
    if (params.ageMin || params.ageMax) {
      filters.push({
        filter_id: 'age',
        selected_range: {
          lower: Math.max(18, params.ageMin || 18),
          upper: Math.min(100, params.ageMax || 99),
        },
      });
    }

    // Sex Filter ("0" = Male, "1" = Female)
    if (params.gender === 'FEMALE') {
      filters.push({
        filter_id: 'sex',
        selected_values: ['1'],
      });
    } else if (params.gender === 'MALE') {
      filters.push({
        filter_id: 'sex',
        selected_values: ['0'],
      });
    }

    // Employment Status Filter ("0" = Full-Time, "1" = Part-Time, "3" = Unemployed)
    if (params.employmentStatus === 'FULL_TIME') {
      filters.push({
        filter_id: 'employment-status',
        selected_values: ['0'],
      });
    } else if (params.employmentStatus === 'PART_TIME') {
      filters.push({
        filter_id: 'employment-status',
        selected_values: ['1'],
      });
    }

    try {
      const res = await fetch(`${PROLIFIC_API_BASE}/eligibility-count/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspace_id: workspaceId,
          filters,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        return { success: false, error: `Eligibility API error (${res.status}): ${errText}` };
      }

      const data = await res.json();
      return { success: true, count: typeof data.count === 'number' ? data.count : 0 };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: `Failed to calculate eligibility: ${msg}` };
    }
  }
}
