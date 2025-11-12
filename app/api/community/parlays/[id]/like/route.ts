import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Like/Unlike a shared parlay
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parlayId = params.id;
    const body = await request.json();
    const { action } = body; // 'like' or 'unlike'

    if (!action) {
      return NextResponse.json(
        { error: 'Missing action field' },
        { status: 400 }
      );
    }

    // Verify parlay exists
    const parlay = await prisma.sharedParlay.findUnique({
      where: { id: parlayId },
    });

    if (!parlay) {
      return NextResponse.json(
        { error: 'Parlay not found' },
        { status: 404 }
      );
    }

    if (action === 'like') {
      // Increment like count
      await prisma.sharedParlay.update({
        where: { id: parlayId },
        data: { likes: { increment: 1 } },
      });

      return NextResponse.json({
        success: true,
        message: 'Parlay liked',
      });
    } else if (action === 'unlike') {
      // Decrement like count (but not below 0)
      const currentLikes = parlay.likes;
      if (currentLikes > 0) {
        await prisma.sharedParlay.update({
          where: { id: parlayId },
          data: { likes: { decrement: 1 } },
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Parlay unliked',
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Must be "like" or "unlike"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Like/Unlike parlay error:', error);
    return NextResponse.json(
      { error: 'Failed to process like action' },
      { status: 500 }
    );
  }
}
