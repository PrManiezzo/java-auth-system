import AppShell from "../../components/layout/AppShell";
import CustomersSection from "../../components/finance/CustomersSection";
import { FinanceProvider, useFinance } from "../../components/finance/FinanceContext";

export default function FinanceCustomersPage() {
    return (
        <FinanceProvider>
            <FinanceCustomersContent />
        </FinanceProvider>
    );
}

function FinanceCustomersContent() {
    const { customers, customerForm, setCustomerForm, handleCreateCustomer, message, messageType } = useFinance();

    return (
        <AppShell title="Clientes" subtitle="Gerencie seus clientes">
            {message && (
                <div className={`alert ${messageType === "error" ? "alert-error" : messageType === "success" ? "alert-success" : ""}`}>
                    {message}
                </div>
            )}
            <CustomersSection
                customers={customers}
                form={customerForm}
                setForm={setCustomerForm}
                onSubmit={handleCreateCustomer}
            />
        </AppShell>
    );
}
