import * as Sentry from '@sentry/nextjs';

type TelemetryMetadata = Record<string, unknown> | undefined;

const telemetryConsole = (level: 'info' | 'warn' | 'error', message: string, metadata?: TelemetryMetadata) => {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console[level](`[telemetry] ${message}`, metadata ?? {});
  }
};

export function logTelemetry(eventName: string, metadata?: TelemetryMetadata) {
  telemetryConsole('info', eventName, metadata);

  try {
    Sentry.captureMessage(`telemetry:${eventName}`, {
      level: 'info',
      extra: metadata,
    });
  } catch (error) {
    telemetryConsole('warn', 'Failed to capture telemetry message', { eventName, error });
  }
}

export function logTelemetryError(eventName: string, error: unknown, metadata?: TelemetryMetadata) {
  const payload = {
    ...(metadata ?? {}),
    message: error instanceof Error ? error.message : String(error),
  };

  telemetryConsole('error', eventName, payload);

  try {
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: {
        telemetryEvent: eventName,
      },
      extra: payload,
    });
  } catch (sentryError) {
    telemetryConsole('warn', 'Failed to capture telemetry error', { eventName, sentryError });
  }
}

export function trackCounter(metric: string, value = 1, metadata?: TelemetryMetadata) {
  telemetryConsole('info', `counter:${metric}`, { value, ...metadata });
  // Placeholder: integrate with metrics backend (e.g., StatsD, Prometheus) once selected
}
