import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { Entry, EntryForm } from "./FinanceContext";

type EntriesSectionProps = {
    entries: Entry[];
    form: EntryForm;
    setForm: Dispatch<SetStateAction<EntryForm>>;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    formatCurrency: (value: number | string) => string;
};

export default function EntriesSection({ entries, form, setForm, onSubmit, formatCurrency }: EntriesSectionProps) {
    return (
        <section className="finance-card" id="lancamentos">
            <div className="section-header">
                <h2>Lançamentos</h2>
                <span>{entries.length} registros</span>
            </div>
            <form className="form" onSubmit={onSubmit}>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="INCOME">Receita</option>
                    <option value="EXPENSE">Despesa</option>
                </select>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="PENDING">Pendente</option>
                    <option value="PAID">Pago</option>
                </select>
                <input type="number" step="0.01" placeholder="Valor" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
                <input placeholder="Categoria" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
                <input placeholder="Descricao" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
                <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                <input type="date" value={form.paidDate} onChange={(e) => setForm({ ...form, paidDate: e.target.value })} />
                <button>Salvar lancamento</button>
            </form>
            <div className="list">
                {entries.map((entry) => (
                    <div key={entry.id} className={`list-row ${entry.type === "EXPENSE" ? "row-expense" : "row-income"}`}>
                        <strong>{entry.description}</strong>
                        <span>{entry.category}</span>
                        <span>{formatCurrency(entry.amount)}</span>
                        <span>{entry.status === "PAID" ? "Pago" : "Pendente"}</span>
                    </div>
                ))}
            </div>
        </section>
    );
}
