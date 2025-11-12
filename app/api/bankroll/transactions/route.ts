import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET all bankroll transactions for the authenticated user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || undefined;
    const category = searchParams.get('category') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = { userId: session.user.id };
    if (type) where.type = type;
    if (category) where.category = category;

    const transactions = await prisma.bankrollTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.bankrollTransaction.count({ where });

    return NextResponse.json({
      success: true,
      transactions,
      count: transactions.length,
      total,
      hasMore: offset + transactions.length < total,
    });
  } catch (error) {
    console.error('[Bankroll] Transactions GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

// POST create a new bankroll transaction (deposit/withdrawal/adjustment)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, amount, description, category } = body;

    // Validate required fields
    if (!type || amount === undefined || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: type, amount, description' },
        { status: 400 }
      );
    }

    // Validate transaction type
    const validTypes = ['deposit', 'withdrawal', 'adjustment', 'bet', 'win', 'loss'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Get current balance
    const lastTransaction = await prisma.bankrollTransaction.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: { balance: true },
    });

    const currentBalance = lastTransaction?.balance || 0;

    // Calculate transaction amount (negative for withdrawals and bets)
    let transactionAmount = amount;
    if (type === 'withdrawal' || type === 'bet' || type === 'loss') {
      transactionAmount = -Math.abs(amount);
    } else {
      transactionAmount = Math.abs(amount);
    }

    const newBalance = currentBalance + transactionAmount;

    // Prevent negative balance for withdrawals
    if (newBalance < 0 && (type === 'withdrawal' || type === 'bet')) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Create transaction
    const transaction = await prisma.bankrollTransaction.create({
      data: {
        userId: session.user.id,
        type,
        amount: transactionAmount,
        balance: newBalance,
        description,
        category: category || 'sports',
      },
    });

    return NextResponse.json({
      success: true,
      transaction,
      message: 'Transaction created successfully',
    });
  } catch (error) {
    console.error('[Bankroll] Transactions POST error:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}
