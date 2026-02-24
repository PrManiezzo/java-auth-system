import { useState, useEffect } from "react";
import AppShell from "../components/layout/AppShell";
import { ManualQRInput } from "../components/QRCodeScanner";
import { ToastContainer } from "../components/Toast";
import { useToast } from "../hooks/useToast";
import api from "../services/api";

interface CartItem {
    id: string;
    productId?: number;
    name: string;
    qrCode?: string;
    unit: string;
    unitPrice: number;
    quantity: number;
    total: number;
    isManual?: boolean;
}

interface Product {
    id: number;
    name: string;
    qrCode: string;
    unit: string;
    unitPrice: number;
    stockQuantity: number;
}

export default function PDVPage() {
    const { toasts, removeToast, success, error, warning } = useToast();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [searchProduct, setSearchProduct] = useState("");
    const [showManualForm, setShowManualForm] = useState(false);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [manualItem, setManualItem] = useState({
        name: "",
        unit: "un",
        unitPrice: "",
        quantity: "1"
    });

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const response = await api.get<Product[]>("/finance/catalog");
            setProducts(response.data);
        } catch (err) {
            error("Erro ao carregar", "Não foi possível carregar os produtos");
        }
    };

    const calculateTotal = () => {
        return cart.reduce((sum, item) => sum + item.total, 0);
    };

    const handleQRCodeScan = async (qrCode: string) => {
        setLoading(true);
        try {
            const response = await api.get<Product>(`/finance/catalog/qrcode/${encodeURIComponent(qrCode)}`);
            const product = response.data;

            if (product.stockQuantity <= 0) {
                warning("Estoque insuficiente", `Produto "${product.name}" sem estoque`);
                return;
            }

            addToCart(product);
            success("Produto adicionado", `${product.name} adicionado ao carrinho`);
        } catch (err: any) {
            if (err.response?.status === 404) {
                error("Produto não encontrado", "QR Code não cadastrado no sistema");
            } else {
                error("Erro ao buscar", "Não foi possível buscar o produto");
            }
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (product: Product) => {
        const existingItem = cart.find((item) => item.productId === product.id);

        if (existingItem) {
            // Increment quantity
            const updatedCart = cart.map((item) =>
                item.productId === product.id
                    ? {
                        ...item,
                        quantity: item.quantity + 1,
                        total: (item.quantity + 1) * item.unitPrice,
                    }
                    : item
            );
            setCart(updatedCart);
        } else {
            // Add new item
            const newItem: CartItem = {
                id: `${product.id}-${Date.now()}`,
                productId: product.id,
                name: product.name,
                qrCode: product.qrCode,
                unit: product.unit,
                unitPrice: product.unitPrice,
                quantity: 1,
                total: product.unitPrice,
            };
            setCart([...cart, newItem]);
        }
    };

    const updateQuantity = (itemId: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            removeFromCart(itemId);
            return;
        }

        const updatedCart = cart.map((item) =>
            item.id === itemId
                ? {
                    ...item,
                    quantity: newQuantity,
                    total: newQuantity * item.unitPrice,
                }
                : item
        );
        setCart(updatedCart);
    };

    const removeFromCart = (itemId: string) => {
        setCart(cart.filter((item) => item.id !== itemId));
    };

    const addManualItem = () => {
        if (!manualItem.name.trim() || !manualItem.unitPrice) {
            warning("Campos obrigatórios", "Preencha nome e preço");
            return;
        }

        const quantity = parseFloat(manualItem.quantity) || 1;
        const unitPrice = parseFloat(manualItem.unitPrice) || 0;

        const newItem: CartItem = {
            id: `manual-${Date.now()}`,
            name: manualItem.name.trim(),
            unit: manualItem.unit || "un",
            unitPrice: unitPrice,
            quantity: quantity,
            total: quantity * unitPrice,
            isManual: true
        };

        setCart([...cart, newItem]);
        setManualItem({ name: "", unit: "un", unitPrice: "", quantity: "1" });
        setShowManualForm(false);
        success("Item adicionado", newItem.name);
    };

    const updateCartItem = (itemId: string, field: keyof CartItem, value: any) => {
        const updatedCart = cart.map((item) => {
            if (item.id !== itemId) return item;

            const updated = { ...item, [field]: value };

            if (field === "quantity" || field === "unitPrice") {
                updated.total = updated.quantity * updated.unitPrice;
            }

            return updated;
        });
        setCart(updatedCart);
    };

    const clearCart = () => {
        setCart([]);
    };

    const finalizeSale = async () => {
        if (cart.length === 0) {
            warning("Carrinho vazio", "Adicione produtos antes de finalizar");
            return;
        }

        setLoading(true);
        try {
            const saleData = {
                customerName: "Venda PDV",
                saleDate: new Date().toISOString().split("T")[0],
                status: "PAID",
                items: cart.map((item) => ({
                    description: item.name,
                    quantity: item.quantity,
                    unit: item.unit,
                    unitPrice: item.unitPrice,
                    total: item.total,
                    productId: item.productId?.toString() || undefined,
                })),
                total: calculateTotal(),
                notes: "Venda realizada via PDV",
            };

            await api.post("/finance/sales", saleData);
            success("Venda finalizada", `Total: R$ ${calculateTotal().toFixed(2)}`);
            clearCart();
        } catch (err) {
            error("Erro ao finalizar", "Não foi possível finalizar a venda");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppShell title="PDV" subtitle="Ponto de Venda com QR Code">
            <ToastContainer toasts={toasts} onClose={removeToast} />

            <div className="app-actions">
                <button
                    type="button"
                    onClick={() => setShowManualForm(!showManualForm)}
                    className="btn-success"
                >
                    {showManualForm ? "✕ Fechar" : "➕ Item Manual"}
                </button>
            </div>

            {showManualForm && (
                <div className="modern-section">
                    <div className="section-header">
                        <h3>✏️ Adicionar Item Manual</h3>
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="required">Nome do Item</label>
                            <input
                                type="text"
                                value={manualItem.name}
                                onChange={(e) => setManualItem({ ...manualItem, name: e.target.value })}
                                placeholder="Ex: Serviço de instalação"
                                autoFocus
                            />
                        </div>
                        <div className="form-group">
                            <label>Unidade</label>
                            <input
                                type="text"
                                value={manualItem.unit}
                                onChange={(e) => setManualItem({ ...manualItem, unit: e.target.value })}
                                placeholder="un, h, kg"
                            />
                        </div>
                        <div className="form-group">
                            <label className="required">Preço Unitário</label>
                            <input
                                type="number"
                                step="0.01"
                                value={manualItem.unitPrice}
                                onChange={(e) => setManualItem({ ...manualItem, unitPrice: e.target.value })}
                                placeholder="0.00"
                            />
                        </div>
                        <div className="form-group">
                            <label>Quantidade</label>
                            <input
                                type="number"
                                step="0.01"
                                value={manualItem.quantity}
                                onChange={(e) => setManualItem({ ...manualItem, quantity: e.target.value })}
                            />
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                        <button type="button" onClick={addManualItem}>
                            Adicionar ao Carrinho
                        </button>
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => {
                                setShowManualForm(false);
                                setManualItem({ name: "", unit: "un", unitPrice: "", quantity: "1" });
                            }}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "20px" }}>
                {/* Área do Carrinho */}
                <div>
                    <div className="modern-section">
                        <div className="section-header">
                            <h3>🛒 Carrinho</h3>
                            <span>{cart.length} itens</span>
                        </div>

                        {cart.length === 0 ? (
                            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
                                <p style={{ fontSize: "48px", marginBottom: "12px" }}>🛍️</p>
                                <p>Escaneie ou digite um código QR para adicionar produtos</p>
                            </div>
                        ) : (
                            <>
                                <table className="modern-table">
                                    <thead>
                                        <tr>
                                            <th>Produto</th>
                                            <th style={{ width: "120px" }}>Qtd</th>
                                            <th style={{ width: "120px" }}>Preço Unit.</th>
                                            <th style={{ width: "120px" }}>Total</th>
                                            <th style={{ width: "80px" }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cart.map((item) => (
                                            <tr key={item.id}>
                                                <td>
                                                    {editingItemId === item.id ? (
                                                        <input
                                                            type="text"
                                                            value={item.name}
                                                            onChange={(e) => updateCartItem(item.id, "name", e.target.value)}
                                                            onBlur={() => setEditingItemId(null)}
                                                            autoFocus
                                                            style={{ width: "100%", padding: "4px" }}
                                                        />
                                                    ) : (
                                                        <div>
                                                            <strong
                                                                style={{ cursor: item.isManual ? "pointer" : "default" }}
                                                                onClick={() => item.isManual && setEditingItemId(item.id)}
                                                                title={item.isManual ? "Clique para editar" : ""}
                                                            >
                                                                {item.name}
                                                                {item.isManual && " ✏️"}
                                                            </strong>
                                                            <br />
                                                            <small style={{ color: "var(--text-secondary)" }}>
                                                                {item.qrCode || (item.isManual ? "Item manual" : "")}
                                                            </small>
                                                        </div>
                                                    )}
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                                                        <button
                                                            type="button"
                                                            className="btn-small btn-secondary"
                                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        >
                                                            −
                                                        </button>
                                                        <input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) => updateCartItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                                                            style={{ width: "60px", textAlign: "center", padding: "4px" }}
                                                            step="0.01"
                                                            min="0.01"
                                                        />
                                                        <button
                                                            type="button"
                                                            className="btn-small btn-secondary"
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </td>
                                                <td>
                                                    {item.isManual ? (
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={item.unitPrice}
                                                            onChange={(e) => updateCartItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                                                            style={{ width: "80px", padding: "4px" }}
                                                            placeholder="0.00"
                                                        />
                                                    ) : (
                                                        `R$ ${item.unitPrice.toFixed(2)}`
                                                    )}
                                                </td>
                                                <td>
                                                    <strong>R$ {item.total.toFixed(2)}</strong>
                                                </td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="btn-small btn-danger"
                                                        onClick={() => removeFromCart(item.id)}
                                                    >
                                                        ✕
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div
                                    style={{
                                        marginTop: "20px",
                                        padding: "20px",
                                        background: "var(--bg-primary)",
                                        borderRadius: "12px",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <div>
                                        <div style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                                            Total da Venda
                                        </div>
                                        <div style={{ fontSize: "32px", fontWeight: "700", color: "var(--accent)" }}>
                                            R$ {calculateTotal().toFixed(2)}
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: "12px" }}>
                                        <button type="button" className="btn-secondary" onClick={clearCart} disabled={loading}>
                                            Limpar
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-success"
                                            onClick={finalizeSale}
                                            disabled={loading}
                                            style={{ fontSize: "16px", padding: "12px 24px" }}
                                        >
                                            {loading ? "Processando..." : "Finalizar Venda"}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Lista de Produtos */}
                    <div className="modern-section" style={{ marginTop: "20px" }}>
                        <div className="section-header">
                            <h3>📦 Produtos Disponíveis</h3>
                            <span>{products.filter(p => p.name.toLowerCase().includes(searchProduct.toLowerCase())).length} produtos</span>
                        </div>

                        <div style={{ marginBottom: "12px" }}>
                            <input
                                type="text"
                                placeholder="Buscar produto..."
                                value={searchProduct}
                                onChange={(e) => setSearchProduct(e.target.value)}
                            />
                        </div>

                        <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                            <table className="modern-table">
                                <thead>
                                    <tr>
                                        <th>Produto</th>
                                        <th style={{ width: "100px" }}>Estoque</th>
                                        <th style={{ width: "100px" }}>Preço</th>
                                        <th style={{ width: "80px" }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products
                                        .filter(p => p.name.toLowerCase().includes(searchProduct.toLowerCase()))
                                        .map((product) => (
                                            <tr key={product.id}>
                                                <td>
                                                    <strong>{product.name}</strong>
                                                    {product.qrCode && (
                                                        <>
                                                            <br />
                                                            <small style={{ color: "var(--text-secondary)" }}>
                                                                QR: {product.qrCode}
                                                            </small>
                                                        </>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className={product.stockQuantity <= 0 ? "badge badge-danger" : ""}>
                                                        {product.stockQuantity} {product.unit}
                                                    </span>
                                                </td>
                                                <td>R$ {product.unitPrice.toFixed(2)}</td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="btn-small btn-success"
                                                        onClick={() => {
                                                            if (product.stockQuantity > 0) {
                                                                addToCart(product);
                                                                success("Adicionado", `${product.name}`);
                                                            } else {
                                                                warning("Sem estoque", product.name);
                                                            }
                                                        }}
                                                        disabled={product.stockQuantity <= 0}
                                                    >
                                                        +
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    {products.filter(p => p.name.toLowerCase().includes(searchProduct.toLowerCase())).length === 0 && (
                                        <tr>
                                            <td colSpan={4} style={{ textAlign: "center", padding: "20px" }}>
                                                Nenhum produto encontrado
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Área de Scanner/Input */}
                <div>
                    <div className="modern-section">
                        <div className="section-header">
                            <h3>📱 Scanner QR Code</h3>
                        </div>

                        <div style={{ marginBottom: "16px" }}>
                            <ManualQRInput onSubmit={handleQRCodeScan} placeholder="Digite ou cole o código QR" />
                        </div>

                        <div
                            style={{
                                padding: "20px",
                                background: "var(--bg-primary)",
                                borderRadius: "12px",
                                textAlign: "center",
                            }}
                        >
                            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "12px" }}>
                                💡 Dica: Digite o código QR do produto
                            </p>
                            <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                                Os produtos devem ter códigos QR cadastrados no catálogo
                            </p>
                        </div>

                        {loading && (
                            <div style={{ marginTop: "16px", textAlign: "center", color: "var(--accent)" }}>
                                <p>Buscando produto...</p>
                            </div>
                        )}
                    </div>

                    {/* Atalhos de Teclado */}
                    <div className="modern-section" style={{ marginTop: "16px" }}>
                        <div className="section-header">
                            <h3>⌨️ Atalhos</h3>
                        </div>
                        <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                            <p style={{ marginBottom: "8px" }}>
                                <kbd style={{ background: "var(--bg-primary)", padding: "2px 8px", borderRadius: "4px" }}>
                                    Enter
                                </kbd>{" "}
                                - Buscar produto
                            </p>
                            <p style={{ marginBottom: "8px" }}>
                                <kbd style={{ background: "var(--bg-primary)", padding: "2px 8px", borderRadius: "4px" }}>
                                    F9
                                </kbd>{" "}
                                - Finalizar venda
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
