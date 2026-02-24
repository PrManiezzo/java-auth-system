import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import api from "../services/api";
import { isTokenExpired, clearSession } from "../services/authStorage";

type ServiceOrderStatus = "PENDING" | "IN_PROGRESS" | "PAUSED" | "COMPLETED" | "CANCELLED";

type ServiceOrderItem = {
    catalogId?: number;
    itemName: string;
    description: string;
    quantity: number;
    unitPrice: number;
    isService: boolean;
};

type ServiceOrder = {
    id: number;
    customerName: string;
    status: ServiceOrderStatus;
    startDate: string;
    estimatedEndDate?: string;
    description: string;
    total: number;
    laborCost: number;
    partsCost: number;
};

type Customer = {
    id: number;
    name: string;
    phone?: string;
    email?: string;
};

type CatalogItem = {
    id: number;
    name: string;
    unitPrice: number;
    type: string;
};

export default function ServiceOrdersPage() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<ServiceOrder[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [catalog, setCatalog] = useState<CatalogItem[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);

    const [form, setForm] = useState({
        customerId: "",
        customerName: "",
        customerPhone: "",
        customerAddress: "",
        status: "PENDING" as ServiceOrderStatus,
        startDate: new Date().toISOString().split("T")[0],
        estimatedEndDate: "",
        description: "",
        technicianNotes: "",
        assignedTechnician: "",
        items: [] as ServiceOrderItem[],
    });

    useEffect(() => {
        if (isTokenExpired()) {
            clearSession();
            navigate("/login");
            return;
        }

        loadData();
    }, [navigate]);

    const loadData = async () => {
        try {
            const [ordersRes, customersRes, catalogRes] = await Promise.all([
                api.get<ServiceOrder[]>("/finance/service-orders"),
                api.get<Customer[]>("/finance/customers"),
                api.get<CatalogItem[]>("/finance/catalog"),
            ]);

            setOrders(ordersRes.data);
            setCustomers(customersRes.data);
            setCatalog(catalogRes.data);
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCustomerSelect = (customerId: string) => {
        const customer = customers.find(c => c.id === parseInt(customerId));
        if (customer) {
            setForm({
                ...form,
                customerId,
                customerName: customer.name,
                customerPhone: customer.phone || "",
            });
        }
    };

    const addItem = () => {
        setForm({
            ...form,
            items: [
                ...form.items,
                { itemName: "", description: "", quantity: 1, unitPrice: 0, isService: false },
            ],
        });
    };

    const updateItem = (index: number, field: keyof ServiceOrderItem, value: any) => {
        const newItems = [...form.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setForm({ ...form, items: newItems });
    };

    const removeItem = (index: number) => {
        setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
    };

    const handleProductSelect = (index: number, catalogId: string) => {
        const product = catalog.find(c => c.id === parseInt(catalogId));
        if (product) {
            updateItem(index, "catalogId", product.id);
            updateItem(index, "itemName", product.name);
            updateItem(index, "unitPrice", product.unitPrice);
            updateItem(index, "isService", product.type === "SERVICE");
        }
    };

    const calculateTotal = () => {
        return form.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await api.post("/finance/service-orders", form);
            alert("Ordem de serviço criada com sucesso!");
            setShowForm(false);
            setForm({
                customerId: "",
                customerName: "",
                customerPhone: "",
                customerAddress: "",
                status: "PENDING",
                startDate: new Date().toISOString().split("T")[0],
                estimatedEndDate: "",
                description: "",
                technicianNotes: "",
                assignedTechnician: "",
                items: [],
            });
            loadData();
        } catch (error) {
            console.error("Erro ao criar ordem de serviço:", error);
            alert("Erro ao criar ordem de serviço");
        }
    };

    const updateStatus = async (id: number, newStatus: ServiceOrderStatus) => {
        try {
            await api.put(`/finance/service-orders/${id}/status`, { status: newStatus });
            loadData();
        } catch (error) {
            console.error("Erro ao atualizar status:", error);
        }
    };

    const getStatusLabel = (status: ServiceOrderStatus) => {
        const labels: Record<ServiceOrderStatus, string> = {
            PENDING: "Pendente",
            IN_PROGRESS: "Em Andamento",
            PAUSED: "Pausado",
            COMPLETED: "Concluído",
            CANCELLED: "Cancelado",
        };
        return labels[status];
    };

    const getStatusClass = (status: ServiceOrderStatus) => {
        const classes: Record<ServiceOrderStatus, string> = {
            PENDING: "badge-warning",
            IN_PROGRESS: "badge-info",
            PAUSED: "badge-secondary",
            COMPLETED: "badge-success",
            CANCELLED: "badge-danger",
        };
        return classes[status];
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value);
    };

    if (loading) {
        return (
            <AppShell title="Ordens de Serviço" subtitle="Gerencie ordens de serviço">
                <div className="app-main">
                    <p>Carregando...</p>
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell title="Ordens de Serviço" subtitle="Gerencie ordens de serviço">
            <div className="app-main">
                <section className="modern-section">
                    <div className="section-header-modern">
                        <div>
                            <h2>🔧 Ordens de Serviço</h2>
                            <p className="section-subtitle">{orders.length} ordens registradas</p>
                        </div>
                        <button
                            className="btn-primary-modern"
                            onClick={() => setShowForm(!showForm)}
                        >
                            {showForm ? "✕ Fechar" : "+ Nova Ordem"}
                        </button>
                    </div>

                    {showForm && (
                        <div className="modern-form-card">
                            <form className="modern-form" onSubmit={handleSubmit}>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Cliente *</label>
                                        <select
                                            value={form.customerId}
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
                                        <label>Telefone</label>
                                        <input
                                            type="text"
                                            value={form.customerPhone}
                                            onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                                            className="modern-input"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Data Início *</label>
                                        <input
                                            type="date"
                                            value={form.startDate}
                                            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                                            className="modern-input"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Previsão Término</label>
                                        <input
                                            type="date"
                                            value={form.estimatedEndDate}
                                            onChange={(e) => setForm({ ...form, estimatedEndDate: e.target.value })}
                                            className="modern-input"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Endereço do Serviço</label>
                                    <input
                                        type="text"
                                        value={form.customerAddress}
                                        onChange={(e) => setForm({ ...form, customerAddress: e.target.value })}
                                        className="modern-input"
                                        placeholder="Endereço onde será realizado o serviço"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Descrição do Serviço *</label>
                                    <textarea
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        className="modern-textarea"
                                        placeholder="Descreva o serviço a ser realizado..."
                                        rows={3}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Técnico Responsável</label>
                                    <input
                                        type="text"
                                        value={form.assignedTechnician}
                                        onChange={(e) => setForm({ ...form, assignedTechnician: e.target.value })}
                                        className="modern-input"
                                        placeholder="Nome do técnico"
                                    />
                                </div>

                                <div className="items-section">
                                    <div className="items-header">
                                        <h3>Itens e Serviços</h3>
                                        <button type="button" className="btn-secondary-modern" onClick={addItem}>
                                            + Adicionar Item
                                        </button>
                                    </div>

                                    {form.items.map((item, index) => (
                                        <div className="quote-item-modern" key={index}>
                                            <div className="item-row">
                                                <div className="form-group flex-2">
                                                    <label>Selecionar do Catálogo</label>
                                                    <select
                                                        onChange={(e) => handleProductSelect(index, e.target.value)}
                                                        className="modern-input"
                                                    >
                                                        <option value="">Selecione...</option>
                                                        {catalog.map(cat => (
                                                            <option key={cat.id} value={cat.id}>
                                                                {cat.name} - {formatCurrency(cat.unitPrice)}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="form-group flex-2">
                                                    <label>Nome do Item *</label>
                                                    <input
                                                        type="text"
                                                        value={item.itemName}
                                                        onChange={(e) => updateItem(index, "itemName", e.target.value)}
                                                        className="modern-input"
                                                        required
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label>Tipo</label>
                                                    <select
                                                        value={item.isService ? "service" : "product"}
                                                        onChange={(e) => updateItem(index, "isService", e.target.value === "service")}
                                                        className="modern-input"
                                                    >
                                                        <option value="product">Peça</option>
                                                        <option value="service">Serviço</option>
                                                    </select>
                                                </div>

                                                <div className="form-group">
                                                    <label>Qtd *</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value))}
                                                        className="modern-input"
                                                        required
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label>Preço Unit. *</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={item.unitPrice}
                                                        onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value))}
                                                        className="modern-input"
                                                        required
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label>Total</label>
                                                    <div className="item-total">
                                                        {formatCurrency(item.quantity * item.unitPrice)}
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

                                            <div className="form-group" style={{ marginTop: "8px" }}>
                                                <input
                                                    type="text"
                                                    value={item.description}
                                                    onChange={(e) => updateItem(index, "description", e.target.value)}
                                                    className="modern-input"
                                                    placeholder="Descrição adicional do item..."
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="form-group">
                                    <label>Observações do Técnico</label>
                                    <textarea
                                        value={form.technicianNotes}
                                        onChange={(e) => setForm({ ...form, technicianNotes: e.target.value })}
                                        className="modern-textarea"
                                        placeholder="Observações técnicas..."
                                        rows={2}
                                    />
                                </div>

                                <div className="form-total">
                                    <span>Total da Ordem:</span>
                                    <strong>{formatCurrency(calculateTotal())}</strong>
                                </div>

                                <button type="submit" className="btn-success-modern">
                                    💾 Criar Ordem de Serviço
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
                                    <th>Descrição</th>
                                    <th>Status</th>
                                    <th>Data Início</th>
                                    <th>Mão de Obra</th>
                                    <th>Peças</th>
                                    <th>Total</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="empty-state">
                                            Nenhuma ordem de serviço criada ainda
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map((order) => (
                                        <tr key={order.id}>
                                            <td>#{order.id}</td>
                                            <td><strong>{order.customerName}</strong></td>
                                            <td>{order.description.substring(0, 50)}...</td>
                                            <td>
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => updateStatus(order.id, e.target.value as ServiceOrderStatus)}
                                                    className={`badge ${getStatusClass(order.status)}`}
                                                    style={{ border: "none", cursor: "pointer" }}
                                                >
                                                    <option value="PENDING">Pendente</option>
                                                    <option value="IN_PROGRESS">Em Andamento</option>
                                                    <option value="PAUSED">Pausado</option>
                                                    <option value="COMPLETED">Concluído</option>
                                                    <option value="CANCELLED">Cancelado</option>
                                                </select>
                                            </td>
                                            <td>{new Date(order.startDate).toLocaleDateString()}</td>
                                            <td>{formatCurrency(order.laborCost)}</td>
                                            <td>{formatCurrency(order.partsCost)}</td>
                                            <td><strong>{formatCurrency(order.total)}</strong></td>
                                            <td>
                                                <button
                                                    className="btn-view"
                                                    title="Ver detalhes"
                                                >
                                                    👁️
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </AppShell>
    );
}
