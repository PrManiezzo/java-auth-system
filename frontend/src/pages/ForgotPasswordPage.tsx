import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import api from "../services/api";
import AuthCard from "../components/AuthCard";

type ForgotPasswordResponse = {
    message?: string;
    resetToken?: string;
};

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [tokenHint, setTokenHint] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setMessage("");
        setTokenHint("");

        try {
            const { data } = await api.post<ForgotPasswordResponse>("/auth/forgot-password", { email });
            setMessage(data.message || "Solicitação processada");
            if (data.resetToken) {
                setTokenHint(data.resetToken);
            }
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                const payload = error.response?.data as { message?: string } | undefined;
                setMessage(payload?.message || "Erro ao solicitar recuperação");
            } else {
                setMessage("Erro ao solicitar recuperação");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-screen">
            <AuthCard title="Recuperar senha" subtitle="Digite seu e-mail para receber o link de recuperação">
                <form onSubmit={handleSubmit} className="form">
                    <input
                        type="email"
                        placeholder="Seu e-mail"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                    />
                    <button disabled={loading}>{loading ? "Enviando..." : "Enviar e-mail"}</button>
                </form>
                {message && <div className="alert">{message}</div>}
                {tokenHint && (
                    <div className="token-box">
                        Token para teste: <strong>{tokenHint}</strong>
                    </div>
                )}
                <div className="links">
                    <Link to="/reset-password">Já tenho token</Link>
                    <Link to="/login">Voltar ao login</Link>
                </div>
            </AuthCard>
        </div>
    );
}
