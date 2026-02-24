import AppShell from "../../components/layout/AppShell";
import StockMovementsSection from "../../components/finance/StockMovementsSection";
import { FinanceProvider, useFinance } from "../../components/finance/FinanceContext";
import { useNavigate } from "react-router-dom";

export default function FinanceStockPage() {
    return (
        <FinanceProvider>
            <FinanceStockContent />
        </FinanceProvider>
    );
}

function FinanceStockContent() {
    const { stockMovements, message, messageType } = useFinance();
    const navigate = useNavigate();

    return (
        <AppShell
            title="Estoque"
            subtitle="Movimentações de estoque"
            actions={
                <button
                    className="btn-primary"
                    onClick={() => navigate('/finance/nfe-import')}
                >
                    📦 Importar NFe
                </button>
            }
        >
            {message && (
                <div className={`alert ${messageType === "error" ? "alert-error" : messageType === "success" ? "alert-success" : ""}`}>
                    {message}
                </div>
            )}
            <StockMovementsSection movements={stockMovements} />
        </AppShell>
    );
}
