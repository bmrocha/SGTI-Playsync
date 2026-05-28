"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useStorageStore } from "@/lib/storage-store";
import { useAuthStore } from "@/lib/auth-store";
import { FormModal } from "@/components/modals/form-modal";
import { useConfirm, ConfirmModal } from "@/components/modals/confirm-modal";
import { Pagination } from "@/components/ui/pagination";
import { useDebounce } from "@/hooks/use-debounce";
import { logCompanyCreated, logCompanyUpdated, logCompanyDeleted } from "@/lib/activity-log-store";
import { notifyError, notifySuccess } from "@/lib/notification-store";

import PageHeader from "@/components/companies/page-header";
import FiltersSection from "@/components/companies/filters-section";
import CompanyCard from "@/components/companies/company-card";
import EmptyStateSearch from "@/components/companies/empty-state-search";
import EmptyStateNoData from "@/components/companies/empty-state-no-data";
import FormModalContent from "@/components/companies/form-modal-content";

interface Company { id: string; name: string; description: string; color: string; creator_name?: string }

export default function CompaniesPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { moveToTrash, addHistoryEntry } = useStorageStore();
    const { confirm, confirmProps } = useConfirm();

    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("name-asc");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [availableEditors, setAvailableEditors] = useState<{ id: string; name: string; email: string }[]>([]);

    const debouncedSearch = useDebounce(searchTerm, 500);

    const [formData, setFormData] = useState({ name: "", description: "", color: "#ffca28", selectedEditors: [] as string[] });

    const fetchEditors = useCallback(async () => {
        try { const r = await fetch('/api/users?role=editor&limit=100'); if (r.ok) setAvailableEditors((await r.json()).users); }
        catch { /* ignore */ }
    }, []);
    useEffect(() => { fetchEditors(); }, [fetchEditors]);

    const fetchCompanies = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
            if (debouncedSearch) params.append('search', debouncedSearch);
            const r = await fetch(`/api/companies?${params.toString()}`);
            if (r.ok) { const d = await r.json(); setCompanies(d.companies); setTotalItems(d.pagination.total); setTotalPages(d.pagination.pages); }
        } catch { console.error('Error fetching companies'); }
        finally { setLoading(false); }
    }, [page, limit, debouncedSearch]);
    useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

    const usedColors = useMemo(() => companies.filter(c => editingCompany ? c.id !== editingCompany : true).map(c => c.color), [companies, editingCompany]);
    const colorToCompanyMap = useMemo(() => {
        const map: Record<string, string> = {};
        companies.forEach(c => { if (!(editingCompany && c.id === editingCompany)) map[c.color] = c.name; });
        return map;
    }, [companies, editingCompany]);

    const resetForm = () => { setFormData({ name: "", description: "", color: "#ffca28", selectedEditors: [] }); setEditingCompany(null); setIsModalOpen(false); };

    const handleSubmit = async () => {
        if (!formData.name.trim()) { notifyError("Erro de Validação", "Nome da empresa é obrigatório"); return; }
        if (usedColors.includes(formData.color)) { notifyError("Cor Indisponível", "Esta cor já está sendo usada por outra empresa."); return; }
        try {
            if (editingCompany) {
                const old = companies.find(c => c.id === editingCompany);
                const r = await fetch(`/api/companies/${editingCompany}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: formData.name, description: formData.description, color: formData.color }) });
                if (!r.ok) throw new Error((await r.json()).error || 'Erro ao atualizar empresa');
                if (user && old) {
                    const changes: Record<string, { old: any; new: any }> = {};
                    if (old.name !== formData.name) changes.name = { old: old.name, new: formData.name };
                    if (old.description !== formData.description) changes.description = { old: old.description, new: formData.description };
                    if (old.color !== formData.color) changes.color = { old: old.color, new: formData.color };
                    if (Object.keys(changes).length) logCompanyUpdated(user.id, user.name, user.role, formData.name, changes);
                }
            } else {
                const r = await fetch('/api/companies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: formData.name, description: formData.description, color: formData.color, editorIds: formData.selectedEditors }) });
                if (!r.ok) throw new Error((await r.json()).error || 'Erro ao criar empresa');
                if (user) { addHistoryEntry('created', 'company', formData.name, user.id, user.name, formData.name); logCompanyCreated(user.id, user.name, user.role, formData.name, formData.color); }
            }
            await fetchCompanies();
            resetForm();
            notifySuccess("Sucesso", editingCompany ? "Empresa atualizada com sucesso!" : "Empresa criada com sucesso!");
        } catch (error) { notifyError("Erro", error instanceof Error ? error.message : "Ocorreu um erro inesperado"); }
    };

    const handleEdit = (id: string) => {
        const c = companies.find(c => c.id === id);
        if (c) { setFormData({ name: c.name, description: c.description, color: c.color, selectedEditors: [] }); setEditingCompany(id); setIsModalOpen(true); }
    };

    const handleDelete = (id: string, name: string) => {
        confirm({ title: "Mover para Lixeira", message: `Deseja mover a empresa "${name}" para a lixeira?`, type: "danger", onConfirm: async () => {
            const company = companies.find(c => c.id === id);
            if (!company || !user) return;
            try {
                const r = await fetch(`/api/companies/${id}`, { method: 'DELETE' });
                if (!r.ok) throw new Error('Erro ao excluir empresa');
                moveToTrash(company, 'company', user.id, user.name, name);
                logCompanyDeleted(user.id, user.name, user.role, name);
                await fetchCompanies();
                notifySuccess("Sucesso", "Empresa movida para a lixeira com sucesso!");
            } catch { notifyError("Erro", "Erro ao excluir empresa"); }
        }});
    };

    return (
        <div className="py-6 laptop:py-4">
            <div className="px-4 sm:px-6 lg:px-8">
                <PageHeader totalItems={totalItems} showFilters={showFilters} onToggleFilters={() => setShowFilters(!showFilters)} user={user} onNewCompany={() => setIsModalOpen(true)} />
                {showFilters && <FiltersSection searchTerm={searchTerm} onSearchChange={(v) => { setSearchTerm(v); setPage(1); }} sortBy={sortBy} onSortChange={(v) => { setSortBy(v); setPage(1); }} />}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-main" />
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 laptop:gap-4">
                            {companies.map((c) => <CompanyCard key={c.id} company={c} user={user} onEdit={handleEdit} onDelete={handleDelete} router={router} />)}
                            {companies.length === 0 && searchTerm !== "" && <EmptyStateSearch searchTerm={searchTerm} onClearFilters={() => { setSearchTerm(""); setPage(1); }} />}
                            {companies.length === 0 && searchTerm === "" && <EmptyStateNoData onCreateCompany={() => setIsModalOpen(true)} />}
                        </div>
                        {totalItems > 0 && <div className="mt-8"><Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} itemsPerPage={limit} /></div>}
                    </>
                )}
            </div>
            <FormModal isOpen={isModalOpen} onClose={resetForm} title={editingCompany ? "Editar Empresa" : "Nova Empresa"} footer={
                <>
                    <button onClick={resetForm} className="btn-premium bg-border/50 text-text-dark px-5 py-2.5 hover:bg-border">Cancelar</button>
                    <button onClick={handleSubmit} className="btn-premium bg-brand-main text-white px-6 py-2.5">{editingCompany ? "Salvar Alterações" : "Salvar Empresa"}</button>
                </>
            }>
                <FormModalContent formData={formData} setFormData={setFormData} editingCompany={!!editingCompany} usedColors={usedColors} colorToCompanyMap={colorToCompanyMap} availableEditors={availableEditors} />
            </FormModal>
            <ConfirmModal {...confirmProps} />
        </div>
    );
}
