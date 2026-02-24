import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import { getToken } from "../services/authStorage";
import { useToast } from "../hooks/useToast";
import { ToastContainer } from "../components/Toast";

interface ImportResult {
    success: boolean;
    nfeNumber: string;
    nfeKey: string;
    issuer: string;
    totalItems: number;
    itemsImported: number;
    itemsUpdated: number;
    items: Array<{
        name: string;
        quantity: number;
        status: 'created' | 'updated';
        oldStock?: number;
        newStock: number;
    }>;
}

export default function NFeImportPage() {
    const navigate = useNavigate();
    const { toasts, removeToast, success, error, warning } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);

    async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (!selectedFile.name.endsWith('.xml')) {
                error('Apenas arquivos XML são permitidos');
                return;
            }
            setFile(selectedFile);
            setResult(null);
        }
    }

    async function handleImport() {
        if (!file) {
            warning('Selecione um arquivo XML');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('http://localhost:8080/api/finance/nfe-import/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${getToken()}`
                },
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao importar NFe');
            }

            const data: ImportResult = await response.json();
            setResult(data);
            success(
                `NFe importada! ${data.itemsImported} novos, ${data.itemsUpdated} atualizados`
            );
        } catch (err) {
            error(err instanceof Error ? err.message : 'Erro ao importar NFe');
        } finally {
            setLoading(false);
        }
    }

    function handleReset() {
        setFile(null);
        setResult(null);
        // Reset file input
        const fileInput = document.getElementById('xml-file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    }

    return (
        <AppShell
            title="Importar NFe"
            subtitle="Importar produtos e estoque a partir de XML de Nota Fiscal"
            actions={
                <button className="btn-secondary" onClick={() => navigate('/finance/stock')}>
                    Voltar para Estoque
                </button>
            }
        >
            <div className="container">
                {!result ? (
                    <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
                            Upload do XML
                        </h2>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <div
                                style={{
                                    border: '2px dashed var(--border)',
                                    borderRadius: '8px',
                                    padding: '2rem',
                                    textAlign: 'center',
                                    background: 'var(--card-bg)'
                                }}
                            >
                                <svg
                                    style={{ width: '48px', height: '48px', margin: '0 auto 1rem', opacity: 0.6 }}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                    />
                                </svg>
                                <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                                    {file ? (
                                        <>
                                            <strong>{file.name}</strong>
                                            <br />
                                            <small>{(file.size / 1024).toFixed(2)} KB</small>
                                        </>
                                    ) : (
                                        'Selecione o arquivo XML da NFe'
                                    )}
                                </p>
                                <label htmlFor="xml-file" className="btn-primary" style={{ cursor: 'pointer' }}>
                                    Selecionar Arquivo
                                </label>
                                <input
                                    id="xml-file"
                                    type="file"
                                    accept=".xml"
                                    onChange={handleFileSelect}
                                    style={{ display: 'none' }}
                                />
                            </div>
                        </div>

                        <div className="alert" style={{ background: '#3b82f614', border: '1px solid #3b82f633' }}>
                            <strong>ℹ️ Informações:</strong>
                            <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                                <li>O sistema irá buscar produtos pelo código EAN/GTIN ou SKU</li>
                                <li>Produtos existentes terão seu estoque aumentado</li>
                                <li>Produtos novos serão criados automaticamente</li>
                                <li>Preço de venda será calculado com 30% de markup sobre o custo</li>
                            </ul>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                            <button
                                className="btn-primary"
                                onClick={handleImport}
                                disabled={!file || loading}
                                style={{ flex: 1 }}
                            >
                                {loading ? 'Importando...' : 'Importar NFe'}
                            </button>
                            {file && (
                                <button className="btn-secondary" onClick={handleReset}>
                                    Limpar
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="card" style={{ maxWidth: '900px', margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div
                                style={{
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: '50%',
                                    background: '#10b98114',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 1rem'
                                }}
                            >
                                <svg
                                    style={{ width: '32px', height: '32px', color: '#10b981' }}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                Importação Concluída!
                            </h2>
                            <p style={{ color: 'var(--text-secondary)' }}>NFe processada com sucesso</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                            <div className="card" style={{ background: 'var(--bg)', padding: '1rem' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                    NFe Número
                                </div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{result.nfeNumber}</div>
                            </div>
                            <div className="card" style={{ background: 'var(--bg)', padding: '1rem' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                    Fornecedor
                                </div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{result.issuer}</div>
                            </div>
                            <div className="card" style={{ background: 'var(--bg)', padding: '1rem' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                    Novos Produtos
                                </div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#10b981' }}>
                                    {result.itemsImported}
                                </div>
                            </div>
                            <div className="card" style={{ background: 'var(--bg)', padding: '1rem' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                    Atualizados
                                </div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#3b82f6' }}>
                                    {result.itemsUpdated}
                                </div>
                            </div>
                        </div>

                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
                            Produtos Importados ({result.totalItems})
                        </h3>

                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Produto</th>
                                        <th style={{ textAlign: 'center' }}>Quantidade</th>
                                        <th style={{ textAlign: 'center' }}>Estoque Anterior</th>
                                        <th style={{ textAlign: 'center' }}>Estoque Novo</th>
                                        <th style={{ textAlign: 'center' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.items.map((item, index) => (
                                        <tr key={index}>
                                            <td>{item.name}</td>
                                            <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                {item.oldStock !== undefined ? item.oldStock : '-'}
                                            </td>
                                            <td style={{ textAlign: 'center', fontWeight: 600 }}>
                                                {item.newStock}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span
                                                    className="badge"
                                                    style={{
                                                        background:
                                                            item.status === 'created' ? '#10b98114' : '#3b82f614',
                                                        color: item.status === 'created' ? '#10b981' : '#3b82f6'
                                                    }}
                                                >
                                                    {item.status === 'created' ? 'Novo' : 'Atualizado'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '2rem' }}>
                            <button className="btn-primary" onClick={handleReset} style={{ flex: 1 }}>
                                Importar Outra NFe
                            </button>
                            <button className="btn-secondary" onClick={() => navigate('/finance/stock')}>
                                Ir para Estoque
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <ToastContainer toasts={toasts} onClose={removeToast} />
        </AppShell>
    );
}
