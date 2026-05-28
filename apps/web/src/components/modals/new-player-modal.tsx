"use client";

import { useState, useRef, useEffect } from "react";
import { FormModal } from "./form-modal";
import { usePlayerStore, Player } from "@/lib/player-store";
import { useAppStore } from "@/lib/store";
import { Copy, Check, Terminal, Info, Building2, MapPin, Network, Lock, Key, Eye, EyeOff } from "lucide-react";
import { CustomSelect } from "@/components/ui/custom-select";
import { notifySuccess, notifyError } from "@/lib/notification-store";

interface NewPlayerModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: Player | null;
}

export function NewPlayerModal({ isOpen, onClose, initialData }: NewPlayerModalProps) {
    const { addPlayer } = usePlayerStore();
    const { companies } = useAppStore();

    // Form State
    const [name, setName] = useState(initialData?.name || "");
    const [companyId, setCompanyId] = useState(initialData?.companyId || "");
    const [location, setLocation] = useState(initialData?.location || "");

    // Credentials
    const [ip, setIp] = useState(initialData?.credentials?.ip || "");
    const [username, setUsername] = useState(initialData?.credentials?.username || "");
    const [password, setPassword] = useState(initialData?.credentials?.password || "");
    const [sshKey, setSshKey] = useState(initialData?.credentials?.sshKey || "");
    const [showSshKey, setShowSshKey] = useState(false);

    const [createdPlayer, setCreatedPlayer] = useState<Player | null>(null);
    const [copied, setCopied] = useState(false);

    // Update state when initialData changes (e.g. when opening for different player)
    // We can use a key on the component to reset state, or useEffect. 
    // Since this is a modal, it's often cleaner to treat it as uncontrolled or verify active player.
    // For simplicity, we assume the parent handles the key or unmount. Or we add a useEffect.
    useEffect(() => {
        if (isOpen && initialData) {
            setName(initialData.name);
            setCompanyId(initialData.companyId);
            setLocation(initialData.location);
            setIp(initialData.credentials?.ip || "");
            setUsername(initialData.credentials?.username || "");
            setPassword(initialData.credentials?.password || "");
            setSshKey(initialData.credentials?.sshKey || "");
        } else if (isOpen && !initialData) {
            // Reset if opening for new
            handleCloseState();
        }
    }, [isOpen, initialData]);

    // Get list of companies for valid dropdown options
    const companyList = Object.values(companies);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic Validation
        if (!name.trim() || !companyId || !location.trim()) {
            notifyError("Preencha os campos obrigatórios", "Nome e empresa são necessários para criar um player");
            return;
        }

        try {
            if (initialData) {
                const updates = {
                    name,
                    companyId,
                    location,
                    credentials: {
                        ip: ip || initialData.credentials?.ip || "",
                        username: username || initialData.credentials?.username || "",
                        password: password || initialData.credentials?.password,
                        sshKey: sshKey || initialData.credentials?.sshKey
                    }
                };

                const { updatePlayer } = usePlayerStore.getState();
                // Update local store (optimistic)
                updatePlayer(initialData.id, updates);

                // Persist to Server
                await fetch('/api/players', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: initialData.id, updates })
                });

                // Update the created player used for displaying install command
                setCreatedPlayer({ ...initialData, ...updates });
notifySuccess("Player atualizado!", "As alterações foram salvas com sucesso");
                window.dispatchEvent(new Event('refresh-players'));
                handleClose();
                return;
            }

            // Create New Player
            const response = await fetch('/api/players', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    companyId,
                    location,
                    credentials: {
                        ip,
                        username,
                        password,
                        sshKey
                    }
                })
            });

            if (!response.ok) {
                throw new Error('Falha ao criar player');
            }

            const newPlayer = await response.json();

            // Update local store (optional, but good for consistency if store is used elsewhere)
            const { addPlayer } = usePlayerStore.getState();
            // We pass the ID and Token from server to ensure consistency
            addPlayer({
                ...newPlayer,
                files: newPlayer.attachedFiles
            });

            setCreatedPlayer(newPlayer);
            notifySuccess("Player configurado com sucesso!", "O player já pode ser utilizado");
            window.dispatchEvent(new Event('refresh-players')); // Refresh list

        } catch (error) {
            console.error("Error saving player:", error);
            notifyError("Erro ao salvar player", "Verifique os dados e tente novamente");
        }
    };

    const handleCloseState = () => {
        setName("");
        setCompanyId("");
        setLocation("");
        setIp("");
        setUsername("");
        setPassword("");
        setSshKey("");
        setShowSshKey(false);
        setCreatedPlayer(null);
        setCopied(false);
    };

    const handleClose = () => {
        handleCloseState();
        onClose();
    };

    const installCommand = createdPlayer
        ? `curl -sL http://172.23.239.142/install_simple_tvagent.sh | sudo bash -s -- ${createdPlayer.id} "${createdPlayer.token}"`
        : "";

    const handleCopy = () => {
        navigator.clipboard.writeText(installCommand);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        notifySuccess("Comando copiado!", "Cole no terminal do player para configurar");
    };

    if (createdPlayer) {
        return (
            <FormModal
                isOpen={isOpen}
                onClose={handleClose}
                title="Sincronização do Player"
                maxWidth="max-w-2xl"
                footer={
                    <button
                        onClick={handleClose}
                        className="bg-brand-main text-white px-4 py-2 rounded-lg hover:bg-brand-main/90 transition-colors"
                    >
                        Concluir e Fechar
                    </button>
                }
            >
                <div className="space-y-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-green-800">Cadastro Realizado!</h4>
                            <p className="text-sm text-green-700">
                                O dispositivo <strong>{createdPlayer.name}</strong> foi registrado no sistema.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-dark flex items-center gap-2">
                            <Terminal className="w-4 h-4 text-brand-main" />
                            Instalação Remota (SSH)
                        </label>
                        <p className="text-xs text-text-light mb-2">
                            Acesse o dispositivo via SSH ({createdPlayer.credentials?.ip}) e rode o comando:
                        </p>
                        <div className="relative">
                            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto whitespace-pre-wrap break-all pr-12">
                                {installCommand}
                            </pre>
                            <button
                                onClick={handleCopy}
                                className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 rounded text-white transition-colors"
                                title="Copiar comando"
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>
            </FormModal>
        );
    }

    return (
        <FormModal
            isOpen={isOpen}
            onClose={handleClose}
            title={initialData ? "Editor de Players" : "Adicionar Novo Player"}
            maxWidth="max-w-2xl"
            footer={
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-4 py-2 text-text-light hover:text-text-dark transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={
                            !name.trim() ||
                            !companyId ||
                            (!!initialData &&
                                name === initialData.name &&
                                companyId === initialData.companyId &&
                                location === initialData.location &&
                                ip === (initialData.credentials?.ip || "") &&
                                username === (initialData.credentials?.username || "") &&
                                password === (initialData.credentials?.password || "") &&
                                sshKey === (initialData.credentials?.sshKey || "")
                            )
                        }
                        className="bg-brand-main text-white px-6 py-2 rounded-lg hover:bg-brand-main/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-brand-main/20 shadow-lg"
                    >
                        {initialData ? "Salvar Alterações" : "Criar Player"}
                    </button>
                </div>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Identificação Básica */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-text-dark mb-1">Nome do Dispositivo *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Recepção Principal"
                            className="w-full p-2.5 border border-border rounded-lg focus:ring-2 focus:ring-brand-main/20 focus:border-brand-main outline-none bg-panel-bg"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-dark mb-1 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-text-light" /> Empresa Ativa *
                        </label>
                        <CustomSelect
                            value={companyId}
                            onChange={(value) => setCompanyId(value)}
                            options={companyList.map(comp => ({
                                value: comp.id,
                                label: comp.name
                            }))}
                            placeholder="Selecione..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-dark mb-1 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-text-light" /> Localização *
                        </label>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Ex: Térreo, Sala 302"
                            className="w-full p-3 border border-border rounded-lg bg-body-bg text-text-dark focus:border-brand-main focus:ring-2 focus:ring-brand-main/20 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="border-t border-border pt-4">
                    <h4 className="text-sm font-semibold text-text-dark mb-3 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-brand-main" /> Credenciais de Acesso (SSH)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-3">
                            <label className="block text-xs text-text-light mb-1 uppercase tracking-wide">IP / Hostname</label>
                            <div className="relative">
                                <Network className="absolute left-3 top-2.5 w-4 h-4 text-text-light" />
                                <input
                                    type="text"
                                    value={ip}
                                    onChange={(e) => setIp(e.target.value)}
                                    placeholder="192.168.1.X"
                                    className="w-full pl-9 p-3 border border-border rounded-lg bg-body-bg text-text-dark focus:border-brand-main focus:ring-2 focus:ring-brand-main/20 outline-none transition-all text-sm font-mono"
                                />
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs text-text-light mb-1 uppercase tracking-wide">Usuário</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="pi"
                                className="w-full p-3 border border-border rounded-lg bg-body-bg text-text-dark focus:border-brand-main focus:ring-2 focus:ring-brand-main/20 outline-none transition-all text-sm"
                            />
                        </div>
                    </div>
                </div>

                <div className="border-t border-border pt-4">
                    <label className="block text-sm font-medium text-text-dark mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Key className="w-4 h-4 text-brand-main" /> Chave SSH (Privada)
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowSshKey(!showSshKey)}
                            className="text-xs text-brand-main hover:text-brand-accent flex items-center gap-1 font-semibold"
                        >
                            {showSshKey ? (
                                <><EyeOff className="w-3 h-3" /> Ocultar</>
                            ) : (
                                <><Eye className="w-3 h-3" /> Mostrar</>
                            )}
                        </button>
                    </label>
                    <div className="relative">
                        <textarea
                            value={sshKey}
                            onChange={(e) => setSshKey(e.target.value)}
                            placeholder="-----BEGIN OPENSSH PRIVATE KEY-----..."
                            rows={4}
                            className={`w-full p-3 border border-border rounded-lg bg-body-bg text-text-dark focus:border-brand-main focus:ring-2 focus:ring-brand-main/20 outline-none transition-all font-mono text-xs ${!showSshKey && sshKey ? 'text-transparent select-none' : ''}`}
                            spellCheck={false}
                            style={{
                                textShadow: !showSshKey && sshKey ? '0 0 8px rgba(0,0,0,0.5)' : 'none'
                            }}
                        />
                        {!showSshKey && sshKey && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-text-light/50 text-sm font-medium flex items-center gap-2">
                                    <Lock className="w-4 h-4" /> Conteúdo Oculto
                                </span>
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-text-light mt-2">
                        Cole o conteúdo da sua chave privada (id_rsa) para permitir o gerenciamento remoto.
                        <br /><strong>Segurança:</strong> Esta chave será armazenada localmente apenas.
                    </p>
                </div>
            </form>
        </FormModal>
    );
}
