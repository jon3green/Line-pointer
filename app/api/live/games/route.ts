export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getGameStream } from '@/lib/live/game-stream';
import type { Sport } from '@/lib/types';

const encoder = new TextEncoder();

function writeMessage(writer: WritableStreamDefaultWriter<Uint8Array>, event: string, data: unknown) {
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  return writer.write(encoder.encode(`event: ${event}\ndata: ${payload}\n\n`));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const league = (searchParams.get('league')?.toUpperCase() ?? 'NFL') as Sport;

  const stream = getGameStream(league);

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  await writeMessage(writer, 'ready', { league, status: 'connected' });

  const unsubscribe = stream.subscribe((payload) => {
    void writeMessage(writer, 'update', payload);
  });

  const ping = setInterval(() => {
    void writeMessage(writer, 'ping', { ts: Date.now() });
  }, 30_000);

  const abortHandler = () => {
    clearInterval(ping);
    unsubscribe();
    void writer.close();
  };

  request.signal.addEventListener('abort', abortHandler);

  return new NextResponse(readable, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Transfer-Encoding': 'chunked',
    },
  });
}
