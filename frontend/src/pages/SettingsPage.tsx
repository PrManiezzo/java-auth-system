import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import api from "../services/api";
import { useToast } from "../hooks/useToast";

interface SystemConfig {
    id?: number;
    companyName?: string;
    cnpj?: string;
    ie?: string;
    im?: string;
    address?: string;
    number?: string;
    complement?: string;
    district?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    phone?: string;
    email?: string;
    website?: string;
    logoBase64?: string;
    printerName?: string;
    paperWidth?: number;
    paperHeight?: number;
    autoPrint?: boolean;
    copies?: number;
    systemName?: string;
    defaultCurrency?: string;
    dateFormat?: string;
    timeFormat?: string;
    nfeEnabled?: boolean;
    nfeApiUrl?: string;
    nfeApiToken?: string;
    nfeSeries?: string;
    nfeLastNumber?: number;
    nfeEnvironment?: string;
}

export default function SettingsPage() {
    const navigate = useNavigate();
    const { toasts, removeToast, success, error } = useToast();
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState<SystemConfig>({
        systemName: "Negócio",
        defaultCurrency: "BRL",
        dateFormat: "DD/MM/YYYY",
        timeFormat: "24h",
        autoPrint: false,
        copies: 1,
        paperWidth: 80,
        paperHeight: 297,
        nfeEnabled: false,
        nfeEnvironment: "HOMOLOGATION"
    });

    const [activeTab, setActiveTab] = useState<"company" | "print" | "system" | "nfe">("company");

    useEffect(() => {
        loadConfig();
    }, []);

    async function loadConfig() {
        try {
            const response = await api.get<SystemConfig>("/settings");
            setConfig(response.data);
        } catch (err) {
            console.error("Erro ao carregar configurações:", err);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post("/settings", config);
            success("Configurações salvas com sucesso!");
        } catch (err) {
            error("Erro ao salvar configurações");
        } finally {
            setLoading(false);
        }
    }

    function handleChange(field: keyof SystemConfig, value: any) {
        setConfig(prev => ({ ...prev, [field]: value }));
    }

    return (
        <AppShell
            title="Configurações"
            subtitle="Configure seu sistema, empresa e impressoras"
            actions={
                <button className="btn-secondary" onClick={() => navigate("/dashboard")}>
                    Voltar
                </button>
            }
        >
            <div className="container">
                <div className="card">
                    {/* Tabs */}
                    <div style={{
                        display: "flex",
                        gap: "0.5rem",
                        marginBottom: "2rem",
                        borderBottom: "2px solid var(--border)",
                        overflowX: "auto"
                    }}>
                        <button
                            className={activeTab === "company" ? "btn-primary" : "btn-ghost"}
                            onClick={() => setActiveTab("company")}
                            style={{
                                borderRadius: "8px 8px 0 0",
                                borderBottom: activeTab === "company" ? "2px solid var(--accent)" : "none",
                                marginBottom: "-2px"
                            }}
                        >
                            🏢 Empresa
                        </button>
                        <button
                            className={activeTab === "print" ? "btn-primary" : "btn-ghost"}
                            onClick={() => setActiveTab("print")}
                            style={{
                                borderRadius: "8px 8px 0 0",
                                borderBottom: activeTab === "print" ? "2px solid var(--accent)" : "none",
                                marginBottom: "-2px"
                            }}
                        >
                            🖨️ Impressão
                        </button>
                        <button
                            className={activeTab === "system" ? "btn-primary" : "btn-ghost"}
                            onClick={() => setActiveTab("system")}
                            style={{
                                borderRadius: "8px 8px 0 0",
                                borderBottom: activeTab === "system" ? "2px solid var(--accent)" : "none",
                                marginBottom: "-2px"
                            }}
                        >
                            ⚙️ Sistema
                        </button>
                        <button
                            className={activeTab === "nfe" ? "btn-primary" : "btn-ghost"}
                            onClick={() => setActiveTab("nfe")}
                            style={{
                                borderRadius: "8px 8px 0 0",
                                borderBottom: activeTab === "nfe" ? "2px solid var(--accent)" : "none",
                                marginBottom: "-2px"
                            }}
                        >
                            📄 Nota Fiscal
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Company Tab */}
                        {activeTab === "company" && (
                            <div>
                                <h3 style={{ marginBottom: "1.5rem", fontSize: "1.25rem", fontWeight: 600 }}>
                                    Dados da Empresa
                                </h3>

                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
                                    <div className="form-group">
                                        <label>Nome da Empresa <span className="required">*</span></label>
                                        <input
                                            type="text"
                                            value={config.companyName || ""}
                                            onChange={(e) => handleChange("companyName", e.target.value)}
                                            placeholder="Ex: Minha Empresa LTDA"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>CNPJ</label>
                                        <input
                                            type="text"
                                            value={config.cnpj || ""}
                                            onChange={(e) => handleChange("cnpj", e.target.value)}
                                            placeholder="00.000.000/0000-00"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Inscrição Estadual (IE)</label>
                                        <input
                                            type="text"
                                            value={config.ie || ""}
                                            onChange={(e) => handleChange("ie", e.target.value)}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Inscrição Municipal (IM)</label>
                                        <input
                                            type="text"
                                            value={config.im || ""}
                                            onChange={(e) => handleChange("im", e.target.value)}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Endereço</label>
                                        <input
                                            type="text"
                                            value={config.address || ""}
                                            onChange={(e) => handleChange("address", e.target.value)}
                                            placeholder="Rua, Avenida..."
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Número</label>
                                        <input
                                            type="text"
                                            value={config.number || ""}
                                            onChange={(e) => handleChange("number", e.target.value)}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Complemento</label>
                                        <input
                                            type="text"
                                            value={config.complement || ""}
                                            onChange={(e) => handleChange("complement", e.target.value)}
                                            placeholder="Sala, Andar..."
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Bairro</label>
                                        <input
                                            type="text"
                                            value={config.district || ""}
                                            onChange={(e) => handleChange("district", e.target.value)}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Cidade</label>
                                        <input
                                            type="text"
                                            value={config.city || ""}
                                            onChange={(e) => handleChange("city", e.target.value)}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Estado (UF)</label>
                                        <input
                                            type="text"
                                            value={config.state || ""}
                                            onChange={(e) => handleChange("state", e.target.value)}
                                            placeholder="SP"
                                            maxLength={2}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>CEP</label>
                                        <input
                                            type="text"
                                            value={config.zipCode || ""}
                                            onChange={(e) => handleChange("zipCode", e.target.value)}
                                            placeholder="00000-000"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Telefone</label>
                                        <input
                                            type="text"
                                            value={config.phone || ""}
                                            onChange={(e) => handleChange("phone", e.target.value)}
                                            placeholder="(00) 00000-0000"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>E-mail</label>
                                        <input
                                            type="email"
                                            value={config.email || ""}
                                            onChange={(e) => handleChange("email", e.target.value)}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Website</label>
                                        <input
                                            type="text"
                                            value={config.website || ""}
                                            onChange={(e) => handleChange("website", e.target.value)}
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Print Tab */}
                        {activeTab === "print" && (
                            <div>
                                <h3 style={{ marginBottom: "1.5rem", fontSize: "1.25rem", fontWeight: 600 }}>
                                    Configurações de Impressão
                                </h3>

                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
                                    <div className="form-group">
                                        <label>Nome da Impressora</label>
                                        <input
                                            type="text"
                                            value={config.printerName || ""}
                                            onChange={(e) => handleChange("printerName", e.target.value)}
                                            placeholder="Ex: HP LaserJet"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Largura do Papel (mm)</label>
                                        <input
                                            type="number"
                                            value={config.paperWidth || ""}
                                            onChange={(e) => handleChange("paperWidth", parseInt(e.target.value))}
                                            placeholder="80"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Altura do Papel (mm)</label>
                                        <input
                                            type="number"
                                            value={config.paperHeight || ""}
                                            onChange={(e) => handleChange("paperHeight", parseInt(e.target.value))}
                                            placeholder="297"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Número de Cópias</label>
                                        <input
                                            type="number"
                                            value={config.copies || 1}
                                            onChange={(e) => handleChange("copies", parseInt(e.target.value))}
                                            min="1"
                                            max="10"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                            <input
                                                type="checkbox"
                                                checked={config.autoPrint || false}
                                                onChange={(e) => handleChange("autoPrint", e.target.checked)}
                                            />
                                            Impressão Automática
                                        </label>
                                        <small style={{ color: "var(--text-secondary)" }}>
                                            Imprime automaticamente vendas e cupons
                                        </small>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* System Tab */}
                        {activeTab === "system" && (
                            <div>
                                <h3 style={{ marginBottom: "1.5rem", fontSize: "1.25rem", fontWeight: 600 }}>
                                    Configurações do Sistema
                                </h3>

                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
                                    <div className="form-group">
                                        <label>Nome do Sistema <span className="required">*</span></label>
                                        <input
                                            type="text"
                                            value={config.systemName || ""}
                                            onChange={(e) => handleChange("systemName", e.target.value)}
                                            placeholder="Ex: Meu Sistema"
                                        />
                                        <small style={{ color: "var(--text-secondary)" }}>
                                            Nome exibido no menu e relatórios
                                        </small>
                                    </div>

                                    <div className="form-group">
                                        <label>Moeda Padrão</label>
                                        <select
                                            value={config.defaultCurrency || "BRL"}
                                            onChange={(e) => handleChange("defaultCurrency", e.target.value)}
                                        >
                                            <option value="BRL">BRL - Real Brasileiro</option>
                                            <option value="USD">USD - Dólar Americano</option>
                                            <option value="EUR">EUR - Euro</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Formato de Data</label>
                                        <select
                                            value={config.dateFormat || "DD/MM/YYYY"}
                                            onChange={(e) => handleChange("dateFormat", e.target.value)}
                                        >
                                            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Formato de Hora</label>
                                        <select
                                            value={config.timeFormat || "24h"}
                                            onChange={(e) => handleChange("timeFormat", e.target.value)}
                                        >
                                            <option value="24h">24 horas</option>
                                            <option value="12h">12 horas (AM/PM)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* NFe Tab */}
                        {activeTab === "nfe" && (
                            <div>
                                <h3 style={{ marginBottom: "1.5rem", fontSize: "1.25rem", fontWeight: 600 }}>
                                    Configurações de Nota Fiscal Eletrônica
                                </h3>

                                <div className="alert" style={{ background: "#fbbf2414", border: "1px solid #fbbf2433", marginBottom: "1.5rem" }}>
                                    <strong>⚠️ Atenção:</strong>
                                    <p style={{ marginTop: "0.5rem" }}>
                                        Para emitir NFe, você precisa contratar um serviço como NFe.io, PlugNotas ou Focus NFe.
                                        <br />
                                        Veja o arquivo <strong>NOTA_FISCAL_APIs.md</strong> para mais informações.
                                    </p>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
                                    <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                                        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                            <input
                                                type="checkbox"
                                                checked={config.nfeEnabled || false}
                                                onChange={(e) => handleChange("nfeEnabled", e.target.checked)}
                                            />
                                            Habilitar Emissão de NFe
                                        </label>
                                    </div>

                                    {config.nfeEnabled && (
                                        <>
                                            <div className="form-group">
                                                <label>URL da API</label>
                                                <input
                                                    type="text"
                                                    value={config.nfeApiUrl || ""}
                                                    onChange={(e) => handleChange("nfeApiUrl", e.target.value)}
                                                    placeholder="https://api.nfe.io/v1"
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label>Token da API</label>
                                                <input
                                                    type="password"
                                                    value={config.nfeApiToken || ""}
                                                    onChange={(e) => handleChange("nfeApiToken", e.target.value)}
                                                    placeholder="seu-token-aqui"
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label>Série da NFe</label>
                                                <input
                                                    type="text"
                                                    value={config.nfeSeries || ""}
                                                    onChange={(e) => handleChange("nfeSeries", e.target.value)}
                                                    placeholder="1"
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label>Último Número</label>
                                                <input
                                                    type="number"
                                                    value={config.nfeLastNumber || 0}
                                                    onChange={(e) => handleChange("nfeLastNumber", parseInt(e.target.value))}
                                                />
                                                <small style={{ color: "var(--text-secondary)" }}>
                                                    Próxima NFe será: {(config.nfeLastNumber || 0) + 1}
                                                </small>
                                            </div>

                                            <div className="form-group">
                                                <label>Ambiente</label>
                                                <select
                                                    value={config.nfeEnvironment || "HOMOLOGATION"}
                                                    onChange={(e) => handleChange("nfeEnvironment", e.target.value)}
                                                >
                                                    <option value="HOMOLOGATION">Homologação (Testes)</option>
                                                    <option value="PRODUCTION">Produção</option>
                                                </select>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        <div style={{ display: "flex", gap: "0.5rem", marginTop: "2rem", paddingTop: "2rem", borderTop: "1px solid var(--border)" }}>
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={loading}
                                style={{ flex: 1 }}
                            >
                                {loading ? "Salvando..." : "Salvar Configurações"}
                            </button>
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => navigate("/dashboard")}
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppShell>
    );
}
