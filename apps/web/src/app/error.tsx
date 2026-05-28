"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#020a0a] text-white flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b98115_1px,transparent_1px),linear-gradient(to_bottom,#10b98115_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      <div className="relative z-10 w-full max-w-md text-center space-y-6">
        <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-3xl flex items-center justify-center border border-red-500/20">
          <span className="text-3xl">⚠</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight">Erro no Sistema</h1>
        <p className="text-zinc-400 text-sm">Ocorreu um erro inesperado. Nossa equipe foi notificada.</p>
        <button
          onClick={reset}
          className="py-3 px-8 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl font-black uppercase tracking-widest text-xs transition-all"
        >
          Tentar Novamente
        </button>
      </div>
    </div>
  );
}
