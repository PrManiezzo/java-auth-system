import { Link } from "react-router-dom";

export default function FinanceHeader() {
    return (
        <div className="finance-header">
            <div>
                <h1>Financeiro do Negócio</h1>
                <p>Controle completo: clientes, catálogo, estoque, orçamentos e lançamentos.</p>
            </div>
            <Link className="btn-secondary" to="/dashboard">Voltar ao painel</Link>
        </div>
    );
}
