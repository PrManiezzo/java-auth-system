import AppShell from "../../components/layout/AppShell";
import EntriesSection from "../../components/finance/EntriesSection";
import { FinanceProvider, useFinance } from "../../components/finance/FinanceContext";

export default function FinanceEntriesPage() {
    return (
        <FinanceProvider>
            <FinanceEntriesContent />
        </FinanceProvider>
    );
}

function FinanceEntriesContent() {
    const { entries, entryForm, setEntryForm, handleCreateEntry, formatCurrency, message, messageType } = useFinance();

    return (
        <AppShell title="Lançamentos" subtitle="Controle de receitas e despesas">
            {message && (
                <div className={`alert ${messageType === "error" ? "alert-error" : messageType === "success" ? "alert-success" : ""}`}>
                    {message}
                </div>
            )}
            <EntriesSection
                entries={entries}
                form={entryForm}
                setForm={setEntryForm}
                onSubmit={handleCreateEntry}
                formatCurrency={formatCurrency}
            />
        </AppShell>
    );
}
