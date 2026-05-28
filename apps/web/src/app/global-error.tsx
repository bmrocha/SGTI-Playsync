"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    try {
      const dsn = typeof process !== 'undefined'
        ? process.env.NEXT_PUBLIC_SENTRY_DSN
        : undefined;
      if (dsn) {
        import('@sentry/nextjs').then(s => s.captureException(error)).catch(() => {});
      }
    } catch {}
  }, [error]);
  return (
    <html lang="pt-BR">
      <body>
        <div
          style={{
            minHeight: "100vh",
            background: "#020a0a",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div style={{ textAlign: "center", maxWidth: "400px" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                margin: "0 auto",
                background: "rgba(239,68,68,0.1)",
                borderRadius: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(239,68,68,0.2)",
                fontSize: "28px",
                marginBottom: "24px",
              }}
            >
              ⚠
            </div>
            <h1 style={{ fontSize: "24px", fontWeight: 900, marginBottom: "12px" }}>
              Erro Crítico
            </h1>
            <p style={{ color: "#a1a1aa", fontSize: "14px", marginBottom: "24px" }}>
              Ocorreu um erro crítico. Recarregue a página ou tente novamente.
            </p>
            <button
              onClick={() => reset()}
              style={{
                padding: "12px 32px",
                background: "#10b981",
                color: "black",
                border: "none",
                borderRadius: "12px",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "1px",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              Recarregar Página
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
