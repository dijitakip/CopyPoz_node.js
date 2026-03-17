import { NextResponse } from 'next/server';
import { RiskEngine } from '@/src/backend/services/RiskEngine';
import { getCurrentUser, isTrader } from '@/src/backend/utils/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = getCurrentUser();
    if (!isTrader(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = parseInt(params.id);
    const analysis = await RiskEngine.analyzeClient(clientId);

    if (!analysis) {
      return NextResponse.json({ error: 'Client not found or no data' }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      analysis: {
        riskScore: Number(analysis.riskScore),
        maxDrawdown: Number(analysis.maxDrawdown),
        suggestedMultiplier: Number(analysis.suggestedMultiplier)
      }
    });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
