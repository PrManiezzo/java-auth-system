import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { Customer, CustomerForm } from "./FinanceContext";

type CustomersSectionProps = {
    customers: Customer[];
    form: CustomerForm;
    setForm: Dispatch<SetStateAction<CustomerForm>>;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function CustomersSection({ customers, form, setForm, onSubmit }: CustomersSectionProps) {
    return (
        <section className="finance-card" id="clientes">
            <div className="section-header">
                <h2>Clientes</h2>
                <span>{customers.length} cadastrados</span>
            </div>
            <form className="form" onSubmit={onSubmit}>
                <input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <input placeholder="Telefone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <textarea className="input-textarea" placeholder="Notas" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                <button>Salvar cliente</button>
            </form>
            <div className="list">
                {customers.map((customer) => (
                    <div key={customer.id} className="list-row">
                        <strong>{customer.name}</strong>
                        <span>{customer.email || "-"}</span>
                        <span>{customer.phone || "-"}</span>
                    </div>
                ))}
            </div>
        </section>
    );
}
