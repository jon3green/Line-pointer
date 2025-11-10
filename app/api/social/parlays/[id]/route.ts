import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const parlay = await prisma.sharedParlay.findUnique({
      where: { id: params.id },
    });

    if (!parlay) {
      return NextResponse.json({ error: 'Parlay not found' }, { status: 404 });
    }

    // Increment view count
    await prisma.sharedParlay.update({
      where: { id: params.id },
      data: { views: { increment: 1 } },
    });

    return NextResponse.json({ success: true, parlay });
  } catch (error) {
    console.error('Get parlay error:', error);
    return NextResponse.json({ error: 'Failed to fetch parlay' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { visibility } = await request.json();

    const parlay = await prisma.sharedParlay.update({
      where: {
        id: params.id,
        userId,
      },
      data: {
        isPublic: visibility !== 'private',
      },
    });

    return NextResponse.json({ success: true, parlay });
  } catch (error) {
    console.error('Update shared parlay error:', error);
    return NextResponse.json({ error: 'Failed to update parlay' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.sharedParlay.delete({
      where: {
        id: params.id,
        userId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete shared parlay error:', error);
    return NextResponse.json({ error: 'Failed to delete parlay' }, { status: 500 });
  }
}

