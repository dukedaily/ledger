import { NextRequest, NextResponse } from 'next/server';
import { createWallet, getWallets, deleteWallet } from '@/lib/database';

export async function GET() {
  try {
    const wallets = getWallets();
    return NextResponse.json(wallets);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch wallets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const id = createWallet(data);
    return NextResponse.json({ id, success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create wallet' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    deleteWallet(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete wallet' }, { status: 500 });
  }
}
