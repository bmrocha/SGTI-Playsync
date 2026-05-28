import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

const pinoLogger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  transport: isDev
    ? {
        target: 'pino/file',
        options: { destination: 1 },
      }
    : undefined,
  redact: {
    paths: ['req.headers.cookie', 'req.headers.authorization', 'body.password', 'body.token', 'body.secret', 'body.newPassword', 'body.two_factor_code', 'body.tempToken', 'body.sshKey', 'body.apiKey', 'body.currentPassword'],
    censor: '[REDACTED]',
  },
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
    }),
    err: pino.stdSerializers.err,
  },
});

// Wrap logger to send errors to Sentry when DSN is configured
export const logger = new Proxy(pinoLogger, {
  get(target, prop) {
    const original = Reflect.get(target, prop);
    if (typeof original !== 'function') return original;

    if (prop === 'error') {
      return (...args: any[]) => {
        original.apply(target, args);
        try {
          const hasDsn = typeof process !== 'undefined' &&
            (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN);
          if (hasDsn) {
            const errArg = args.find(a => a instanceof Error || (a && a.err instanceof Error));
            const error = errArg instanceof Error ? errArg : errArg?.err;
            if (error) {
              const msg = args.find(a => typeof a === 'string') || 'Error';
              // Dynamic import to avoid requiring Sentry at module level
              import('@sentry/nextjs').then(s => s.captureException(error, { level: 'error', extra: { message: msg } })).catch(() => {});
            }
          }
        } catch {}
      };
    }

    return original;
  },
});
