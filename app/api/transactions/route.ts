import { NextRequest, NextResponse } from 'next/server';
import { createTransaction, getTransactions, deleteTransaction, getWallet } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const options: any = {};

    if (searchParams.get('wallet_id')) {
      options.wallet_id = parseInt(searchParams.get('wallet_id')!);
    }
    if (searchParams.get('transaction_type')) {
      options.transaction_type = searchParams.get('transaction_type');
    }
    if (searchParams.get('category')) {
      options.category = searchParams.get('category');
    }
    if (searchParams.get('start_date')) {
      options.start_date = searchParams.get('start_date');
    }
    if (searchParams.get('end_date')) {
      options.end_date = searchParams.get('end_date');
    }
    if (searchParams.get('limit')) {
      options.limit = parseInt(searchParams.get('limit')!);
    }

    const transactions = getTransactions(options);
    return NextResponse.json(transactions);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const wallet = getWallet(data.wallet_id);
    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    const id = createTransaction({
      ...data,
      currency: wallet.currency,
      date: data.date || new Date().toISOString().split('T')[0],
    });
    return NextResponse.json({ id, success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    deleteTransaction(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}
