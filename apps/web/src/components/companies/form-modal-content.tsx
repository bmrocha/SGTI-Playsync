"use client";

import EditorSelection from "./editor-selection";
import ColorPicker from "./color-picker";

interface FormData {
    name: string;
    description: string;
    color: string;
    selectedEditors: string[];
}

interface FormModalContentProps {
    formData: FormData;
    setFormData: (data: FormData) => void;
    editingCompany: boolean;
    usedColors: string[];
    colorToCompanyMap: Record<string, string>;
    availableEditors: { id: string; name: string; email: string }[];
}

export default function FormModalContent({
    formData,
    setFormData,
    editingCompany,
    usedColors,
    colorToCompanyMap,
    availableEditors,
}: FormModalContentProps) {
    return (
        <div>
            <div className="mb-5">
                <label className="block text-sm font-bold text-text-dark mb-2">Nome da Empresa</label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Agência Centro, Matriz, etc."
                    className="w-full p-3 bg-body-bg border-2 border-border rounded-lg text-base focus:border-brand-main focus:ring-4 focus:ring-brand-main/10 outline-none transition-all text-text-dark placeholder:text-text-light/50"
                    autoFocus
                />
            </div>
            <div className="mb-5">
                <label className="block text-sm font-bold text-text-dark mb-2">Descrição / Localização</label>
                <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ex: Rua das Flores, 123"
                    className="w-full p-3 bg-body-bg border-2 border-border rounded-lg text-base focus:border-brand-main focus:ring-4 focus:ring-brand-main/10 outline-none transition-all text-text-dark placeholder:text-text-light/50"
                />
            </div>

            {!editingCompany && (
                <EditorSelection
                    availableEditors={availableEditors}
                    selectedEditorIds={formData.selectedEditors}
                    onToggleEditor={(id) => {
                        const selected = formData.selectedEditors.includes(id)
                            ? formData.selectedEditors.filter((e) => e !== id)
                            : [...formData.selectedEditors, id];
                        setFormData({ ...formData, selectedEditors: selected });
                    }}
                />
            )}

            <ColorPicker
                selectedColor={formData.color}
                usedColors={usedColors}
                colorToCompanyMap={colorToCompanyMap}
                onColorSelect={(color) => setFormData({ ...formData, color })}
            />
        </div>
    );
}
