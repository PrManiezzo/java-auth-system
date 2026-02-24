import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../services/api";
import { saveSession } from "../services/authStorage";
import AuthCard from "../components/AuthCard";

type LoginForm = {
    email: string;
    password: string;
};

type LoginResponse = {
    token: string;
    expiresIn: number;
    name: string;
    email: string;
};

export default function LoginPage() {
    const navigate = useNavigate();
    const [form, setForm] = useState<LoginForm>({ email: "", password: "" });
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const { data } = await api.post<LoginResponse>("/auth/login", form);
            saveSession(data.token, data.expiresIn, { name: data.name, email: data.email });
            navigate("/dashboard");
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                const data = error.response?.data as { message?: string } | undefined;
                setMessage(data?.message || "Erro ao fazer login");
            } else {
                setMessage("Erro ao fazer login");
            }
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
