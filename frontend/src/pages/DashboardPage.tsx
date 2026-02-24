import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import api from "../services/api";
import { clearSession, isTokenExpired } from "../services/authStorage";
import type { Summary } from "../components/finance/FinanceContext";

interface SalesStats {
    total: number;
    pending: number;
    paid: number;
    cancelled: number;
    totalRevenue: number;
    monthRevenue: number;
    averageTicket: number;
}

interface SalesChart {
    labels: string[];
    values: number[];
}

interface TopProduct {
    name: string;
    quantity: number;
    revenue: number;
}

interface RecentSale {
    id: number;
    customerName: string;
    total: number;
    status: string;
    saleDate: string;
}

export default function DashboardPage() {
    const navigate = useNavigate();
    const [summary, setSummary] = useState<Summary | null>(null);
    const [salesStats, setSalesStats] = useState<SalesStats | null>(null);
    const [salesChart, setSalesChart] = useState<SalesChart | null>(null);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [recentSales, setRecentSales] = useState<RecentSale[]>([]);

    useEffect(() => {
        if (isTokenExpired()) {
            clearSession();
            navigate("/login");
            return;
        }

        const interval = setInterval(() => {
            if (isTokenExpired()) {
                clearSession();
                navigate("/login");
            }
        }, 1000);

        // Load summary
        api.get<Summary>("/finance/summary")
            .then((response) => setSummary(response.data))
            .catch(() => setSummary(null));

        // Load sales stats
        api.get<SalesStats>("/dashboard/sales-stats")
            .then((response) => setSalesStats(response.data))
            .catch(() => setSalesStats(null));

        // Load sales chart
        api.get<SalesChart>("/dashboard/sales-chart")
            .then((response) => setSalesChart(response.data))
            .catch(() => setSalesChart(null));

        // Load top products
        api.get<TopProduct[]>("/dashboard/top-products")
            .then((response) => setTopProducts(response.data))
            .catch(() => setTopProducts([]));

        // Load recent sales
        api.get<RecentSale[]>("/dashboard/recent-sales")
            .then((response) => setRecentSales(response.data))
            .catch(() => setRecentSales([]));

        return () => clearInterval(interval);
    }, [navigate]);

    const income = Number(summary?.monthlyIncome || 0);
    const expense = Number(summary?.monthlyExpense || 0);
    const total = income + expense || 1;
    const incomePercent = useMemo(() => (income / total) * 100, [income, total]);
    const expensePercent = useMemo(() => (expense / total) * 100, [expense, total]);

    return (
        <AppShell title="Dashboard" subtitle="Visão geral do negócio e indicadores principais">
            <section className="dashboard-hero">
                <div className="dashboard-card dashboard-highlight">
                    <h2>Resumo do mes</h2>
                    <div className="dashboard-grid">
                        <div className="dashboard-stat">
                            <span>Receita</span>
                            <strong>{formatCurrency(summary?.monthlyIncome ?? 0)}</strong>
                        </div>
                        <div className="dashboard-stat">
                            <span>Despesa</span>
                            <strong>{formatCurrency(summary?.monthlyExpense ?? 0)}</strong>
                        </div>
                        <div className="dashboard-stat">
                            <span>Saldo</span>
                            <strong>{formatCurrency(summary?.monthlyBalance ?? 0)}</strong>
                        </div>
                        <div className="dashboard-stat">
                            <span>Pendencias</span>
                            <strong>{formatCurrency(summary?.totalPending ?? 0)}</strong>
                        </div>
                    </div>
                    {summary?.lowStock ? (
                        <div className="alert alert-error">{summary.lowStock} itens com baixo estoque</div>
                    ) : null}
                </div>
            </section>

            <section className="dashboard-columns">
                <div className="dashboard-card">
                    <h2>Fluxo financeiro</h2>
                    <div className="dashboard-chart">
                        <div className="chart-bar">
                            <div className="chart-label">Receitas</div>
                            <div className="chart-track">
                                <div className="chart-fill chart-income" style={{ width: `${incomePercent}%` }} />
                            </div>
                            <div className="chart-value">{Math.round(incomePercent)}%</div>
                        </div>
                        <div className="chart-bar">
                            <div className="chart-label">Despesas</div>
                            <div className="chart-track">
                                <div className="chart-fill chart-expense" style={{ width: `${expensePercent}%` }} />
                            </div>
                            <div className="chart-value">{Math.round(expensePercent)}%</div>
                        </div>
                    </div>
                </div>
                <div className="dashboard-card">
                    <h2>Atalhos rapidos</h2>
                    <div className="quick-actions">
                        <button className="btn-secondary" type="button" onClick={() => navigate("/finance/catalog")}>Novo item</button>
                        <button className="btn-secondary" type="button" onClick={() => navigate("/finance/entries")}>Novo Lançamento</button>
                        <button className="btn-secondary" type="button" onClick={() => navigate("/finance/quotes")}>Novo Orçamento</button>
                        <button className="btn-secondary" type="button" onClick={() => navigate("/profile")}>Editar perfil</button>
                    </div>
                </div>
            </section>

            {/* Sales Statistics */}
            {salesStats && (
                <section style={{ marginTop: "2rem" }}>
                    <h2 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "1rem" }}>
                        📊 Estatísticas de Vendas
                    </h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                        <div className="card" style={{ padding: "1.5rem", textAlign: "center" }}>
                            <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                                Total de Vendas
                            </div>
                            <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--accent)" }}>
                                {salesStats.total}
                            </div>
                        </div>
                        <div className="card" style={{ padding: "1.5rem", textAlign: "center" }}>
                            <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                                Vendas Pagas
                            </div>
                            <div style={{ fontSize: "2rem", fontWeight: 700, color: "#10b981" }}>
                                {salesStats.paid}
                            </div>
                        </div>
                        <div className="card" style={{ padding: "1.5rem", textAlign: "center" }}>
                            <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                                Vendas Pendentes
                            </div>
                            <div style={{ fontSize: "2rem", fontWeight: 700, color: "#f59e0b" }}>
                                {salesStats.pending}
                            </div>
                        </div>
                        <div className="card" style={{ padding: "1.5rem", textAlign: "center" }}>
                            <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                                Faturamento Total
                            </div>
                            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--accent)" }}>
                                {formatCurrency(salesStats.totalRevenue)}
                            </div>
                        </div>
                        <div className="card" style={{ padding: "1.5rem", textAlign: "center" }}>
                            <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                                Faturamento do Mês
                            </div>
                            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#10b981" }}>
                                {formatCurrency(salesStats.monthRevenue)}
                            </div>
                        </div>
                        <div className="card" style={{ padding: "1.5rem", textAlign: "center" }}>
                            <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                                Ticket Médio
                            </div>
                            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>
                                {formatCurrency(salesStats.averageTicket)}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Sales Chart */}
            {salesChart && salesChart.labels.length > 0 && (
                <section style={{ marginTop: "2rem" }}>
                    <div className="card" style={{ padding: "1.5rem" }}>
                        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1.5rem" }}>
                            📈 Vendas dos Últimos 30 Dias
                        </h2>
                        <div style={{ height: "300px", position: "relative" }}>
                            <LineChart labels={salesChart.labels} values={salesChart.values} />
                        </div>
                    </div>
                </section>
            )}

            {/* Grid: Top Products + Recent Sales */}
            <section style={{ marginTop: "2rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1rem" }}>
                {/* Top Products */}
                <div className="card" style={{ padding: "1.5rem" }}>
                    <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>
                        🏆 Top 5 Produtos Mais Vendidos
                    </h2>
                    {topProducts.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            {topProducts.map((product, index) => (
                                <div key={index} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                    <div style={{
                                        minWidth: "32px",
                                        height: "32px",
                                        borderRadius: "50%",
                                        background: index === 0 ? "#fbbf24" : index === 1 ? "#94a3b8" : index === 2 ? "#f97316" : "var(--accent)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontWeight: 700,
                                        fontSize: "0.875rem",
                                        color: "white"
                                    }}>
                                        {index + 1}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600 }}>{product.name}</div>
                                        <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                                            Qtd: {product.quantity} • {formatCurrency(product.revenue)}
                                        </div>
                                    </div>
                                    <div style={{
                                        width: "80px",
                                        height: "8px",
                                        background: "var(--bg)",
                                        borderRadius: "4px",
                                        overflow: "hidden"
                                    }}>
                                        <div style={{
                                            width: `${Math.min(100, (product.revenue / (topProducts[0]?.revenue || 1)) * 100)}%`,
                                            height: "100%",
                                            background: "var(--accent)",
                                            borderRadius: "4px"
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "2rem 0" }}>
                            Nenhum produto vendido ainda
                        </p>
                    )}
                </div>

                {/* Recent Sales */}
                <div className="card" style={{ padding: "1.5rem" }}>
                    <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>
                        🕒 Últimas Vendas
                    </h2>
                    {recentSales.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {recentSales.map((sale) => (
                                <div
                                    key={sale.id}
                                    className="card"
                                    style={{
                                        padding: "1rem",
                                        background: "var(--bg)",
                                        cursor: "pointer",
                                        transition: "all 0.2s"
                                    }}
                                    onClick={() => navigate(`/sales`)}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = "translateX(4px)"}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = "translateX(0)"}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.5rem" }}>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{sale.customerName}</div>
                                            <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                                                #{sale.id} • {new Date(sale.saleDate).toLocaleDateString("pt-BR")}
                                            </div>
                                        </div>
                                        <span className="badge" style={{
                                            background: sale.status === "PAID" ? "#10b98114" : sale.status === "PENDING" ? "#f59e0b14" : "#ef444414",
                                            color: sale.status === "PAID" ? "#10b981" : sale.status === "PENDING" ? "#f59e0b" : "#ef4444"
                                        }}>
                                            {sale.status === "PAID" ? "Pago" : sale.status === "PENDING" ? "Pendente" : "Cancelado"}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--accent)" }}>
                                        {formatCurrency(sale.total)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "2rem 0" }}>
                            Nenhuma venda realizada ainda
                        </p>
                    )}
                </div>
            </section>
        </AppShell>
    );
}

// Simple Line Chart Component
function LineChart({ labels, values }: { labels: string[]; values: number[] }) {
    const maxValue = Math.max(...values, 1);
    const points = values.map((value, index) => {
        const x = (index / (labels.length - 1)) * 100;
        const y = 100 - (value / maxValue) * 80; // 80% of height for data, 20% padding
        return `${x},${y}`;
    }).join(" ");

    return (
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
            {/* Y-axis labels */}
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "50px", display: "flex", flexDirection: "column", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                <div>{formatCurrency(maxValue)}</div>
                <div>{formatCurrency(maxValue * 0.5)}</div>
                <div>R$ 0</div>
            </div>

            {/* Chart area */}
            <div style={{ marginLeft: "60px", height: "100%", position: "relative" }}>
                <svg width="100%" height="100%" style={{ overflow: "visible" }}>
                    {/* Grid lines */}
                    <line x1="0" y1="20%" x2="100%" y2="20%" stroke="var(--border)" strokeWidth="1" strokeDasharray="4" />
                    <line x1="0" y1="50%" x2="100%" y2="50%" stroke="var(--border)" strokeWidth="1" strokeDasharray="4" />
                    <line x1="0" y1="80%" x2="100%" y2="80%" stroke="var(--border)" strokeWidth="1" strokeDasharray="4" />

                    {/* Area under line */}
                    <polygon
                        points={`0,100 ${points} 100,100`}
                        fill="url(#gradient)"
                        opacity="0.3"
                    />

                    {/* Line */}
                    <polyline
                        points={points}
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Points */}
                    {values.map((value, index) => {
                        const x = (index / (labels.length - 1)) * 100;
                        const y = 100 - (value / maxValue) * 80;
                        return (
                            <circle
                                key={index}
                                cx={`${x}%`}
                                cy={`${y}%`}
                                r="4"
                                fill="var(--accent)"
                                stroke="white"
                                strokeWidth="2"
                            />
                        );
                    })}

                    {/* Gradient definition */}
                    <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.5" />
                            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                </svg>

                {/* X-axis labels (show every 5th day) */}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                    {labels.map((label, index) => {
                        if (index % 5 === 0 || index === labels.length - 1) {
                            return <div key={index}>{new Date(label).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</div>;
                        }
                        return null;
                    })}
                </div>
            </div>
        </div>
    );
}

function formatCurrency(value: number) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
