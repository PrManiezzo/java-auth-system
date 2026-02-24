import AppShell from "../../components/layout/AppShell";
import CatalogSection from "../../components/finance/CatalogSection";
import { FinanceProvider, useFinance } from "../../components/finance/FinanceContext";

export default function FinanceCatalogPage() {
    return (
        <FinanceProvider>
            <FinanceCatalogContent />
        </FinanceProvider>
    );
}

function FinanceCatalogContent() {
    const {
        catalog,
        catalogForm,
        setCatalogForm,
        stockAdjust,
        setStockAdjust,
        lowStock,
        handleCreateCatalog,
        handleAdjustStock,
        handleCatalogImage,
        formatCurrency,
        message,
        messageType
    } = useFinance();

    return (
        <AppShell title="Catálogo" subtitle="Gerencie produtos e serviços">
            {message && (
                <div className={`alert ${messageType === "error" ? "alert-error" : messageType === "success" ? "alert-success" : ""}`}>
                    {message}
                </div>
            )}
            <CatalogSection
                catalog={catalog}
                form={catalogForm}
                setForm={setCatalogForm}
                onSubmit={handleCreateCatalog}
                stockAdjust={stockAdjust}
                setStockAdjust={setStockAdjust}
                onAdjust={handleAdjustStock}
                lowStock={lowStock}
                onImageChange={handleCatalogImage}
                formatCurrency={formatCurrency}
            />
        </AppShell>
    );
}
