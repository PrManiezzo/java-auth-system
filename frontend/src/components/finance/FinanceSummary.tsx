import type { Summary } from "./FinanceContext";

type FinanceSummaryProps = {
    summary: Summary | null;
    formatCurrency: (value: number | string) => string;
};

function formatPercent(value: number) {
    return `${Math.round(value)}%`;
}

export default function FinanceSummary({ summary, formatCurrency }: FinanceSummaryProps) {
    if (!summary) return null;

    const income = Number(summary.monthlyIncome || 0);
    const expense = Number(summary.monthlyExpense || 0);
    const total = income + expense || 1;
    const incomePercent = (income / total) * 100;
    const expensePercent = (expense / total) * 100;

    return (
        <div className="finance-summary">
            <div className="finance-grid">
                <div className="summary-card">
                    <span>Receita no mes</span>
                    <strong>{formatCurrency(summary.monthlyIncome)}</strong>
                </div>
                <div className="summary-card">
                    <span>Despesa no mes</span>
                    <strong>{formatCurrency(summary.monthlyExpense)}</strong>
                </div>
                <div className="summary-card">
                    <span>Saldo do mes</span>
                    <strong>{formatCurrency(summary.monthlyBalance)}</strong>
                </div>
                <div className="summary-card">
                    <span>Pendencias</span>
                    <strong>{formatCurrency(summary.totalPending)}</strong>
                </div>
                <div className="summary-card">
                    <span>Clientes</span>
                    <strong>{summary.customers}</strong>
                </div>
                <div className="summary-card">
                    <span>Baixo estoque</span>
                    <strong>{summary.lowStock}</strong>
                </div>
            </div>

            <div className="finance-chart">
                <div className="chart-bar">
                    <div className="chart-label">Receitas</div>
                    <div className="chart-track">
                        <div className="chart-fill chart-income" style={{ width: `${incomePercent}%` }} />
                    </div>
                    <div className="chart-value">{formatPercent(incomePercent)}</div>
                </div>
                <div className="chart-bar">
                    <div className="chart-label">Despesas</div>
                    <div className="chart-track">
                        <div className="chart-fill chart-expense" style={{ width: `${expensePercent}%` }} />
                    </div>
                    <div className="chart-value">{formatPercent(expensePercent)}</div>
                </div>
            </div>
        </div>
    );
}
