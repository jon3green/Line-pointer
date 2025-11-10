'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-md rounded-xl border border-white/10 bg-white/5 p-6 space-y-4 text-center">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="text-sm text-gray-300">
            Our team has been notified. You can try again or return home.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              className="px-4 py-2 rounded-lg bg-green-500 text-white font-medium hover:bg-green-400 transition"
              onClick={() => reset()}
            >
              Try again
            </button>
            <a
              className="px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition"
              href="/"
            >
              Go home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
