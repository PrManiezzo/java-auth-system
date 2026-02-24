import { useState, useEffect } from "react";
import AppShell from "../components/layout/AppShell";
import { ToastContainer } from "../components/Toast";
import { useToast } from "../hooks/useToast";
import api from "../services/api";

interface SaleItem {
    id?: number;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
    productId?: string;
}

interface Sale {
    id?: number;
    customerId?: string;
    customerName: string;
    saleDate: string;
    status: "PENDING" | "PAID" | "CANCELLED";
    items: SaleItem[];
    total: number;
    notes?: string;
}

interface Customer {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    unit: string;
    salePrice: number;
}

export default function SalesPage() {
    const { toasts, removeToast, success, error } = useToast();
    const [sales, setSales] = useState<Sale[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [catalog, setCatalog] = useState<Product[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingSale, setEditingSale] = useState<Sale | null>(null);
    const [filterStatus, setFilterStatus] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState<Sale>({
        customerName: "",
        customerId: "",
        saleDate: new Date().toISOString().split("T")[0],
        status: "PENDING",
        items: [{ description: "", quantity: 1, unit: "un", unitPrice: 0, total: 0 }],
        total: 0,
        notes: "",
    });

    useEffect(() => {
        loadSales();
        loadCustomers();
        loadCatalog();
    }, [filterStatus, searchTerm]);

    const loadSales = async () => {
        try {
            const params = new URLSearchParams();
            if (filterStatus) params.append("status", filterStatus);
            if (searchTerm) params.append("search", searchTerm);

            const url = `/finance/sales${params.toString() ? "?" + params.toString() : ""}`;
            const response = await api.get(url);
            setSales(response.data);
        } catch (err) {
            error("Erro ao carregar", "Não foi possível carregar as vendas");
        }
    };

    const loadCustomers = async () => {
        try {
            const response = await api.get("/finance/customers");
            setCustomers(response.data);
        } catch (err) {
            error("Erro ao carregar", "Não foi possível carregar os clientes");
        }
    };

    const loadCatalog = async () => {
        try {
            const response = await api.get("/finance/catalog");
            setCatalog(response.data);
        } catch (err) {
            error("Erro ao carregar", "Não foi possível carregar o catálogo");
        }
    };

    const calculateTotal = (items: SaleItem[]) => {
        return items.reduce((sum, item) => sum + item.total, 0);
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...formData.items];
        const item = { ...newItems[index] };

        if (field === "productId" && value) {
            const product = catalog.find((p) => p.id.toString() === value);
            if (product) {
                item.description = product.name;
                item.unit = product.unit;
                item.unitPrice = product.salePrice;
                item.productId = value;
            }
        } else {
            (item as any)[field] = value;
        }

        if (field === "quantity" || field === "unitPrice") {
            item.total = item.quantity * item.unitPrice;
        }

        newItems[index] = item;
        const total = calculateTotal(newItems);
        setFormData({ ...formData, items: newItems, total });
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { description: "", quantity: 1, unit: "un", unitPrice: 0, total: 0 }],
        });
    };

    const removeItem = (index: number) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        const total = calculateTotal(newItems);
        setFormData({ ...formData, items: newItems, total });
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.customerId) {
            newErrors.customerId = "Cliente é obrigatório";
        }

        if (!formData.saleDate) {
            newErrors.saleDate = "Data da venda é obrigatória";
        }

        if (formData.items.length === 0) {
            newErrors.items = "Adicione pelo menos um item";
        }

        formData.items.forEach((item, index) => {
            if (!item.description) {
                newErrors[`item-${index}-description`] = "Descrição é obrigatória";
            }
            if (item.quantity <= 0) {
                newErrors[`item-${index}-quantity`] = "Quantidade deve ser maior que 0";
            }
            if (item.unitPrice <= 0) {
                newErrors[`item-${index}-unitPrice`] = "Preço deve ser maior que 0";
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            error("Validação", "Por favor, corrija os erros no formulário");
            return;
        }

        try {
            if (editingSale) {
                await api.put(`/finance/sales/${editingSale.id}`, formData);
                success("Venda atualizada", "Venda atualizada com sucesso");
            } else {
                await api.post("/finance/sales", formData);
                success("Venda criada", "Venda criada com sucesso");
            }
            loadSales();
            resetForm();
        } catch (err) {
            error("Erro ao salvar", "Não foi possível salvar a venda");
        }
    };

    const handleEdit = (sale: Sale) => {
        setEditingSale(sale);
        setFormData(sale);
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Tem certeza que deseja deletar esta venda?")) return;
        try {
            await api.delete(`/finance/sales/${id}`);
            success("Venda deletada", "Venda deletada com sucesso");
            loadSales();
        } catch (err) {
            error("Erro ao deletar", "Não foi possível deletar a venda");
        }
    };

    const handleStatusChange = async (id: number, status: string) => {
        try {
            await api.patch(`/finance/sales/${id}/status?status=${status}`);
            success("Status atualizado", "Status da venda atualizado");
            loadSales();
        } catch (err) {
            error("Erro ao atualizar", "Não foi possível atualizar o status");
        }
    };

    const downloadPdf = async (id: number) => {
        try {
            const response = await api.get(`/finance/sales/${id}/pdf`, {
                responseType: "blob",
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `venda-${id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            success("PDF baixado", "PDF da venda baixado com sucesso");
        } catch (err) {
            error("Erro ao baixar PDF", "Não foi possível baixar o PDF");
        }
    };

    const resetForm = () => {
        setFormData({
            customerName: "",
            customerId: "",
            saleDate: new Date().toISOString().split("T")[0],
            status: "PENDING",
            items: [{ description: "", quantity: 1, unit: "un", unitPrice: 0, total: 0 }],
            total: 0,
            notes: "",
        });
        setEditingSale(null);
        setShowForm(false);
        setErrors({});
    };

    const handleCustomerChange = (customerId: string) => {
        const customer = customers.find((c) => c.id.toString() === customerId);
        setFormData({
            ...formData,
            customerId,
            customerName: customer?.name || "",
        });
    };

    return (
        <AppShell title="Vendas" subtitle="Gerencie as vendas do sistema">
            <ToastContainer toasts={toasts} onClose={removeToast} />
            <div className="app-actions">
                <button onClick={() => setShowForm(!showForm)}>
                    {showForm ? "Cancelar" : "Nova Venda"}
                </button>
            </div>

            <div className="modern-section">
                <div className="section-header">
                    <h3>Filtros</h3>
                </div>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <input
                        type="text"
                        placeholder="Buscar por cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ flex: 1, minWidth: "200px" }}
                    />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="">Todos os status</option>
                        <option value="PENDING">Pendente</option>
                        <option value="PAID">Pago</option>
                        <option value="CANCELLED">Cancelado</option>
                    </select>
                </div>
            </div>

            {showForm && (
                <div className="modern-section">
                    <div className="section-header">
                        <h3>{editingSale ? "Editar Venda" : "Nova Venda"}</h3>
                    </div>
                    <form onSubmit={handleSubmit} className="form">
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="required">Cliente</label>
                                <select
                                    value={formData.customerId}
                                    onChange={(e) => handleCustomerChange(e.target.value)}
                                    className={errors.customerId ? "error" : ""}
                                    required
                                >
                                    <option value="">Selecione um cliente</option>
                                    {customers.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.customerId && (
                                    <div className="field-error">{errors.customerId}</div>
                                )}
                            </div>
                            <div className="form-group">
                                <label className="required">Data da Venda</label>
                                <input
                                    type="date"
                                    value={formData.saleDate}
                                    onChange={(e) =>
                                        setFormData({ ...formData, saleDate: e.target.value })
                                    }
                                    className={errors.saleDate ? "error" : ""}
                                    required
                                />
                                {errors.saleDate && (
                                    <div className="field-error">{errors.saleDate}</div>
                                )}
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            status: e.target.value as any,
                                        })
                                    }
                                >
                                    <option value="PENDING">Pendente</option>
                                    <option value="PAID">Pago</option>
                                    <option value="CANCELLED">Cancelado</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ marginTop: "20px" }}>
                            <label className="required">Itens da Venda</label>
                            {errors.items && <div className="field-error">{errors.items}</div>}
                            {formData.items.map((item, index) => (
                                <div key={index} className="item-row">
                                    <select
                                        value={item.productId || ""}
                                        onChange={(e) =>
                                            handleItemChange(index, "productId", e.target.value)
                                        }
                                        className={
                                            errors[`item-${index}-description`] ? "error" : ""
                                        }
                                    >
                                        <option value="">Selecione um produto</option>
                                        {catalog.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="Unidade"
                                        value={item.unit}
                                        onChange={(e) =>
                                            handleItemChange(index, "unit", e.target.value)
                                        }
                                    />
                                    <input
                                        type="number"
                                        placeholder="Qtd"
                                        value={item.quantity}
                                        onChange={(e) =>
                                            handleItemChange(
                                                index,
                                                "quantity",
                                                parseFloat(e.target.value) || 0
                                            )
                                        }
                                        className={errors[`item-${index}-quantity`] ? "error" : ""}
                                        step="0.01"
                                        required
                                    />
                                    <input
                                        type="number"
                                        placeholder="Valor Unit."
                                        value={item.unitPrice}
                                        onChange={(e) =>
                                            handleItemChange(
                                                index,
                                                "unitPrice",
                                                parseFloat(e.target.value) || 0
                                            )
                                        }
                                        className={
                                            errors[`item-${index}-unitPrice`] ? "error" : ""
                                        }
                                        step="0.01"
                                        required
                                    />
                                    <input
                                        type="text"
                                        value={`R$ ${item.total.toFixed(2)}`}
                                        readOnly
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeItem(index)}
                                        className="btn-danger btn-small"
                                    >
                                        Remover
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={addItem} className="btn-secondary">
                                Adicionar Item
                            </button>
                        </div>

                        <div>
                            <label>Observações</label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) =>
                                    setFormData({ ...formData, notes: e.target.value })
                                }
                                rows={3}
                            />
                        </div>

                        <div className="total-section">
                            <div className="total-value">Total: R$ {formData.total.toFixed(2)}</div>
                        </div>

                        <div style={{ display: "flex", gap: "12px" }}>
                            <button type="submit">
                                {editingSale ? "Atualizar" : "Criar"} Venda
                            </button>
                            <button type="button" onClick={resetForm} className="btn-secondary">
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="modern-section">
                <div className="section-header">
                    <h3>Lista de Vendas</h3>
                </div>
                <table className="modern-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Cliente</th>
                            <th>Data</th>
                            <th>Status</th>
                            <th>Total</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sales.map((sale) => (
                            <tr key={sale.id}>
                                <td>#{sale.id}</td>
                                <td>{sale.customerName}</td>
                                <td>{new Date(sale.saleDate).toLocaleDateString("pt-BR")}</td>
                                <td>
                                    <select
                                        value={sale.status}
                                        onChange={(e) =>
                                            handleStatusChange(sale.id!, e.target.value)
                                        }
                                        className={`badge badge-${sale.status.toLowerCase()}`}
                                        style={{
                                            border: "none",
                                            cursor: "pointer",
                                        }}
                                    >
                                        <option value="PENDING">Pendente</option>
                                        <option value="PAID">Pago</option>
                                        <option value="CANCELLED">Cancelado</option>
                                    </select>
                                </td>
                                <td>R$ {sale.total.toFixed(2)}</td>
                                <td>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <button
                                            onClick={() => handleEdit(sale)}
                                            className="btn-secondary btn-small"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => downloadPdf(sale.id!)}
                                            className="btn-secondary btn-small"
                                        >
                                            PDF
                                        </button>
                                        <button
                                            onClick={() => handleDelete(sale.id!)}
                                            className="btn-danger btn-small"
                                        >
                                            Deletar
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {sales.length === 0 && (
                            <tr>
                                <td colSpan={6} className="text-center">
                                    Nenhuma venda encontrada
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AppShell>
    );
}
