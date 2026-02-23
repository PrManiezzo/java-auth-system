import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { saveSession } from "../services/authStorage";
import AuthCard from "../components/AuthCard";

export default function LoginPage() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: "", password: "" });
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const { data } = await api.post("/auth/login", form);
            saveSession(data.token, data.expiresIn, { name: data.name, email: data.email });
            navigate("/dashboard");
        } catch (error) {
            setMessage(error.response?.data?.message || "Erro ao fazer login");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-screen">
            <AuthCard title="Bem-vindo" subtitle="Faça login para continuar">
                <form onSubmit={handleSubmit} className="form">
                    <input
                        type="email"
                        placeholder="Seu e-mail"
                        value={form.email}
                        onChange={(event) => setForm({ ...form, email: event.target.value })}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Sua senha"
                        value={form.password}
                        onChange={(event) => setForm({ ...form, password: event.target.value })}
                        required
                    />
                    <button disabled={loading}>{loading ? "Entrando..." : "Entrar"}</button>
                </form>
                {message && <div className="alert">{message}</div>}
                <div className="links">
                    <Link to="/register">Criar conta</Link>
                    <Link to="/forgot-password">Esqueci minha senha</Link>
                </div>
            </AuthCard>
        </div>
    );
}
