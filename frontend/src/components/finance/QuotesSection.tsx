import { useState, type Dispatch, FormEvent, SetStateAction } from "react";
import type { Quote, QuoteForm, QuoteItemForm, Customer, CatalogItem } from "./FinanceContext";

type QuotesSectionProps = {
    quotes: Quote[];
    form: QuoteForm;
    setForm: Dispatch<SetStateAction<QuoteForm>>;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onAddItem: () => void;
    onUpdateItem: (index: number, field: keyof QuoteItemForm, value: string) => void;
    formatCurrency: (value: number | string) => string;
    customers: Customer[];
    catalog: CatalogItem[];
};

export default function QuotesSection({
    quotes,
    form,
    setForm,
    onSubmit,
    onAddItem,
    onUpdateItem,
    formatCurrency,
    customers,
    catalog,
}: QuotesSectionProps) {
    const [showForm, setShowForm] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);

    const handleCustomerSelect = (customerId: string) => {
        const id = parseInt(customerId);
        setSelectedCustomer(id);
        const customer = customers.find(c => c.id === id);
        if (customer) {
            setForm({ ...form, customerName: customer.name });
        }
    };

    const handleProductSelect = (index: number, catalogId: string) => {
        const id = parseInt(catalogId);
        const product = catalog.find(c => c.id === id);
        if (product) {
            onUpdateItem(index, "description", product.name);
            onUpdateItem(index, "unit", product.unit || "un");
            onUpdateItem(index, "unitPrice", product.unitPrice.toString());
        }
    };

    const removeItem = (index: number) => {
        const newItems = form.items.filter((_, i) => i !== index);
        setForm({ ...form, items: newItems });
    };

    const calculateTotal = () => {
        return form.items.reduce((sum, item) => {
            const qty = parseFloat(item.quantity) || 0;
            const price = parseFloat(item.unitPrice) || 0;
            return sum + (qty * price);
        }, 0);
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            DRAFT: "Rascunho",
            SENT: "Enviado",
            APPROVED: "Aprovado",
            REJECTED: "Rejeitado"
        };
        return labels[status] || status;
    };

    const getStatusClass = (status: string) => {
        const classes: Record<string, string> = {
            DRAFT: "badge-draft",
            SENT: "badge-info",
            APPROVED: "badge-success",
            REJECTED: "badge-danger"
        };
        return classes[status] || "badge-secondary";
    };

    return (
        <section className="modern-section">
            <div className="section-header-modern">
                <div>
                    <h2>💼 Orçamentos</h2>
                    <p className="section-subtitle">{quotes.length} orçamentos criados</p>
                </div>
                <button
                    className="btn-primary-modern"
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? "✕ Fechar" : "+ Novo Orçamento"}
                </button>
            </div>

            {showForm && (
                <div className="modern-form-card">
                    <form className="modern-form" onSubmit={onSubmit}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Cliente *</label>
                                <select
                                    value={selectedCustomer || ""}
                                    onChange={(e) => handleCustomerSelect(e.target.value)}
                                    className="modern-input"
                                    required
                                >
                                    <option value="">Selecione um cliente</option>
                                    {customers.map(customer => (
                                        <option key={customer.id} value={customer.id}>
                                            {customer.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Status</label>
                                <select
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                                    className="modern-input"
                                >
                                    <option value="DRAFT">Rascunho</option>
                                    <option value="SENT">Enviado</option>
                                    <option value="APPROVED">Aprovado</option>
                                    <option value="REJECTED">Rejeitado</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Data de Emissão *</label>
                                <input
                                    type="date"
                                    value={form.issueDate}
                                    onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                                    className="modern-input"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Válido Até *</label>
                                <input
                                    type="date"
                                    value={form.validUntil}
                                    onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                                    className="modern-input"
                                    required
                                />
                            </div>
                        </div>

                        <div className="items-section">
                            <div className="items-header">
                                <h3>Itens do Orçamento</h3>
                                <button type="button" className="btn-secondary-modern" onClick={onAddItem}>
                                    + Adicionar Item
                                </button>
                            </div>

                            {form.items.map((item, index) => (
                                <div className="quote-item-modern" key={index}>
                                    <div className="item-row">
                                        <div className="form-group flex-2">
                                            <label>Produto/Serviço</label>
                                            <select
                                                onChange={(e) => handleProductSelect(index, e.target.value)}
                                                className="modern-input"
                                            >
                                                <option value="">Selecione do catálogo</option>
                                                {catalog.map(cat => (
                                                    <option key={cat.id} value={cat.id}>
                                                        {cat.name} - {formatCurrency(cat.unitPrice)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-group flex-2">
                                            <label>Descrição *</label>
                                            <input
                                                placeholder="Descrição do item"
                                                value={item.description}
                                                onChange={(e) => onUpdateItem(index, "description", e.target.value)}
                                                className="modern-input"
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Unidade</label>
                                            <input
                                                placeholder="un"
                                                value={item.unit}
                                                onChange={(e) => onUpdateItem(index, "unit", e.target.value)}
                                                className="modern-input"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Qtd *</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="1"
                                                value={item.quantity}
                                                onChange={(e) => onUpdateItem(index, "quantity", e.target.value)}
                                                className="modern-input"
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Preço Unit. *</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={item.unitPrice}
                                                onChange={(e) => onUpdateItem(index, "unitPrice", e.target.value)}
                                                className="modern-input"
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Total</label>
                                            <div className="item-total">
                                                {formatCurrency((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0))}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            className="btn-remove"
                                            onClick={() => removeItem(index)}
                                            title="Remover item"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="form-group">
                            <label>Observações</label>
                            <textarea
                                className="modern-textarea"
                                placeholder="Observações adicionais..."
                                value={form.notes}
                                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                rows={3}
                            />
                        </div>

                        <div className="form-total">
                            <span>Total do Orçamento:</span>
                            <strong>{formatCurrency(calculateTotal())}</strong>
                        </div>

                        <button type="submit" className="btn-success-modern">
                            💾 Criar Orçamento
                        </button>
                    </form>
                </div>
            )}

            <div className="modern-table-container">
                <table className="modern-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Cliente</th>
                            <th>Status</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {quotes.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="empty-state">
                                    Nenhum orçamento criado ainda
                                </td>
                            </tr>
                        ) : (
                            quotes.map((quote) => (
                                <tr key={quote.id}>
                                    <td>#{quote.id}</td>
                                    <td><strong>{quote.customerName}</strong></td>
                                    <td>
                                        <span className={`badge ${getStatusClass(quote.status)}`}>
                                            {getStatusLabel(quote.status)}
                                        </span>
                                    </td>
                                    <td><strong>{formatCurrency(quote.total)}</strong></td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
