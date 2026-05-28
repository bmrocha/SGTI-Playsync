"use client";

interface Editor {
    id: string;
    name: string;
    email: string;
}

interface EditorSelectionProps {
    availableEditors: Editor[];
    selectedEditorIds: string[];
    onToggleEditor: (id: string) => void;
}

export default function EditorSelection({ availableEditors, selectedEditorIds, onToggleEditor }: EditorSelectionProps) {
    return (
        <div className="mb-5">
            <label className="block text-sm font-bold text-text-dark mb-2">
                Editores Responsáveis <span className="text-text-light text-xs">(opcional)</span>
            </label>
            <p className="text-xs text-text-light/80 mb-2">O administrador pode criar a empresa sem selecionar editores responsáveis.</p>
            <div className="bg-body-bg border-2 border-border rounded-lg p-3 max-h-40 overflow-y-auto custom-scrollbar">
                {availableEditors.length === 0 ? (
                    <div className="text-center py-4">
                        <p className="text-text-light text-sm">Nenhum editor ativo encontrado.</p>
                        <p className="text-xs text-text-light/70 mt-1">Cadastre usuários com perfil de Editor primeiro.</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {availableEditors.map((editor) => {
                            const isSelected = selectedEditorIds.includes(editor.id);
                            return (
                                <label
                                    key={editor.id}
                                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${isSelected
                                        ? "bg-brand-main/10 border border-brand-main/20"
                                        : "hover:bg-panel-bg border border-transparent"
                                        }`}
                                >
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => onToggleEditor(editor.id)}
                                            className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-border transition-all checked:border-brand-main checked:bg-brand-main"
                                        />
                                        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-3.5 w-3.5"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-text-dark">{editor.name}</span>
                                        <span className="text-xs text-text-light">{editor.email}</span>
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                )}
            </div>
            {selectedEditorIds.length === 0 && (
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 rounded-full bg-red-500"></span>
                    Selecione pelo menos um editor para gerenciar esta empresa.
                </p>
            )}
        </div>
    );
}
