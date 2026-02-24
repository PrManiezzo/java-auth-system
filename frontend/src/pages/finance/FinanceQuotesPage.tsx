import AppShell from "../../components/layout/AppShell";
import QuotesSection from "../../components/finance/QuotesSection";
import { FinanceProvider, useFinance } from "../../components/finance/FinanceContext";

export default function FinanceQuotesPage() {
    return (
        <FinanceProvider>
            <FinanceQuotesContent />
        </FinanceProvider>
    );
}

function FinanceQuotesContent() {
    const {
        quotes,
        quoteForm,
        setQuoteForm,
        handleCreateQuote,
        addQuoteItem,
        updateQuoteItem,
        formatCurrency,
        customers,
        catalog,
        message,
        messageType
    } = useFinance();

    return (
        <AppShell title="Orçamentos" subtitle="Crie e gerencie orçamentos">
            {message && (
                <div className={`alert ${messageType === "error" ? "alert-error" : messageType === "success" ? "alert-success" : ""}`}>
                    {message}
                </div>
            )}
            <QuotesSection
                quotes={quotes}
                form={quoteForm}
                setForm={setQuoteForm}
                onSubmit={handleCreateQuote}
                onAddItem={addQuoteItem}
                onUpdateItem={updateQuoteItem}
                formatCurrency={formatCurrency}
                customers={customers}
                catalog={catalog}
            />
        </AppShell>
    );
}
