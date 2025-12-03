import { NextRequest, NextResponse } from 'next/server';
import { getMonthlySummary, getYearlySummary, getTotalBalanceByCurrency } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'monthly';
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));

    if (type === 'yearly') {
      const summary = getYearlySummary(year);
      return NextResponse.json(summary);
    } else if (type === 'balance') {
      const balances = getTotalBalanceByCurrency();
      return NextResponse.json(balances);
    } else {
      const summary = getMonthlySummary(year, month);
      return NextResponse.json(summary);
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 });
  }
}
