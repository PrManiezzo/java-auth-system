import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { clearSession } from "../../services/authStorage";

type AppShellProps = {
    title: string;
    subtitle?: string;
    children: ReactNode;
    actions?: ReactNode;
};

export default function AppShell({ title, subtitle, children, actions }: AppShellProps) {
    const navigate = useNavigate();
    const [theme, setTheme] = useState<"dark" | "light">(() => {
        const saved = localStorage.getItem("theme");
        return saved === "light" ? "light" : "dark";
    });

    useEffect(() => {
        document.body.classList.toggle("theme-light", theme === "light");
        localStorage.setItem("theme", theme);
    }, [theme]);

    function handleLogout() {
        clearSession();
        navigate("/login");
    }

    return (
        <div className="app-shell">
            <aside className="app-sidebar">
                <div className="app-brand">
                    <span>Negócio</span>
                    <small>Sistema de Gestão</small>
                </div>

                <nav className="app-menu">
                    <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "active" : "")}>
                        Dashboard
                    </NavLink>

                    <div className="menu-section">LISTAS</div>
                    <NavLink to="/finance/customers" className={({ isActive }) => (isActive ? "active" : "")}>
                        Clientes
                    </NavLink>
                    <NavLink to="/finance/catalog" className={({ isActive }) => (isActive ? "active" : "")}>
                        Catálogo
                    </NavLink>
                    <NavLink to="/finance/stock" className={({ isActive }) => (isActive ? "active" : "")}>
                        Estoque
                    </NavLink>

                    <div className="menu-section">SERVIÇOS</div>
                    <NavLink to="/pdv" className={({ isActive }) => (isActive ? "active" : "")}>
                        PDV
                    </NavLink>
                    <NavLink to="/finance/entries" className={({ isActive }) => (isActive ? "active" : "")}>
                        Lançamentos
                    </NavLink>
                    <NavLink to="/finance/quotes" className={({ isActive }) => (isActive ? "active" : "")}>
                        Orçamentos
                    </NavLink>
                    <NavLink to="/service-orders" className={({ isActive }) => (isActive ? "active" : "")}>
                        Ordens de Serviço
                    </NavLink>
                    <NavLink to="/sales" className={({ isActive }) => (isActive ? "active" : "")}>
                        Vendas
                    </NavLink>

                    <div className="menu-section">CONTA</div>
                    <NavLink to="/profile" className={({ isActive }) => (isActive ? "active" : "")}>
                        Perfil
                    </NavLink>
                    <NavLink to="/settings" className={({ isActive }) => (isActive ? "active" : "")}>
                        Configurações
                    </NavLink>
                </nav>

                <button className="btn-secondary logout-button" type="button" onClick={handleLogout}>
                    Sair
                </button>
            </aside>
            <main className="app-main">
                <header className="app-header">
                    <div>
                        <h1>{title}</h1>
                        {subtitle && <p>{subtitle}</p>}
                    </div>
                    <div className="app-actions">
                        {actions}
                        <button
                            type="button"
                            className="btn-ghost"
                            onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
                        >
                            {theme === "light" ? "Tema: Claro" : "Tema: Escuro"}
                        </button>
                    </div>
                </header>
                {children}
            </main>
        </div>
    );
}
