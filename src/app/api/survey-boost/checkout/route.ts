import { NextResponse } from 'next/server';
import { createSurveyBoostCheckoutAction } from '@/app/actions/survey-boost';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await createSurveyBoostCheckoutAction(body);
    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error('[API survey-boost checkout] Error:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: msg || 'Failed to initiate survey boost checkout.' },
      { status: 500 }
    );
  }
}
