import FinanceSummary from "../../components/finance/FinanceSummary";
import { useFinance } from "../../components/finance/FinanceContext";

export default function FinanceOverviewPage() {
    const { summary, lowStock, formatCurrency } = useFinance();

    return (
        <div className="finance-content">
            <FinanceSummary summary={summary} formatCurrency={formatCurrency} />
            {lowStock.length > 0 && (
                <div className="alert alert-error">Itens com baixo estoque: {lowStock.map((item) => item.name).join(", ")}</div>
            )}
        </div>
    );
}
