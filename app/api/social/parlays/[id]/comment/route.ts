import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

type EmbeddedParlayComment = {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
};

export async function POST(
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

    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    const parlay = await prisma.sharedParlay.findUnique({
      where: { id: params.id },
    });

    if (!parlay) {
      return NextResponse.json({ error: 'Parlay not found' }, { status: 404 });
    }

    const parsed = safeParseParlayData(parlay.parlayData);
    const newComment: EmbeddedParlayComment = {
      id: randomUUID(),
      userId,
      content,
      createdAt: new Date().toISOString(),
    };

    const updatedParlay = await prisma.sharedParlay.update({
      where: { id: params.id },
      data: {
        parlayData: JSON.stringify({
          ...parsed,
          comments: [...parsed.comments, newComment],
        }),
      },
    });

    return NextResponse.json({ success: true, comment: newComment, parlay: updatedParlay });
  } catch (error) {
    console.error('Add parlay comment error:', error);
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
  }
}

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

    const parsed = safeParseParlayData(parlay.parlayData);

    return NextResponse.json({ success: true, comments: parsed.comments });
  } catch (error) {
    console.error('Get parlay comments error:', error);
    return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 });
  }
}

function safeParseParlayData(raw: string | null): { comments: EmbeddedParlayComment[] } {
  if (!raw) {
    return { comments: [] };
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const comments = Array.isArray(parsed.comments)
        ? (parsed.comments as EmbeddedParlayComment[])
        : [];
      return { ...parsed, comments } as { comments: EmbeddedParlayComment[] };
    }
    return { comments: [] };
  } catch {
    return { comments: [] };
  }
}

