import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import AuthCard from "../components/AuthCard";

export default function RegisterPage() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            await api.post("/auth/register", form);
            setMessage("Cadastro realizado com sucesso! Redirecionando...");
            setTimeout(() => navigate("/login"), 1200);
        } catch (error) {
            setMessage(error.response?.data?.message || "Erro ao cadastrar");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-screen">
            <AuthCard title="Criar conta" subtitle="Cadastro rápido e seguro">
                <form onSubmit={handleSubmit} className="form">
                    <input
                        type="text"
                        placeholder="Seu nome"
                        value={form.name}
                        onChange={(event) => setForm({ ...form, name: event.target.value })}
                        required
                    />
                    <input
                        type="email"
                        placeholder="Seu e-mail"
                        value={form.email}
                        onChange={(event) => setForm({ ...form, email: event.target.value })}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Crie uma senha (mínimo 6)"
                        value={form.password}
                        onChange={(event) => setForm({ ...form, password: event.target.value })}
                        required
                    />
                    <button disabled={loading}>{loading ? "Cadastrando..." : "Cadastrar"}</button>
                </form>
                {message && <div className="alert">{message}</div>}
                <div className="links">
                    <Link to="/login">Voltar ao login</Link>
                </div>
            </AuthCard>
        </div>
    );
}
