import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import AuthCard from "../components/AuthCard";

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [form, setForm] = useState({ token: "", newPassword: "" });
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const tokenFromUrl = searchParams.get("token");
        if (tokenFromUrl) {
            setForm((current) => ({ ...current, token: tokenFromUrl }));
        }
    }, [searchParams]);

    async function handleSubmit(event) {
        event.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const { data } = await api.post("/auth/reset-password", form);
            setMessage(data.message || "Senha redefinida com sucesso");
            setTimeout(() => navigate("/login"), 1200);
        } catch (error) {
            setMessage(error.response?.data?.message || "Erro ao redefinir senha");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-screen">
            <AuthCard title="Nova senha" subtitle="Use o token para redefinir sua senha">
                <form onSubmit={handleSubmit} className="form">
                    <input
                        type="text"
                        placeholder="Token de recuperação"
                        value={form.token}
                        onChange={(event) => setForm({ ...form, token: event.target.value })}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Nova senha"
                        value={form.newPassword}
                        onChange={(event) => setForm({ ...form, newPassword: event.target.value })}
                        required
                    />
                    <button disabled={loading}>{loading ? "Salvando..." : "Redefinir senha"}</button>
                </form>
                {message && <div className="alert">{message}</div>}
                <div className="links">
                    <Link to="/login">Voltar ao login</Link>
                </div>
            </AuthCard>
        </div>
    );
}
