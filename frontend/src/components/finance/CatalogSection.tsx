import type { ChangeEvent, Dispatch, FormEvent, SetStateAction } from "react";
import type { CatalogForm, CatalogItem, StockAdjust } from "./FinanceContext";

type CatalogSectionProps = {
    catalog: CatalogItem[];
    form: CatalogForm;
    setForm: Dispatch<SetStateAction<CatalogForm>>;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    stockAdjust: StockAdjust;
    setStockAdjust: Dispatch<SetStateAction<StockAdjust>>;
    onAdjust: (event: FormEvent<HTMLFormElement>) => void;
    lowStock: CatalogItem[];
    onImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
    formatCurrency: (value: number | string) => string;
};

export default function CatalogSection({
    catalog,
    form,
    setForm,
    onSubmit,
    stockAdjust,
    setStockAdjust,
    onAdjust,
    lowStock,
    onImageChange,
    formatCurrency,
}: CatalogSectionProps) {
    return (
        <section className="finance-card" id="catalogo">
            <div className="section-header">
                <h2>Catálogo e Estoque</h2>
                <span>{catalog.length} itens</span>
            </div>
            <form className="form" onSubmit={onSubmit}>
                <input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                <input placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
                <input placeholder="Código QR" value={form.qrCode} onChange={(e) => setForm({ ...form, qrCode: e.target.value })} />
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="PRODUCT">Produto</option>
                    <option value="SERVICE">Servico</option>
                </select>
                <input placeholder="Unidade (un, kg, h)" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
                <input type="number" step="0.01" placeholder="Preco" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} required />
                <input type="number" step="0.01" placeholder="Custo" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
                <input type="number" step="0.01" placeholder="Estoque inicial" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} />
                <input type="number" step="0.01" placeholder="Estoque minimo" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} />
                <textarea className="input-textarea" placeholder="Descricao" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                <label className="upload-label">
                    Foto do produto
                    <input type="file" accept="image/*" onChange={onImageChange} />
                </label>
                {form.productImageBase64 && (
                    <div className="product-preview">
                        <img src={form.productImageBase64} alt="Preview" />
                    </div>
                )}
                <button>Salvar item</button>
            </form>

            <form className="form" onSubmit={onAdjust}>
                <select value={stockAdjust.itemId} onChange={(e) => setStockAdjust({ ...stockAdjust, itemId: e.target.value })} required>
                    <option value="">Selecione item</option>
                    {catalog.map((item) => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                </select>
                <select value={stockAdjust.type} onChange={(e) => setStockAdjust({ ...stockAdjust, type: e.target.value })}>
                    <option value="IN">Entrada</option>
                    <option value="OUT">Saida</option>
                    <option value="ADJUST">Ajuste</option>
                </select>
                <input type="number" step="0.01" placeholder="Quantidade" value={stockAdjust.quantity} onChange={(e) => setStockAdjust({ ...stockAdjust, quantity: e.target.value })} required />
                <input placeholder="Motivo" value={stockAdjust.reason} onChange={(e) => setStockAdjust({ ...stockAdjust, reason: e.target.value })} />
                <button>Atualizar estoque</button>
            </form>

            <div className="catalog-grid">
                {catalog.map((item) => (
                    <div key={item.id} className={`catalog-card ${Number(item.stockQuantity) <= Number(item.minStock) ? "low-stock" : ""}`}>
                        <div className="catalog-thumb">
                            {item.productImageBase64 ? (
                                <img src={item.productImageBase64} alt={item.name} />
                            ) : (
                                <div className="catalog-placeholder">Sem foto</div>
                            )}
                        </div>
                        <div className="catalog-body">
                            <strong>{item.name}</strong>
                            <span>{item.sku || "-"}</span>
                            <span>{item.stockQuantity} {item.unit || "un"}</span>
                            <span>{formatCurrency(item.unitPrice)}</span>
                        </div>
                    </div>
                ))}
            </div>

            {lowStock.length > 0 && (
                <div className="alert alert-error">Itens com baixo estoque: {lowStock.map((item) => item.name).join(", ")}</div>
            )}
        </section>
    );
}
