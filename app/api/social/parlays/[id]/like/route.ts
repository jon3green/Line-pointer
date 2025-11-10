import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parlay = await prisma.sharedParlay.update({
      where: { id: params.id },
      data: {
        likes: { increment: 1 },
      },
    });

    return NextResponse.json({ success: true, likes: parlay.likes });
  } catch (error) {
    console.error('Like parlay error:', error);
    return NextResponse.json({ error: 'Failed to like parlay' }, { status: 500 });
  }
}

