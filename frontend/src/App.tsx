import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import FinanceCustomersPage from "./pages/finance/FinanceCustomersPage";
import FinanceCatalogPage from "./pages/finance/FinanceCatalogPage";
import FinanceEntriesPage from "./pages/finance/FinanceEntriesPage";
import FinanceQuotesPage from "./pages/finance/FinanceQuotesPage";
import FinanceStockPage from "./pages/finance/FinanceStockPage";
import ServiceOrdersPage from "./pages/ServiceOrdersPage";
import SalesPage from "./pages/SalesPage";
import PDVPage from "./pages/PDVPage";
import NFeImportPage from "./pages/NFeImportPage";
import SettingsPage from "./pages/SettingsPage";
import { getToken, isTokenExpired } from "./services/authStorage";

type PrivateRouteProps = {
    children: ReactNode;
};

function PrivateRoute({ children }: PrivateRouteProps) {
    const token = getToken();
    if (!token || isTokenExpired()) {
        return <Navigate to="/login" replace />;
    }
    return children;
}

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route
                path="/dashboard"
                element={
                    <PrivateRoute>
                        <DashboardPage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/profile"
                element={
                    <PrivateRoute>
                        <ProfilePage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/service-orders"
                element={
                    <PrivateRoute>
                        <ServiceOrdersPage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/sales"
                element={
                    <PrivateRoute>
                        <SalesPage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/pdv"
                element={
                    <PrivateRoute>
                        <PDVPage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/finance/customers"
                element={
                    <PrivateRoute>
                        <FinanceCustomersPage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/finance/catalog"
                element={
                    <PrivateRoute>
                        <FinanceCatalogPage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/finance/entries"
                element={
                    <PrivateRoute>
                        <FinanceEntriesPage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/finance/quotes"
                element={
                    <PrivateRoute>
                        <FinanceQuotesPage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/finance/stock"
                element={
                    <PrivateRoute>
                        <FinanceStockPage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/finance/nfe-import"
                element={
                    <PrivateRoute>
                        <NFeImportPage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/settings"
                element={
                    <PrivateRoute>
                        <SettingsPage />
                    </PrivateRoute>
                }
            />
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
}
