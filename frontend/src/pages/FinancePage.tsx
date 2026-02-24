import { NavLink, Outlet } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import { FinanceProvider, useFinance } from "../components/finance/FinanceContext";

export default function FinancePage() {
    return (
        <FinanceProvider>
            <FinanceLayoutContent />
        </FinanceProvider>
    );
}

function FinanceLayoutContent() {
    const { message, messageType } = useFinance();

    return (
        <AppShell title="Financeiro" subtitle="Controle completo: clientes, catálogo, estoque e lançamentos">
            <div className="finance-screen">
                <nav className="finance-nav">
                    <NavLink to="/finance" end className={({ isActive }) => (isActive ? "active" : "")}>Visão Geral</NavLink>
                    <NavLink to="/finance/customers" className={({ isActive }) => (isActive ? "active" : "")}>Clientes</NavLink>
                    <NavLink to="/finance/catalog" className={({ isActive }) => (isActive ? "active" : "")}>Catálogo</NavLink>
                    <NavLink to="/finance/entries" className={({ isActive }) => (isActive ? "active" : "")}>Lançamentos</NavLink>
                    <NavLink to="/finance/quotes" className={({ isActive }) => (isActive ? "active" : "")}>Orçamentos</NavLink>
                    <NavLink to="/finance/stock" className={({ isActive }) => (isActive ? "active" : "")}>Estoque</NavLink>
                </nav>

                {message && (
                    <div className={`alert ${messageType === "error" ? "alert-error" : messageType === "success" ? "alert-success" : ""}`}>
                        {message}
                    </div>
                )}

                <Outlet />
            </div>
        </AppShell>
    );
}
