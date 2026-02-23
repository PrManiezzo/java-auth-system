import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { clearSession, getUser, isTokenExpired } from "../services/authStorage";

function formatRemainingTime() {
    const exp = Number(localStorage.getItem("auth_expiration") || 0);
    const seconds = Math.max(0, Math.floor((exp - Date.now()) / 1000));
    const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
}

export default function DashboardPage() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(getUser());
    const [remaining, setRemaining] = useState(formatRemainingTime());

    useEffect(() => {
        if (isTokenExpired()) {
            clearSession();
            navigate("/login");
            return;
        }

        const interval = setInterval(() => {
            if (isTokenExpired()) {
                clearSession();
                navigate("/login");
            } else {
                setRemaining(formatRemainingTime());
            }
        }, 1000);

        api.get("/auth/me").then((response) => setProfile(response.data)).catch(() => {
            clearSession();
            navigate("/login");
        });

        return () => clearInterval(interval);
    }, [navigate]);

    function handleLogout() {
        clearSession();
        navigate("/login");
    }

    return (
        <div className="dashboard-screen">
            <div className="dashboard-card">
                <div className="dashboard-top">
                    {profile?.avatarBase64 ? (
                        <img src={profile.avatarBase64} alt="Foto de perfil" className="avatar" />
                    ) : (
                        <div className="avatar avatar-placeholder">Sem foto</div>
                    )}
                    <div>
                        <h1>Login realizado com sucesso ✅</h1>
                        <p>Você está autenticado no sistema.</p>
                    </div>
                </div>

                <div className="info-grid">
                    <div>
                        <span>Nome</span>
                        <strong>{profile?.name || "Usuário"}</strong>
                    </div>
                    <div>
                        <span>E-mail</span>
                        <strong>{profile?.email || "-"}</strong>
                    </div>
                    <div>
                        <span>Sessão expira em</span>
                        <strong className="session-time">{remaining}</strong>
                    </div>
                    <div>
                        <span>Status</span>
                        <strong className="badge-ok">Logado</strong>
                    </div>
                </div>

                <div className="action-row">
                    <button className="btn-secondary" onClick={() => navigate("/profile")}>Editar cadastro e foto</button>
                    <button onClick={handleLogout}>Sair</button>
                </div>
            </div>
        </div>
    );
}
