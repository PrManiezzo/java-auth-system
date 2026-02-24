import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ChangeEvent, Dispatch, FormEvent, ReactNode, SetStateAction } from "react";
import axios from "axios";
import api from "../../services/api";

export type Summary = {
    monthlyIncome: number;
    monthlyExpense: number;
    monthlyBalance: number;
    totalPending: number;
    customers: number;
    lowStock: number;
};

export type Customer = {
    id: number;
    name: string;
    email?: string | null;
    phone?: string | null;
    notes?: string | null;
};

export type CustomerForm = {
    name: string;
    email: string;
    phone: string;
    notes: string;
};

export type CatalogItem = {
    id: number;
    name: string;
    sku?: string | null;
    qrCode?: string | null;
    type: "PRODUCT" | "SERVICE";
    unit?: string | null;
    unitPrice: number;
    costPrice?: number | null;
    description?: string | null;
    productImageBase64?: string | null;
    stockQuantity: number;
    minStock: number;
};

export type CatalogForm = {
    name: string;
    sku: string;
    qrCode: string;
    type: "PRODUCT" | "SERVICE";
    unit: string;
    unitPrice: string;
    costPrice: string;
    description: string;
    productImageBase64: string;
    stockQuantity: string;
    minStock: string;
};

export type Entry = {
    id: number;
    type: "INCOME" | "EXPENSE";
    status: "PENDING" | "PAID";
    amount: number;
    category: string;
    description: string;
    dueDate?: string | null;
    paidDate?: string | null;
};

export type EntryForm = {
    type: "INCOME" | "EXPENSE";
    status: "PENDING" | "PAID";
    amount: string;
    category: string;
    description: string;
    dueDate: string;
    paidDate: string;
};

export type QuoteItemForm = {
    description: string;
    unit: string;
    quantity: string;
    unitPrice: string;
};

export type QuoteForm = {
    customerName: string;
    status: "DRAFT" | "SENT" | "APPROVED" | "REJECTED";
    issueDate: string;
    validUntil: string;
    notes: string;
    items: QuoteItemForm[];
};

export type Quote = {
    id: number;
    customerName: string;
    status: string;
    total: number;
};

export type StockMovement = {
    id: number;
    itemName: string;
    type: "IN" | "OUT" | "ADJUST";
    quantity: number;
    reason?: string | null;
};

export type StockAdjust = {
    itemId: string;
    type: "IN" | "OUT" | "ADJUST";
    quantity: string;
    reason: string;
};

export type MessageType = "info" | "error" | "success";

export type FinanceContextValue = {
    summary: Summary | null;
    customers: Customer[];
    catalog: CatalogItem[];
    entries: Entry[];
    quotes: Quote[];
    stockMovements: StockMovement[];
    customerForm: CustomerForm;
    catalogForm: CatalogForm;
    entryForm: EntryForm;
    quoteForm: QuoteForm;
    stockAdjust: StockAdjust;
    message: string;
    messageType: MessageType;
    lowStock: CatalogItem[];
    formatCurrency: (value: number | string) => string;
    setCustomerForm: Dispatch<SetStateAction<CustomerForm>>;
    setCatalogForm: Dispatch<SetStateAction<CatalogForm>>;
    setEntryForm: Dispatch<SetStateAction<EntryForm>>;
    setQuoteForm: Dispatch<SetStateAction<QuoteForm>>;
    setStockAdjust: Dispatch<SetStateAction<StockAdjust>>;
    setMessage: Dispatch<SetStateAction<string>>;
    setMessageType: Dispatch<SetStateAction<MessageType>>;
    handleCreateCustomer: (event: FormEvent<HTMLFormElement>) => Promise<void>;
    handleCreateCatalog: (event: FormEvent<HTMLFormElement>) => Promise<void>;
    handleCreateEntry: (event: FormEvent<HTMLFormElement>) => Promise<void>;
    handleCreateQuote: (event: FormEvent<HTMLFormElement>) => Promise<void>;
    handleAdjustStock: (event: FormEvent<HTMLFormElement>) => Promise<void>;
    addQuoteItem: () => void;
    updateQuoteItem: (index: number, field: keyof QuoteItemForm, value: string) => void;
    handleCatalogImage: (event: ChangeEvent<HTMLInputElement>) => void;
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

const defaultCustomer: CustomerForm = { name: "", email: "", phone: "", notes: "" };
const defaultCatalog: CatalogForm = {
    name: "",
    sku: "",
    qrCode: "",
    type: "PRODUCT",
    unit: "un",
    unitPrice: "",
    costPrice: "",
    description: "",
    productImageBase64: "",
    stockQuantity: "0",
    minStock: "0",
};
const defaultEntry: EntryForm = {
    type: "INCOME",
    status: "PENDING",
    amount: "",
    category: "",
    description: "",
    dueDate: "",
    paidDate: "",
};
const defaultQuote: QuoteForm = {
    customerName: "",
    status: "DRAFT",
    issueDate: new Date().toISOString().slice(0, 10),
    validUntil: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    notes: "",
    items: [{ description: "", unit: "un", quantity: "1", unitPrice: "" }],
};

function formatCurrency(value: number | string) {
    const number = Number(value || 0);
    return number.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function getErrorMessage(error: unknown, fallback: string) {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data as { message?: string } | undefined;
        return data?.message || fallback;
    }
    return fallback;
}

export function FinanceProvider({ children }: { children: ReactNode }) {
    const [summary, setSummary] = useState<Summary | null>(null);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [catalog, setCatalog] = useState<CatalogItem[]>([]);
    const [entries, setEntries] = useState<Entry[]>([]);
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);

    const [customerForm, setCustomerForm] = useState<CustomerForm>(defaultCustomer);
    const [catalogForm, setCatalogForm] = useState<CatalogForm>(defaultCatalog);
    const [entryForm, setEntryForm] = useState<EntryForm>(defaultEntry);
    const [quoteForm, setQuoteForm] = useState<QuoteForm>(defaultQuote);
    const [stockAdjust, setStockAdjust] = useState<StockAdjust>({ itemId: "", type: "IN", quantity: "", reason: "" });
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<MessageType>("info");

    useEffect(() => {
        fetchAll();
    }, []);

    async function fetchAll() {
        try {
            const [summaryRes, customersRes, catalogRes, entriesRes, quotesRes, stockRes] = await Promise.all([
                api.get<Summary>("/finance/summary"),
                api.get<Customer[]>("/finance/customers"),
                api.get<CatalogItem[]>("/finance/catalog"),
                api.get<Entry[]>("/finance/entries"),
                api.get<Quote[]>("/finance/quotes"),
                api.get<StockMovement[]>("/finance/catalog/stock/movements"),
            ]);
            setSummary(summaryRes.data);
            setCustomers(customersRes.data);
            setCatalog(catalogRes.data);
            setEntries(entriesRes.data);
            setQuotes(quotesRes.data);
            setStockMovements(stockRes.data);
        } catch (error) {
            setMessage("Nao foi possivel carregar o modulo financeiro");
            setMessageType("error");
        }
    }

    async function handleCreateCustomer(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setMessage("");
        try {
            await api.post("/finance/customers", customerForm);
            setCustomerForm(defaultCustomer);
            await fetchAll();
            setMessage("Cliente salvo com sucesso");
            setMessageType("success");
        } catch (error) {
            setMessage(getErrorMessage(error, "Erro ao salvar cliente"));
            setMessageType("error");
        }
    }

    async function handleCreateCatalog(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setMessage("");
        try {
            const payload = {
                ...catalogForm,
                unitPrice: Number(catalogForm.unitPrice || 0),
                costPrice: catalogForm.costPrice ? Number(catalogForm.costPrice) : null,
                stockQuantity: Number(catalogForm.stockQuantity || 0),
                minStock: Number(catalogForm.minStock || 0),
            };
            await api.post("/finance/catalog", payload);
            setCatalogForm(defaultCatalog);
            await fetchAll();
            setMessage("Item do catálogo salvo");
            setMessageType("success");
        } catch (error) {
            setMessage(getErrorMessage(error, "Erro ao salvar item"));
            setMessageType("error");
        }
    }

    async function handleCreateEntry(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setMessage("");
        try {
            const payload = {
                ...entryForm,
                amount: Number(entryForm.amount || 0),
                dueDate: entryForm.dueDate || null,
                paidDate: entryForm.paidDate || null,
            };
            await api.post("/finance/entries", payload);
            setEntryForm(defaultEntry);
            await fetchAll();
            setMessage("Lançamento salvo");
            setMessageType("success");
        } catch (error) {
            setMessage(getErrorMessage(error, "Erro ao salvar lançamento"));
            setMessageType("error");
        }
    }

    async function handleCreateQuote(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setMessage("");
        try {
            const payload = {
                ...quoteForm,
                items: quoteForm.items.map((item) => ({
                    description: item.description,
                    unit: item.unit,
                    quantity: Number(item.quantity || 0),
                    unitPrice: Number(item.unitPrice || 0),
                })),
            };
            await api.post("/finance/quotes", payload);
            setQuoteForm(defaultQuote);
            await fetchAll();
            setMessage("Orçamento criado");
            setMessageType("success");
        } catch (error) {
            setMessage(getErrorMessage(error, "Erro ao criar orçamento"));
            setMessageType("error");
        }
    }

    async function handleAdjustStock(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setMessage("");
        try {
            await api.post(`/finance/catalog/${stockAdjust.itemId}/stock-adjust`, {
                type: stockAdjust.type,
                quantity: Number(stockAdjust.quantity || 0),
                reason: stockAdjust.reason,
            });
            setStockAdjust({ itemId: "", type: "IN", quantity: "", reason: "" });
            await fetchAll();
            setMessage("Estoque atualizado");
            setMessageType("success");
        } catch (error) {
            setMessage(getErrorMessage(error, "Erro ao ajustar estoque"));
            setMessageType("error");
        }
    }

    function updateQuoteItem(index: number, field: keyof QuoteItemForm, value: string) {
        setQuoteForm((current) => {
            const items = current.items.map((item, idx) =>
                idx === index ? { ...item, [field]: value } : item
            );
            return { ...current, items };
        });
    }

    function addQuoteItem() {
        setQuoteForm((current) => ({
            ...current,
            items: [...current.items, { description: "", unit: "un", quantity: "1", unitPrice: "" }],
        }));
    }

    function handleCatalogImage(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            setMessage("Selecione uma imagem valida");
            setMessageType("error");
            return;
        }
        const maxBytes = 1.5 * 1024 * 1024;
        if (file.size > maxBytes) {
            setMessage("A imagem deve ter no maximo 1.5MB");
            setMessageType("error");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            setCatalogForm((current) => ({ ...current, productImageBase64: String(reader.result || "") }));
            setMessage("Foto pronta para salvar no item");
            setMessageType("info");
        };
        reader.readAsDataURL(file);
    }

    const lowStock = useMemo(
        () => catalog.filter((item) => Number(item.stockQuantity) <= Number(item.minStock)),
        [catalog]
    );

    const value = {
        summary,
        customers,
        catalog,
        entries,
        quotes,
        stockMovements,
        customerForm,
        catalogForm,
        entryForm,
        quoteForm,
        stockAdjust,
        message,
        messageType,
        lowStock,
        formatCurrency,
        setCustomerForm,
        setCatalogForm,
        setEntryForm,
        setQuoteForm,
        setStockAdjust,
        setMessage,
        setMessageType,
        handleCreateCustomer,
        handleCreateCatalog,
        handleCreateEntry,
        handleCreateQuote,
        handleAdjustStock,
        addQuoteItem,
        updateQuoteItem,
        handleCatalogImage,
    };

    return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
    const context = useContext(FinanceContext);
    if (!context) {
        throw new Error("useFinance deve ser usado dentro de FinanceProvider");
    }
    return context;
}
