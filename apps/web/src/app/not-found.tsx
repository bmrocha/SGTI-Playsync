import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#020a0a] text-white flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b98115_1px,transparent_1px),linear-gradient(to_bottom,#10b98115_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      <div className="relative z-10 w-full max-w-md text-center space-y-6">
        <div className="w-16 h-16 mx-auto bg-zinc-800/50 rounded-3xl flex items-center justify-center border border-zinc-700">
          <span className="text-3xl font-black text-zinc-500">404</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight">Página não encontrada</h1>
        <p className="text-zinc-400 text-sm">A página que você procura não existe ou foi movida.</p>
        <Link
          href="/dashboard"
          className="inline-block py-3 px-8 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl font-black uppercase tracking-widest text-xs transition-all"
        >
          Voltar ao Dashboard
        </Link>
      </div>
    </div>
  );
}
