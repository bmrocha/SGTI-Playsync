export function Footer() {
    return (
        <footer className="w-full py-2 shrink-0 border-t border-border/50 bg-body-bg/50 backdrop-blur-sm">
            <div className="px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-light/70 uppercase tracking-widest font-medium">
                <div className="flex items-center gap-2">
                    <span>&copy; {new Date().getFullYear()} PlaySync</span>
                    <span className="hidden sm:inline text-brand-main">•</span>
                    <span className="opacity-75">Todos os direitos reservados</span>
                </div>

                <div className="flex items-center gap-1 group transition-colors hover:text-text-dark">
                    <span
                        className="cursor-help transition-all hover:text-brand-main"
                        title="contato@sgti.tec.br"
                    >
                        Desenvolvido pela sgti.tec.br
                    </span>
                </div>
            </div>
        </footer>
    );
}
