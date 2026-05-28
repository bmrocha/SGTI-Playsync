import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems: number;
    itemsPerPage: number;
}

export function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    totalItems,
    itemsPerPage
}: PaginationProps) {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between px-2 py-4 border-t border-border">
            <div className="flex-1 flex justify-between sm:hidden">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-md text-text-dark bg-panel-bg hover:bg-body-bg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Anterior
                </button>
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-md text-text-dark bg-panel-bg hover:bg-body-bg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Próxima
                </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-text-light">
                        Mostrando <span className="font-medium">{startItem}</span> a <span className="font-medium">{endItem}</span> de{' '}
                        <span className="font-medium">{totalItems}</span> resultados
                    </p>
                </div>
                <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                            onClick={() => onPageChange(1)}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-border bg-panel-bg text-sm font-medium text-text-light hover:bg-body-bg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="sr-only">Primeira</span>
                            <ChevronsLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 border border-border bg-panel-bg text-sm font-medium text-text-light hover:bg-body-bg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="sr-only">Anterior</span>
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        
                        {/* Simple page numbers logic */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            // Logic to show pages around current page
                            let pageNum = i + 1;
                            if (totalPages > 5) {
                                if (currentPage > 3) {
                                    pageNum = currentPage - 2 + i;
                                }
                                if (pageNum > totalPages) {
                                    pageNum = totalPages - 4 + i;
                                }
                            }
                            
                            // Prevent invalid pages
                            if (pageNum < 1 || pageNum > totalPages) return null;

                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => onPageChange(pageNum)}
                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                        currentPage === pageNum
                                            ? 'z-10 bg-brand-main border-brand-main text-white'
                                            : 'bg-panel-bg border-border text-text-light hover:bg-body-bg'
                                    }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}

                        <button
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center px-2 py-2 border border-border bg-panel-bg text-sm font-medium text-text-light hover:bg-body-bg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="sr-only">Próxima</span>
                            <ChevronRight className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => onPageChange(totalPages)}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-border bg-panel-bg text-sm font-medium text-text-light hover:bg-body-bg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="sr-only">Última</span>
                            <ChevronsRight className="h-4 w-4" />
                        </button>
                    </nav>
                </div>
            </div>
        </div>
    );
}
